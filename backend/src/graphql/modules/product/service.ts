import { z } from "zod";
import { Types } from "mongoose";
import { graphQLError } from "../../errors.js";
import { SellerSettingsModel } from "../seller/model.js";
import { MediaModel } from "../media/model.js";
import { mediaUrl } from "../media/service.js";
import { ProductModel } from "./model.js";
import { env } from "../../../config/env.js";

const inputSchema = z.object({ title: z.string().trim().min(1).max(150), gtin: z.string().trim().max(14).optional().default("").refine((value) => !value || /^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(value), "Informe um GTIN/EAN válido."), category: z.enum(["BOOK", "ELECTRONICS", "HOME", "FASHION", "SPORTS", "OTHER"]), description: z.string().trim().min(120).max(5000), price: z.number().positive(), imageIDs: z.array(z.string().regex(/^[a-f\d]{24}$/i)).min(1).max(10), videoID: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(), variations: z.array(z.object({ title: z.string().trim().min(1).max(60), options: z.array(z.string().trim().min(1).max(60)).min(1).max(50), imageIDs: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(10) })).max(20), bookDetails: z.string().max(5000).optional(), shippingMethod: z.enum(["MELHOR_ENVIO", "SELLER"]) });
class ProductService {
  static async toPublicRows(rows: any[]) {
    if (!rows.length) return [];
    const sellerIDs = [...new Set(rows.map((row) => row.sellerID.toString()))];
    const stores = await SellerSettingsModel.find({ userID: { $in: sellerIDs }, storeName: { $ne: "" } }).select("userID slug slugBase storeName").lean();
    const storeBySeller = new Map(stores.map((store: any) => [store.userID.toString(), store.slug || store.slugBase || ""]));
    return rows.flatMap((row) => {
      const storeSlug = storeBySeller.get(row.sellerID.toString());
      const image = row.images?.[0] ? mediaUrl(row.images[0]) : "";
      return storeSlug && image ? [{ id: row._id.toString(), title: row.title, category: row.category, price: row.price, image, storeSlug }] : [];
    });
  }

  static async publicList() {
    const rows = await ProductModel.find().sort({ createdAt: -1 }).limit(48).lean();
    return this.toPublicRows(rows);
  }

  static async publicStoreList(slug: string) {
    const store = await SellerSettingsModel.findOne({ $or: [{ slug }, { slugBase: slug }], storeName: { $ne: "" } }).select("userID").lean();
    if (!store) return [];
    const rows = await ProductModel.find({ sellerID: store.userID }).sort({ createdAt: -1 }).lean();
    return this.toPublicRows(rows);
  }

  static async publicByID(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    const row: any = await ProductModel.findById(id).lean();
    if (!row) return null;
    const store: any = await SellerSettingsModel.findOne({ userID: row.sellerID }).select("slug slugBase storeName").lean();
    const storeSlug = store?.slug || store?.slugBase;
    if (!storeSlug || !store?.storeName) return null;
    return {
      id: row._id.toString(), title: row.title, category: row.category, price: row.price,
      images: (row.images ?? []).map(mediaUrl), description: row.description, gtin: row.gtin ?? "",
      variations: (row.variations ?? []).map((variation: any) => ({ title: variation.title, options: variation.options })),
      bookDetails: row.bookDetails ? JSON.stringify(row.bookDetails) : null,
      shippingMethod: row.shippingMethod, storeSlug, storeName: store.storeName,
    };
  }

  static async requireReadyStore(userID?: string) {
    if (!userID) throw graphQLError("Acesso não autenticado.", "UNAUTHENTICATED");
    const store = await SellerSettingsModel.findOne({ userID }).lean();
    const address = store?.sellerAddresses?.some((item: any) => item.purposes?.includes("SHIPPING") && item.recipientName?.trim() && item.postalCode?.replace(/\D/g, "").length === 8 && item.street?.trim() && item.number?.trim() && item.neighborhood?.trim() && item.city?.trim() && item.state?.trim());
    if (!store?.storeName?.trim() || !store.phone?.trim() || !store.taxDocument?.trim() || !address) throw graphQLError("Complete os dados básicos da loja e cadastre um endereço de envio antes de anunciar produtos.", "PRECONDITION_FAILED");
    return userID;
  }
  static async list(userID?: string) {
    const id = await this.requireReadyStore(userID);
    const rows = await ProductModel.find({ sellerID: id }).sort({ createdAt: -1 }).lean();
    return rows.map((row: any) => ({ id: row._id.toString(), title: row.title, gtin: row.gtin, category: row.category, description: row.description, price: row.price, images: row.images.map(mediaUrl), imageIDs: row.images.map((image: any) => image.toString()), videoUrl: row.videoID ? `${env.API_PUBLIC_URL.replace(/\/$/, "")}/uploads/media/${row.videoID}` : "", videoID: row.videoID?.toString() ?? null, variations: row.variations.map((variation: any) => ({ ...variation, imageIDs: variation.imageIDs.map((id: any) => id.toString()), imageUrls: variation.imageIDs.map(mediaUrl) })), bookDetails: row.bookDetails ? JSON.stringify(row.bookDetails) : null, shippingMethod: row.shippingMethod }));
  }
  static async create(userID: string | undefined, data: unknown) {
    const id = await this.requireReadyStore(userID);
    const parsed = inputSchema.safeParse(data);
    if (!parsed.success) throw graphQLError(parsed.error.issues[0]?.message ?? "Verifique os dados do produto.", "BAD_USER_INPUT");
    if (parsed.data.category === "BOOK" && !parsed.data.bookDetails) throw graphQLError("Preencha a ficha técnica do livro.", "BAD_USER_INPUT");
    const imageIDs = [...new Set([...parsed.data.imageIDs, ...parsed.data.variations.flatMap((variation) => variation.imageIDs)])];
    const mediaIDs = [...imageIDs, ...(parsed.data.videoID ? [parsed.data.videoID] : [])];
    const media = await MediaModel.find({ _id: { $in: mediaIDs }, ownerID: id, purpose: { $in: parsed.data.videoID ? ["PRODUCT_IMAGE", "PRODUCT_VIDEO"] : ["PRODUCT_IMAGE"] }, status: "READY", resourceID: null });
    if (media.length !== mediaIDs.length || media.some((item) => parsed.data.videoID === item.id ? item.purpose !== "PRODUCT_VIDEO" : item.purpose !== "PRODUCT_IMAGE")) throw graphQLError("Uma ou mais mídias não estão disponíveis para este anúncio.", "BAD_USER_INPUT");
    let bookDetails: unknown = null;
    if (parsed.data.category === "BOOK") {
      try { bookDetails = JSON.parse(parsed.data.bookDetails!); } catch { throw graphQLError("A ficha técnica do livro é inválida.", "BAD_USER_INPUT"); }
      const isbn = typeof (bookDetails as any)?.isbn === "string" ? (bookDetails as any).isbn.replace(/[^\dXx]/g, "") : "";
      if (!/^(?:\d{9}[\dXx]|\d{13})$/.test(isbn)) throw graphQLError("Informe um ISBN com 10 ou 13 caracteres.", "BAD_USER_INPUT");
    }
    const { videoID, ...productInput } = parsed.data;
    const product = await ProductModel.create({ ...productInput, videoID: videoID || null, bookDetails, sellerID: id, images: parsed.data.imageIDs });
    await MediaModel.updateMany({ _id: { $in: mediaIDs }, ownerID: id, resourceID: null }, { $set: { resourceType: "PRODUCT", resourceID: product._id } });
    const row: any = product.toObject();
    return { id: product.id, title: row.title, gtin: row.gtin, category: row.category, description: row.description, price: row.price, images: row.images.map(mediaUrl), imageIDs: row.images.map((image: any) => image.toString()), videoUrl: videoID ? `${env.API_PUBLIC_URL.replace(/\/$/, "")}/uploads/media/${videoID}` : "", videoID: videoID || null, variations: row.variations.map((variation: any) => ({ ...variation, imageIDs: variation.imageIDs.map((id: any) => id.toString()), imageUrls: variation.imageIDs.map(mediaUrl) })), bookDetails: row.bookDetails ? JSON.stringify(row.bookDetails) : null, shippingMethod: row.shippingMethod };
  }

  static async update(userID: string | undefined, productID: string, data: unknown) {
    const sellerID = await this.requireReadyStore(userID);
    if (!Types.ObjectId.isValid(productID)) throw graphQLError("Produto não encontrado.", "NOT_FOUND");
    const updateSchema = z.object({
      title: z.string().trim().min(1).max(150),
      gtin: z.string().trim().max(14).optional().default("").refine((value) => !value || /^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(value), "Informe um GTIN/EAN válido."),
      category: z.enum(["BOOK", "ELECTRONICS", "HOME", "FASHION", "SPORTS", "OTHER"]),
      description: z.string().trim().min(120).max(5000),
      price: z.number().positive(),
      imageIDs: z.array(z.string().regex(/^[a-f\d]{24}$/i)).min(1).max(10),
      videoID: z.string().regex(/^[a-f\d]{24}$/i).nullable(),
      variations: z.array(z.object({ title: z.string().trim().min(1).max(60), options: z.array(z.string().trim().min(1).max(60)).min(1).max(50), imageIDs: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(10) })).max(20),
      bookDetails: z.string().max(5000).nullable().optional(),
      shippingMethod: z.enum(["MELHOR_ENVIO", "SELLER"]),
    });
    const parsed = updateSchema.safeParse(data);
    if (!parsed.success) throw graphQLError(parsed.error.issues[0]?.message ?? "Verifique os dados do produto.", "BAD_USER_INPUT");
    const existing: any = await ProductModel.findOne({ _id: productID, sellerID }).lean();
    if (!existing) throw graphQLError("Produto não encontrado.", "NOT_FOUND");
    const mediaIDs = [...new Set([...parsed.data.imageIDs, ...parsed.data.variations.flatMap((variation) => variation.imageIDs), ...(parsed.data.videoID ? [parsed.data.videoID] : [])])];
    const allowedPurposes = parsed.data.videoID ? ["PRODUCT_IMAGE", "PRODUCT_VIDEO"] : ["PRODUCT_IMAGE"];
    const media = await MediaModel.find({ _id: { $in: mediaIDs }, ownerID: sellerID, purpose: { $in: allowedPurposes }, status: "READY" }).lean();
    const validMedia = media.length === mediaIDs.length && media.every((item: any) => {
      const isVideo = item._id.toString() === parsed.data.videoID;
      const belongsToThisProduct = item.resourceType === "PRODUCT" && item.resourceID?.toString() === productID;
      const isUnassigned = item.resourceID === null;
      return (isVideo ? item.purpose === "PRODUCT_VIDEO" : item.purpose === "PRODUCT_IMAGE") && (belongsToThisProduct || isUnassigned);
    });
    if (!validMedia) throw graphQLError("Uma ou mais mídias não estão disponíveis para este anúncio.", "BAD_USER_INPUT");
    let bookDetails: unknown = null;
    if (parsed.data.category === "BOOK") {
      try { bookDetails = JSON.parse(parsed.data.bookDetails ?? ""); } catch { throw graphQLError("Preencha a ficha técnica do livro.", "BAD_USER_INPUT"); }
      const isbn = typeof (bookDetails as any)?.isbn === "string" ? (bookDetails as any).isbn.replace(/[^\dXx]/g, "") : "";
      if (!/^(?:\d{9}[\dXx]|\d{13})$/.test(isbn)) throw graphQLError("Informe um ISBN com 10 ou 13 caracteres.", "BAD_USER_INPUT");
    }
    const row: any = await ProductModel.findOneAndUpdate(
      { _id: productID, sellerID }, { $set: { ...parsed.data, images: parsed.data.imageIDs, videoID: parsed.data.videoID || null, bookDetails } }, { new: true, runValidators: true },
    ).lean();
    if (!row) throw graphQLError("Produto não encontrado.", "NOT_FOUND");
    const oldMediaIDs = [...new Set([...(existing.images ?? []).map((mediaID: any) => mediaID.toString()), ...(existing.videoID ? [existing.videoID.toString()] : []), ...(existing.variations ?? []).flatMap((variation: any) => variation.imageIDs.map((mediaID: any) => mediaID.toString()))])];
    const retainedMediaIDs = new Set(mediaIDs);
    await Promise.all([
      MediaModel.updateMany({ _id: { $in: oldMediaIDs.filter((mediaID) => !retainedMediaIDs.has(mediaID)) }, ownerID: sellerID, resourceType: "PRODUCT", resourceID: productID }, { $set: { resourceType: null, resourceID: null } }),
      MediaModel.updateMany({ _id: { $in: mediaIDs }, ownerID: sellerID }, { $set: { resourceType: "PRODUCT", resourceID: productID } }),
    ]);
    return {
      id: row._id.toString(), title: row.title, gtin: row.gtin, category: row.category,
      description: row.description, price: row.price, images: row.images.map(mediaUrl), imageIDs: row.images.map((image: any) => image.toString()),
      videoUrl: row.videoID ? `${env.API_PUBLIC_URL.replace(/\/$/, "")}/uploads/media/${row.videoID}` : "", videoID: row.videoID?.toString() ?? null,
      variations: row.variations.map((variation: any) => ({ ...variation, imageIDs: variation.imageIDs.map((id: any) => id.toString()), imageUrls: variation.imageIDs.map(mediaUrl) })), bookDetails: row.bookDetails ? JSON.stringify(row.bookDetails) : null,
      shippingMethod: row.shippingMethod,
    };
  }
}
export default ProductService;
