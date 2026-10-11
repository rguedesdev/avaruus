import path from "node:path";
import sharp from "sharp";

import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  AVATAR_OUTPUT_SIZE,
  MAX_AVATAR_INPUT_PIXELS,
  MAX_AVATAR_UPLOAD_BYTES,
} from "../config/media.js";

const formatToMime = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

function sanitizeOriginalName(name: string) {
  return path.basename(name).replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180) || "image";
}

function validateImageDeclaration(filename: string, mimeType: string, size: number, maxBytes = MAX_AVATAR_UPLOAD_BYTES) {
  const extension = path.extname(filename).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension as any)) {
    throw new Error("Extensão não permitida. Use JPG, PNG ou WebP.");
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as any)) {
    throw new Error("Tipo de arquivo não permitido. Use JPG, PNG ou WebP.");
  }
  if (size > maxBytes) {
    throw new Error(`A imagem excede o limite de ${Math.round(maxBytes / 1024 / 1024)} MB.`);
  }
}

async function processAvatar(source: Buffer, declaredMimeType: string) {
  const input = sharp(source, {
    failOn: "warning",
    limitInputPixels: MAX_AVATAR_INPUT_PIXELS,
  });
  const metadata = await input.metadata();
  const actualMime = metadata.format
    ? formatToMime[metadata.format as keyof typeof formatToMime]
    : undefined;

  if (!actualMime || actualMime !== declaredMimeType) {
    throw new Error("O conteúdo real do arquivo não corresponde ao tipo informado.");
  }
  if (!metadata.width || !metadata.height) {
    throw new Error("Não foi possível identificar as dimensões da imagem.");
  }

  const body = await input
    .rotate()
    .resize({
      width: AVATAR_OUTPUT_SIZE,
      height: AVATAR_OUTPUT_SIZE,
      fit: "cover",
      position: "center",
      withoutEnlargement: true,
    })
    .webp({ quality: 84, effort: 4 })
    .toBuffer();
  const output = await sharp(body).metadata();

  return {
    body,
    mimeType: "image/webp" as const,
    size: body.length,
    width: output.width!,
    height: output.height!,
  };
}

async function processProductImage(source: Buffer, declaredMimeType: string) {
  const input = sharp(source, { failOn: "none", limitInputPixels: 60_000_000 });
  const metadata = await input.metadata();
  const actualMime = metadata.format ? formatToMime[metadata.format as keyof typeof formatToMime] : undefined;
  if (!actualMime || actualMime !== declaredMimeType || !metadata.width || !metadata.height) throw new Error("O conteúdo real do arquivo não corresponde ao tipo informado.");
  const body = await input.rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 88, effort: 4 }).toBuffer();
  const output = await sharp(body).metadata();
  return { body, mimeType: "image/webp" as const, size: body.length, width: output.width!, height: output.height! };
}

export { processAvatar, processProductImage, sanitizeOriginalName, validateImageDeclaration };
