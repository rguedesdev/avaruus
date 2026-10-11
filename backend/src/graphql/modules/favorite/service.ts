import { z } from "zod";

import { graphQLError } from "../../errors.js";
import { FavoriteModel } from "./model.js";

const productSlugSchema = z.string().trim().toLowerCase().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Produto inválido.");

class FavoriteService {
  static requireUser(userID?: string) {
    if (!userID) throw graphQLError("Acesso não autenticado.", "UNAUTHENTICATED");
    return userID;
  }

  static async list(userID?: string) {
    const id = this.requireUser(userID);
    const favorites = await FavoriteModel.find({ userID: id }).sort({ createdAt: -1 }).lean();
    return favorites.map((favorite) => ({
      productSlug: favorite.productSlug,
      createdAt: favorite.createdAt.toISOString(),
    }));
  }

  static async isFavorite(userID: string | undefined, productSlug: string) {
    const id = this.requireUser(userID);
    const slug = productSlugSchema.parse(productSlug);
    return Boolean(await FavoriteModel.exists({ userID: id, productSlug: slug }));
  }

  static async toggle(userID: string | undefined, productSlug: string) {
    const id = this.requireUser(userID);
    const parsed = productSlugSchema.safeParse(productSlug);
    if (!parsed.success) throw graphQLError("Produto inválido.", "BAD_USER_INPUT");
    const existing = await FavoriteModel.findOneAndDelete({ userID: id, productSlug: parsed.data });
    if (existing) return { productSlug: parsed.data, isFavorite: false };
    try {
      await FavoriteModel.create({ userID: id, productSlug: parsed.data });
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
    }
    return { productSlug: parsed.data, isFavorite: true };
  }
}

export default FavoriteService;
