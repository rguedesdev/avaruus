import multipart from "@fastify/multipart";
import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { Types } from "mongoose";

import { env } from "../config/env.js";
import {
  AVATAR_UPLOAD_WINDOW_LIMIT,
  AVATAR_UPLOAD_WINDOW_MS,
  MAX_AVATAR_UPLOAD_BYTES,
  MAX_UNATTACHED_AVATARS_PER_USER,
} from "../config/media.js";
import { MediaModel } from "../graphql/modules/media/model.js";
import MediaService, { serializeMedia } from "../graphql/modules/media/service.js";
import { authenticateRequest } from "../services/auth/authenticate.js";
import { StorageService } from "../services/storage.js";
import {
  processAvatar,
  processProductImage,
  sanitizeOriginalName,
  validateImageDeclaration,
} from "../services/upload.js";

async function registerUploadRoutes(app: FastifyInstance) {
  await app.register(multipart, {
    limits: { files: 1, fields: 0, fileSize: 100 * 1024 * 1024 },
  });

  app.post("/uploads/images", async (request, reply) => {
    const user = authenticateRequest(request);
    if (!user) return reply.status(401).send({ error: "Usuário não autenticado." });

    const { purpose } = request.query as { purpose?: string };
    if (purpose !== "USER_AVATAR" && purpose !== "SELLER_AVATAR" && purpose !== "PRODUCT_IMAGE") {
      return reply.status(400).send({ error: "Finalidade de upload inválida." });
    }

    const isProductImage = purpose === "PRODUCT_IMAGE";
    const purposeFilter = isProductImage ? { $in: ["PRODUCT_IMAGE", "PRODUCT_VIDEO"] } : { $in: ["USER_AVATAR", "SELLER_AVATAR"] };
    const [unattachedCount, recentCount] = await Promise.all([
      MediaModel.countDocuments({ ownerID: user.id, purpose: purposeFilter, resourceID: null }),
      MediaModel.countDocuments({ ownerID: user.id, purpose: purposeFilter, createdAt: { $gte: new Date(Date.now() - AVATAR_UPLOAD_WINDOW_MS) } }),
    ]);
    const unattachedLimit = isProductImage ? 100 : MAX_UNATTACHED_AVATARS_PER_USER;
    const uploadWindowLimit = isProductImage ? 100 : AVATAR_UPLOAD_WINDOW_LIMIT;
    if (unattachedCount >= unattachedLimit) {
      return reply.status(409).send({ error: "Associe ou descarte o upload anterior antes de enviar outra imagem." });
    }
    if (recentCount >= uploadWindowLimit) {
      return reply.status(429).send({ error: "Limite de uploads atingido. Tente novamente mais tarde." });
    }

    let part;
    try {
      part = await request.file();
    } catch (error) {
      request.log.warn({ error, userID: user.id }, "Upload rejeitado pelo parser");
      return reply.status(413).send({ error: "Arquivo ausente ou maior que 5 MB." });
    }
    if (!part) return reply.status(400).send({ error: "Envie uma imagem no campo file." });

    try {
      const source = await part.toBuffer();
      validateImageDeclaration(part.filename, part.mimetype, source.length, purpose === "PRODUCT_IMAGE" ? 20 * 1024 * 1024 : MAX_AVATAR_UPLOAD_BYTES);
      const processed = purpose === "PRODUCT_IMAGE" ? await processProductImage(source, part.mimetype) : await processAvatar(source, part.mimetype);
      const storageKey = `users/${user.id}/avatars/${randomUUID()}.webp`;

      await StorageService.uploadFile(storageKey, processed.body);
      try {
        const media = await MediaModel.create({
          ownerID: user.id,
          storageKey,
          originalName: sanitizeOriginalName(part.filename),
          mimeType: processed.mimeType,
          originalMimeType: part.mimetype,
          originalSize: source.length,
          size: processed.size,
          width: processed.width,
          height: processed.height,
          purpose,
          status: "READY",
          resourceType: null,
          resourceID: null,
        });
        request.log.info({ mediaID: media.id, userID: user.id }, "Avatar processado em WebP");
        return reply.status(201).send({ media: serializeMedia(media.toObject()) });
      } catch (error) {
        await StorageService.deleteFile(storageKey);
        throw error;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao processar a imagem.";
      request.log.warn({ error, userID: user.id }, "Upload de avatar rejeitado");
      return reply.status(400).send({ error: message });
    }
  });

  app.post("/uploads/videos", async (request, reply) => {
    const user = authenticateRequest(request);
    if (!user) return reply.status(401).send({ error: "Usuário não autenticado." });
    const productMediaFilter = { $in: ["PRODUCT_IMAGE", "PRODUCT_VIDEO"] };
    const [unattachedCount, recentCount] = await Promise.all([
      MediaModel.countDocuments({ ownerID: user.id, purpose: productMediaFilter, resourceID: null }),
      MediaModel.countDocuments({ ownerID: user.id, purpose: productMediaFilter, createdAt: { $gte: new Date(Date.now() - AVATAR_UPLOAD_WINDOW_MS) } }),
    ]);
    if (unattachedCount >= 100) return reply.status(409).send({ error: "Muitas mídias pendentes. Remova mídias sem uso antes de enviar outro arquivo." });
    if (recentCount >= 100) return reply.status(429).send({ error: "Limite de uploads de produto atingido. Tente novamente mais tarde." });
    const part = await request.file().catch(() => null);
    if (!part) return reply.status(400).send({ error: "Selecione um vídeo MP4 ou WebM." });
    const declaredVideo = ["video/mp4", "video/webm", "video/quicktime", "application/octet-stream"].includes(part.mimetype);
    if (!declaredVideo) return reply.status(400).send({ error: "Use um vídeo MP4 ou WebM." });
    try {
      const body = await part.toBuffer();
      if (body.length > 100 * 1024 * 1024) return reply.status(413).send({ error: "O vídeo excede o limite de 100 MB." });
      const isMP4 = body.length >= 12 && body.toString("ascii", 4, 8) === "ftyp";
      const isWebM = body.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
      if (!isMP4 && !isWebM) return reply.status(400).send({ error: "O conteúdo do arquivo não corresponde ao formato declarado." });
      const storageKey = `users/${user.id}/products/${randomUUID()}${isMP4 ? ".mp4" : ".webm"}`;
      await StorageService.uploadFile(storageKey, body);
      try {
        const videoMimeType = isMP4 ? "video/mp4" : "video/webm";
        const media = await MediaModel.create({ ownerID: user.id, storageKey, originalName: sanitizeOriginalName(part.filename), mimeType: videoMimeType, originalMimeType: part.mimetype, originalSize: body.length, size: body.length, width: 1, height: 1, purpose: "PRODUCT_VIDEO", status: "READY", resourceType: null, resourceID: null });
        return reply.status(201).send({ media: { id: media.id, url: `${env.API_PUBLIC_URL.replace(/\/$/, "")}/uploads/media/${media.id}` } });
      } catch (error) { await StorageService.deleteFile(storageKey); throw error; }
    } catch (error) {
      request.log.warn({ error, userID: user.id }, "Upload de vídeo rejeitado");
      return reply.status(400).send({ error: error instanceof Error ? error.message : "Falha ao enviar o vídeo." });
    }
  });

  app.get("/uploads/images/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!Types.ObjectId.isValid(id)) return reply.status(404).send();
    const media = await MediaModel.findOne({ _id: id, status: "READY" }).lean();
    if (!media) return reply.status(404).send();

    try {
      const body = await StorageService.getFile(media.storageKey);
      return reply
        .header("Content-Type", "image/webp")
        .header("Cache-Control", "public, max-age=31536000, immutable")
        .send(body);
    } catch (error) {
      request.log.error({ error, mediaID: id }, "Falha ao ler avatar");
      return reply.status(404).send();
    }
  });

  app.get("/uploads/media/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!Types.ObjectId.isValid(id)) return reply.status(404).send();
    const media = await MediaModel.findOne({ _id: id, purpose: "PRODUCT_VIDEO", status: "READY" }).lean();
    if (!media) return reply.status(404).send();
    try {
      const body = await StorageService.getFile(media.storageKey);
      const range = request.headers.range;
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!match) return reply.status(416).header("Content-Range", `bytes */${body.length}`).send();
        const start = match[1] ? Number(match[1]) : 0;
        const end = match[2] ? Math.min(Number(match[2]), body.length - 1) : body.length - 1;
        if (start > end || start >= body.length) return reply.status(416).header("Content-Range", `bytes */${body.length}`).send();
        return reply.status(206).header("Content-Type", media.mimeType).header("Accept-Ranges", "bytes").header("Content-Range", `bytes ${start}-${end}/${body.length}`).header("Content-Length", end - start + 1).header("Cache-Control", "public, max-age=31536000, immutable").send(body.subarray(start, end + 1));
      }
      return reply.header("Content-Type", media.mimeType).header("Accept-Ranges", "bytes").header("Content-Length", body.length).header("Cache-Control", "public, max-age=31536000, immutable").send(body);
    } catch (error) { request.log.error({ error, mediaID: id }, "Falha ao ler vídeo"); return reply.status(404).send(); }
  });

  app.delete("/uploads/images/:id", async (request, reply) => {
    const user = authenticateRequest(request);
    if (!user) return reply.status(401).send({ error: "Usuário não autenticado." });
    const { id } = request.params as { id: string };
    const deleted = await MediaService.deleteUnattached(id, user.id);
    return reply.status(deleted ? 204 : 404).send();
  });
}

export { registerUploadRoutes };
