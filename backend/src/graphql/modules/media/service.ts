import { Types } from "mongoose";

import { env } from "../../../config/env.js";
import { UNATTACHED_MEDIA_MAX_AGE_MS } from "../../../config/media.js";
import { StorageService } from "../../../services/storage.js";
import { graphQLError } from "../../errors.js";
import { MediaModel } from "./model.js";

function mediaUrl(mediaID: unknown) {
  return `${env.API_PUBLIC_URL.replace(/\/$/, "")}/uploads/images/${String(mediaID)}`;
}

function serializeMedia(media: any) {
  const id = media._id?.toString() ?? media.id?.toString();
  return {
    id,
    url: mediaUrl(id),
    mimeType: media.mimeType,
    size: media.size,
    width: media.width,
    height: media.height,
  };
}

class MediaService {
  static async requireAttachableAvatar(mediaID: unknown, ownerID: string) {
    if (!Types.ObjectId.isValid(String(mediaID))) {
      throw graphQLError("Imagem inválida.", "BAD_USER_INPUT");
    }
    const media = await MediaModel.findOne({
      _id: mediaID,
      ownerID,
      purpose: "USER_AVATAR",
      status: "READY",
      resourceID: null,
    }).lean();
    if (!media) {
      throw graphQLError("A imagem não existe, já foi usada ou pertence a outro usuário.", "BAD_USER_INPUT");
    }
    return media;
  }

  static async attachAvatar(mediaID: unknown, ownerID: string) {
    const media = await MediaModel.findOneAndUpdate(
      {
        _id: mediaID,
        ownerID,
        purpose: "USER_AVATAR",
        status: "READY",
        resourceID: null,
      },
      { $set: { resourceType: "USER", resourceID: ownerID } },
      { new: true },
    );
    if (!media) throw graphQLError("Não foi possível associar a imagem ao perfil.", "CONFLICT");
    return media;
  }

  static async requireAttachableSellerAvatar(mediaID: unknown, ownerID: string) {
    if (!Types.ObjectId.isValid(String(mediaID))) throw graphQLError("Imagem inválida.", "BAD_USER_INPUT");
    const media = await MediaModel.findOne({ _id: mediaID, ownerID, purpose: "SELLER_AVATAR", status: "READY", resourceID: null }).lean();
    if (!media) throw graphQLError("A imagem não existe, já foi usada ou pertence a outro usuário.", "BAD_USER_INPUT");
    return media;
  }

  static async attachSellerAvatar(mediaID: unknown, ownerID: string, settingsID: string) {
    const media = await MediaModel.findOneAndUpdate(
      { _id: mediaID, ownerID, purpose: "SELLER_AVATAR", status: "READY", resourceID: null },
      { $set: { resourceType: "SELLER_SETTINGS", resourceID: settingsID } }, { new: true },
    );
    if (!media) throw graphQLError("Não foi possível associar a imagem à loja.", "CONFLICT");
    return media;
  }

  static async detachSellerAvatar(mediaID: unknown, ownerID: string, settingsID: string) {
    if (!mediaID) return;
    await MediaModel.updateOne(
      { _id: mediaID, ownerID, purpose: "SELLER_AVATAR", resourceType: "SELLER_SETTINGS", resourceID: settingsID },
      { $set: { resourceType: null, resourceID: null } },
    );
  }

  static async detachAvatar(mediaID: unknown, ownerID: string) {
    if (!mediaID) return;
    await MediaModel.updateOne(
      { _id: mediaID, ownerID, resourceType: "USER", resourceID: ownerID },
      { $set: { resourceType: null, resourceID: null } },
    );
  }

  static async deleteUnattached(mediaID: unknown, ownerID: string) {
    if (!Types.ObjectId.isValid(String(mediaID))) return false;
    const media = await MediaModel.findOneAndDelete({ _id: mediaID, ownerID, resourceID: null });
    if (!media) return false;
    await StorageService.deleteFile(media.storageKey);
    return true;
  }

  static async deleteAttachedAvatar(mediaID: unknown, ownerID: string) {
    if (!mediaID) return;
    const media = await MediaModel.findOneAndDelete({
      _id: mediaID,
      ownerID,
      resourceType: "USER",
      resourceID: ownerID,
    });
    if (media) await StorageService.deleteFile(media.storageKey);
  }

  static async cleanupUnattached(now = new Date()) {
    const cutoff = new Date(now.getTime() - UNATTACHED_MEDIA_MAX_AGE_MS);
    const mediaList = await MediaModel.find({
      resourceID: null,
      createdAt: { $lte: cutoff },
    }).lean();
    let deleted = 0;
    for (const media of mediaList) {
      try {
        await StorageService.deleteFile(media.storageKey);
        await MediaModel.deleteOne({ _id: media._id, resourceID: null });
        deleted += 1;
      } catch (error) {
        console.error("Falha ao limpar upload não associado", media._id.toString(), error);
      }
    }
    return { scanned: mediaList.length, deleted };
  }
}

export { mediaUrl, serializeMedia };
export default MediaService;
