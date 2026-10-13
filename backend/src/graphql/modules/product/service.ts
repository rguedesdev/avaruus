import { z } from "zod";
import { Types } from "mongoose";
import { graphQLError } from "../../errors.js";
import { SellerSettingsModel } from "../seller/model.js";
import { MediaModel } from "../media/model.js";
import { mediaUrl } from "../media/service.js";
import { ProductModel } from "./model.js";
import { CatalogCounterModel, CatalogProductModel } from "./catalog-model.js";
import { UserModel } from "../user/model.js";
import { env } from "../../../config/env.js";
import { StorageService } from "../../../services/storage.js";

const inputSchema = z.object({ title: z.string().trim().min(1).max(150), gtin: z.string().trim().max(14).optional().default("").refine((value) => !value || /^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(value), "Informe um GTIN/EAN válido."), catalogProductID: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(), category: z.enum(["BOOK", "ELECTRONICS", "HOME", "FASHION", "SPORTS", "OTHER"]), description: z.string().trim().min(120).max(5000), price: z.number().positive(), imageIDs: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(10), videoID: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(), variations: z.array(z.object({ title: z.string().trim().min(1).max(60), options: z.array(z.string().trim().min(1).max(60)).min(1).max(50), imageIDs: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(10) })).max(20), bookDetails: z.string().max(5000).nullable().optional(), international: z.boolean().optional().default(false), shippingMethod: z.enum(["MELHOR_ENVIO", "SELLER"]) }).superRefine((data, context) => { if (!data.catalogProductID && !data.imageIDs.length) context.addIssue({ code: "custom", message: "Adicione pelo menos uma imagem ao produto." }); });
const catalogInputSchema = z.object({ title: z.string().trim().min(1).max(150), gtin: z.string().trim().max(14).optional().default("").refine((value) => !value || /^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(value), "Informe um GTIN/EAN válido."), category: z.enum(["BOOK", "ELECTRONICS", "HOME", "FASHION", "SPORTS", "OTHER"]), description: z.string().trim().min(120).max(5000), imageIDs: z.array(z.string().regex(/^[a-f\d]{24}$/i)).min(1).max(10), videoID: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(), variations: z.array(z.object({ title: z.string().trim().min(1).max(60), options: z.array(z.string().trim().min(1).max(60)).min(1).max(50), imageIDs: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(10).default([]) })).max(20).optional(), bookDetails: z.string().max(5000).nullable().optional() });
async function requireAdmin(userID?: string) {
  if (!userID) throw graphQLError("Acesso não autenticado.", "UNAUTHENTICATED");
  const user = await UserModel.findById(userID).select("accountType").lean();
  if (user?.accountType !== "ADMIN") throw graphQLError("Acesso restrito à administração.", "FORBIDDEN");
  return userID;
}
async function nextAVSIN() {
  const counter: any = await CatalogCounterModel.findOneAndUpdate({ _id: "avsin" }, { $inc: { sequence: 1 } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
  return `AVSIN${String(counter.sequence).padStart(10, "0")}`;
}
async function requireUnassignedAdminImages(adminID: string, imageIDs: string[]) {
  const rows = await MediaModel.find({ _id: { $in: imageIDs }, ownerID: adminID, purpose: "PRODUCT_IMAGE", status: "READY", resourceID: null }).select("_id").lean();
  if (rows.length !== imageIDs.length) throw graphQLError("Uma ou mais imagens não estão disponíveis para o catálogo.", "BAD_USER_INPUT");
}
function serializeCatalog(row: any) {
  return { id: row._id.toString(), avsin: row.avsin, title: row.title, gtin: row.gtin ?? "", category: row.category, description: row.description, images: (row.images ?? []).map(mediaUrl), imageIDs: (row.images ?? []).map((id: any) => id.toString()), videoID: row.videoID?.toString() ?? null, videoUrl: row.videoID ? `${env.API_PUBLIC_URL.replace(/\/$/, "")}/uploads/media/${row.videoID}` : "", variations: (row.variations ?? []).map((variation: any) => ({ title: variation.title, options: variation.options, imageIDs: (variation.imageIDs ?? []).map((id: any) => id.toString()), imageUrls: (variation.imageIDs ?? []).map(mediaUrl) })), bookDetails: row.bookDetails ? JSON.stringify(row.bookDetails) : null };
}
async function requireCatalogVideo(adminID: string, videoID?: string | null, catalogID?: string) {
  if (!videoID) return null;
  const media = await MediaModel.findOne({ _id: videoID, ownerID: adminID, purpose: "PRODUCT_VIDEO", status: "READY", resourceID: catalogID ? { $in: [null, catalogID] } : null }).select("_id").lean();
  if (!media) throw graphQLError("O vídeo não está disponível para este item de catálogo.", "BAD_USER_INPUT");
  return media._id;
}
function parseBookDetails(value: string | null | undefined) {
  let details: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(value ?? "");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid book details");
    details = parsed as Record<string, unknown>;
  } catch {
    throw graphQLError("Preencha a ficha técnica do livro.", "BAD_USER_INPUT");
  }
  const legacyISBN = typeof details.isbn === "string" ? details.isbn.replace(/[^\dXx]/g, "") : "";
  const isbn10 = typeof details.isbn10 === "string" && details.isbn10.trim() ? details.isbn10.replace(/[^\dXx]/g, "") : legacyISBN.length === 10 ? legacyISBN : "";
  const isbn13 = typeof details.isbn13 === "string" && details.isbn13.trim() ? details.isbn13.replace(/\D/g, "") : legacyISBN.length === 13 ? legacyISBN : "";
  const format = typeof details.format === "string" ? details.format : "";
  if (["paperback", "hardcover"].includes(format) && !isbn10 && !isbn13) throw graphQLError("Informe o ISBN-10 ou o ISBN-13 do livro físico.", "BAD_USER_INPUT");
  if (format === "audiobook" && !isbn13) throw graphQLError("Informe o ISBN-13 do audiobook.", "BAD_USER_INPUT");
  if ((isbn10 && !/^\d{9}[\dXx]$/.test(isbn10)) || (isbn13 && !/^\d{13}$/.test(isbn13))) throw graphQLError("Confira o ISBN-10 (10 caracteres) e o ISBN-13 (13 dígitos).", "BAD_USER_INPUT");
  return { ...details, isbn10, isbn13 };
}
function normalizedProductTitle(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/\bvol(?:ume)?\.?\s*0*(\d+)\b/g, " volume$1 ").replace(/[^\p{L}\p{N}]+/gu, " ").trim(); }
function titleSimilarity(left: string, right: string) {
  const a = new Set(normalizedProductTitle(left).split(" ").filter((word) => word.length > 1));
  const b = new Set(normalizedProductTitle(right).split(" ").filter((word) => word.length > 1));
  if (!a.size || !b.size) return 0;
  return [...a].filter((word) => b.has(word)).length / Math.min(a.size, b.size);
}
function bookIdentifiers(value: unknown) {
  if (!value || typeof value !== "object") return [];
  const details = value as Record<string, unknown>;
  return [details.isbn10, details.isbn13, details.isbn].filter((item): item is string => typeof item === "string").map((item) => item.replace(/[^\dXx]/g, "").toUpperCase()).filter(Boolean);
}
async function possibleCatalogMatches(product: { title: string; gtin?: string; category: string; bookDetails?: unknown }) {
  const escaped = product.title.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const conditions: any[] = [{ title: new RegExp(escaped, "i") }];
  if (product.gtin) conditions.push({ gtin: product.gtin });
  const rows: any[] = await CatalogProductModel.find({ category: product.category, $or: conditions }).select("avsin title gtin category description images bookDetails").limit(10).lean();
  return rows.filter((row) => {
    if (product.gtin && row.gtin && product.gtin === row.gtin) return true;
    const incomingISBN = bookIdentifiers(product.bookDetails);
    const catalogISBN = bookIdentifiers(row.bookDetails);
    if (incomingISBN.length && catalogISBN.length) return incomingISBN.some((isbn) => catalogISBN.includes(isbn));
    return normalizedProductTitle(product.title) === normalizedProductTitle(row.title);
  }).slice(0, 5).map((row) => ({ id: row._id.toString(), avsin: row.avsin, title: row.title, gtin: row.gtin ?? "", category: row.category, description: row.description, image: row.images?.[0] ? mediaUrl(row.images[0]) : "", bookDetails: row.bookDetails ? JSON.stringify(row.bookDetails) : null }));
}
class ProductService {
  static async toPublicRows(rows: any[]) {
    if (!rows.length) return [];
    const sellerIDs = [...new Set(rows.map((row) => row.sellerID.toString()))];
    const catalogRows: any[] = await CatalogProductModel.find({ _id: { $in: rows.map((row) => row.catalogProductID).filter(Boolean) } }).select("title category images").lean();
    const catalogByID = new Map(catalogRows.map((catalog) => [catalog._id.toString(), catalog]));
    const stores = await SellerSettingsModel.find({ userID: { $in: sellerIDs }, storeName: { $ne: "" } }).select("userID slug slugBase storeName").lean();
    const storeBySeller = new Map(stores.map((store: any) => [store.userID.toString(), store.slug || store.slugBase || ""]));
    return rows.flatMap((row) => {
      const storeSlug = storeBySeller.get(row.sellerID.toString());
      const catalog: any = row.catalogProductID ? catalogByID.get(row.catalogProductID.toString()) : null;
      const item = catalog ?? row;
      const imageID = item.images?.[0] ?? row.images?.[0];
      const image = imageID ? mediaUrl(imageID) : "";
      return storeSlug && image ? [{ id: row._id.toString(), title: item.title, category: item.category, price: row.price, image, storeSlug }] : [];
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
    const catalog: any = row.catalogProductID ? await CatalogProductModel.findById(row.catalogProductID).lean() : null;
    const item = catalog ?? row;
    const store: any = await SellerSettingsModel.findOne({ userID: row.sellerID }).select("slug slugBase storeName").lean();
    const storeSlug = store?.slug || store?.slugBase;
    if (!storeSlug || !store?.storeName) return null;
    return {
      id: row._id.toString(), title: item.title, category: item.category, price: row.price,
      images: (item.images?.length ? item.images : row.images ?? []).map(mediaUrl), description: item.description, gtin: item.gtin ?? "", catalogAVSIN: catalog?.avsin ?? null, videoUrl: (catalog?.videoID ?? row.videoID) ? `${env.API_PUBLIC_URL.replace(/\/$/, "")}/uploads/media/${catalog?.videoID ?? row.videoID}` : "",
      variations: (item.variations ?? []).map((variation: any) => ({ title: variation.title, options: variation.options })),
      bookDetails: item.bookDetails ? JSON.stringify(item.bookDetails) : null,
      international: row.international ?? false, shippingMethod: row.shippingMethod, storeSlug, storeName: store.storeName,
    };
  }

  static async requireReadyStore(userID?: string) {
    if (!userID) throw graphQLError("Acesso não autenticado.", "UNAUTHENTICATED");
    const account: any = await UserModel.findById(userID).select("accountType").lean();
    if (!account) throw graphQLError("Acesso não autenticado.", "UNAUTHENTICATED");
    const store = await SellerSettingsModel.findOne({ userID }).lean();
    const address = store?.sellerAddresses?.some((item: any) => item.purposes?.includes("SHIPPING") && item.recipientName?.trim() && item.postalCode?.replace(/\D/g, "").length === 8 && item.street?.trim() && item.number?.trim() && item.neighborhood?.trim() && item.city?.trim() && item.state?.trim());
    if (!store?.storeName?.trim() || !store.phone?.trim() || !store.taxDocument?.trim() || !address) throw graphQLError("Complete os dados básicos da loja e cadastre um endereço de envio antes de anunciar produtos.", "PRECONDITION_FAILED");
    if (account.accountType === "CUSTOMER") await UserModel.updateOne({ _id: userID, accountType: "CUSTOMER" }, { $set: { accountType: "SELLER" } });
    else if (!["SELLER", "ADMIN"].includes(account.accountType)) throw graphQLError("Esta ação exige uma conta de vendedor.", "FORBIDDEN");
    return userID;
  }
  static async list(userID?: string) {
    const id = await this.requireReadyStore(userID);
    const rows = await ProductModel.find({ sellerID: id }).sort({ createdAt: -1 }).lean();
    const catalogRows: any[] = await CatalogProductModel.find({ _id: { $in: rows.map((row: any) => row.catalogProductID).filter(Boolean) } }).lean();
    const catalogByID = new Map(catalogRows.map((catalog) => [catalog._id.toString(), catalog]));
    return rows.map((row: any) => {
      const catalog: any = row.catalogProductID ? catalogByID.get(row.catalogProductID.toString()) : null;
      const item = catalog ?? row;
      const images = item.images?.length ? item.images : row.images ?? [];
      const variations = item.variations ?? [];
      return { id: row._id.toString(), title: item.title, gtin: item.gtin ?? "", category: item.category, description: item.description, price: row.price, images: images.map(mediaUrl), imageIDs: images.map((image: any) => image.toString()), videoUrl: row.videoID ? `${env.API_PUBLIC_URL.replace(/\/$/, "")}/uploads/media/${row.videoID}` : "", videoID: row.videoID?.toString() ?? null, variations: variations.map((variation: any) => ({ title: variation.title, options: variation.options, imageIDs: variation.imageIDs?.map((id: any) => id.toString()) ?? [], imageUrls: variation.imageIDs?.map(mediaUrl) ?? [] })), bookDetails: item.bookDetails ? JSON.stringify(item.bookDetails) : null, catalogAVSIN: catalog?.avsin ?? null, international: row.international ?? false, shippingMethod: row.shippingMethod };
    });
  }
  static async catalogMatches(userID: string | undefined, value: string) {
    await this.requireReadyStore(userID);
    const gtin = value.replace(/\D/g, "");
    if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(gtin)) return [];
    const rows: any[] = await CatalogProductModel.find({ gtin }).select("avsin title category description images bookDetails").sort({ createdAt: -1 }).limit(5).lean();
    return rows.map((row) => ({ id: row._id.toString(), avsin: row.avsin, title: row.title, gtin: row.gtin ?? "", category: row.category, description: row.description, image: row.images?.[0] ? mediaUrl(row.images[0]) : "", bookDetails: row.bookDetails ? JSON.stringify(row.bookDetails) : null }));
  }
  static async catalogSearch(userID: string | undefined, value: string) {
    await this.requireReadyStore(userID);
    const term = value.trim().slice(0, 100);
    if (term.length < 3) return [];
    const gtin = term.replace(/\D/g, "");
    const rows: any[] = /^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(gtin) && gtin === term
      ? await CatalogProductModel.find({ gtin }).select("avsin title gtin category description images bookDetails").sort({ createdAt: -1 }).limit(10).lean()
      : await CatalogProductModel.find({ $or: [{ title: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }, { avsin: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }, { gtin: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }] }).select("avsin title gtin category description images bookDetails").sort({ createdAt: -1 }).limit(10).lean();
    return rows.map((row) => ({ id: row._id.toString(), avsin: row.avsin, title: row.title, gtin: row.gtin ?? "", category: row.category, description: row.description, image: row.images?.[0] ? mediaUrl(row.images[0]) : "", bookDetails: row.bookDetails ? JSON.stringify(row.bookDetails) : null }));
  }
  static async adminCandidates(userID?: string, search = "") {
    await requireAdmin(userID);
    const term = search.trim().slice(0, 100);
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    let match: any = { catalogProductID: null };
    if (escaped) {
      const regex = new RegExp(escaped, "i");
      const [users, stores] = await Promise.all([
        UserModel.find({ $or: [{ name: regex }, { username: regex }] }).select("_id").lean(),
        SellerSettingsModel.find({ storeName: regex }).select("userID").lean(),
      ]);
      const sellerIDs = [...new Set([...users.map((item: any) => item._id.toString()), ...stores.map((item: any) => item.userID.toString())])];
      match = { catalogProductID: null, $or: [{ title: regex }, { gtin: regex }, { sellerID: { $in: sellerIDs } }] };
    }
    const rows: any[] = await ProductModel.find(match).sort({ createdAt: -1 }).limit(200).lean();
    const sellerIDs = [...new Set(rows.map((row) => row.sellerID.toString()))];
    const stores = await SellerSettingsModel.find({ userID: { $in: sellerIDs } }).select("userID storeName").lean();
    const storeByID = new Map(stores.map((store: any) => [store.userID.toString(), store.storeName]));
    const catalogRows: any[] = await CatalogProductModel.find().select("avsin title gtin category description images bookDetails").limit(2000).lean();
    return rows.map((row) => {
      const incomingISBN = bookIdentifiers(row.bookDetails);
      const title = normalizedProductTitle(row.title);
      const matches = catalogRows.filter((catalog) => catalog.category === row.category && ((row.gtin && catalog.gtin && row.gtin === catalog.gtin) || (incomingISBN.length && bookIdentifiers(catalog.bookDetails).some((isbn) => incomingISBN.includes(isbn))) || (title && titleSimilarity(row.title, catalog.title) >= 0.65))).slice(0, 5).map((catalog) => ({ id: catalog._id.toString(), avsin: catalog.avsin, title: catalog.title, gtin: catalog.gtin ?? "", category: catalog.category, description: catalog.description, image: catalog.images?.[0] ? mediaUrl(catalog.images[0]) : "", bookDetails: catalog.bookDetails ? JSON.stringify(catalog.bookDetails) : null }));
      return { id: row._id.toString(), title: row.title, gtin: row.gtin ?? "", category: row.category, description: row.description, price: row.price, images: (row.images ?? []).map(mediaUrl), imageIDs: (row.images ?? []).map((id: any) => id.toString()), videoUrl: row.videoID ? `${env.API_PUBLIC_URL.replace(/\/$/, "")}/uploads/media/${row.videoID}` : "", variations: (row.variations ?? []).map((variation: any) => ({ title: variation.title, options: variation.options, imageIDs: (variation.imageIDs ?? []).map((id: any) => id.toString()), imageUrls: (variation.imageIDs ?? []).map(mediaUrl) })), bookDetails: row.bookDetails ? JSON.stringify(row.bookDetails) : null, international: row.international ?? false, shippingMethod: row.shippingMethod, storeName: storeByID.get(row.sellerID.toString()) ?? "Loja", possibleCatalogMatches: matches };
    });
  }
  static async listCatalog(userID?: string) {
    await requireAdmin(userID);
    const rows = await CatalogProductModel.find().sort({ createdAt: -1 }).limit(200).lean();
    return rows.map(serializeCatalog);
  }
  static async adminCatalogMatches(userID: string | undefined, value: string) {
    await requireAdmin(userID);
    const gtin = value.replace(/\D/g, "");
    if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(gtin)) return [];
    const rows = await CatalogProductModel.find({ gtin }).sort({ createdAt: -1 }).limit(10).lean();
    return rows.map(serializeCatalog);
  }
  static async adminCandidateAlreadyOffered(userID: string | undefined, productID: string, catalogID: string) {
    await requireAdmin(userID);
    if (!Types.ObjectId.isValid(productID) || !Types.ObjectId.isValid(catalogID)) throw graphQLError("Anúncio ou item de catálogo não encontrado.", "NOT_FOUND");
    const product = await ProductModel.findOne({ _id: productID, catalogProductID: null }).select("sellerID").lean();
    if (!product) throw graphQLError("Anúncio não encontrado ou já vinculado ao catálogo.", "NOT_FOUND");
    const exists = await ProductModel.exists({ sellerID: (product as any).sellerID, catalogProductID: catalogID });
    return Boolean(exists);
  }
  static async linkCandidateToCatalog(userID: string | undefined, productID: string, catalogID: string) {
    await requireAdmin(userID);
    if (!Types.ObjectId.isValid(productID) || !Types.ObjectId.isValid(catalogID)) throw graphQLError("Produto ou item de catálogo não encontrado.", "NOT_FOUND");
    const catalog = await CatalogProductModel.findById(catalogID).lean();
    if (!catalog) throw graphQLError("Item de catálogo não encontrado.", "NOT_FOUND");
    const product = await ProductModel.findOne({ _id: productID, catalogProductID: null }).select("gtin sellerID").lean();
    if (!product) throw graphQLError("Produto não encontrado ou já vinculado ao catálogo.", "NOT_FOUND");
    if (product.gtin && catalog.gtin && product.gtin !== catalog.gtin) throw graphQLError("Os GTINs do anúncio e do item de catálogo são diferentes.", "BAD_USER_INPUT");
    if (await ProductModel.exists({ _id: { $ne: productID }, sellerID: (product as any).sellerID, catalogProductID: catalog._id })) throw graphQLError("Esta loja já tem um anúncio vinculado a esse AVSIN.", "CONFLICT");
    const result = await ProductModel.updateOne({ _id: productID, catalogProductID: null }, { $set: { catalogProductID: catalog._id } });
    if (!result.modifiedCount) throw graphQLError("Produto não encontrado ou já vinculado ao catálogo.", "CONFLICT");
    return serializeCatalog(catalog);
  }
  static async deleteAdminCandidate(userID: string | undefined, productID: string) {
    await requireAdmin(userID);
    if (!Types.ObjectId.isValid(productID)) throw graphQLError("Anúncio não encontrado.", "NOT_FOUND");
    const product: any = await ProductModel.findOne({ _id: productID, catalogProductID: null }).lean();
    if (!product) throw graphQLError("O anúncio já foi vinculado ao catálogo ou não existe.", "CONFLICT");
    const removed = await ProductModel.deleteOne({ _id: productID, catalogProductID: null });
    if (!removed.deletedCount) throw graphQLError("O anúncio já foi vinculado ao catálogo ou não existe.", "CONFLICT");
    const mediaIDs = [...new Set([...(product.images ?? []), ...(product.variations ?? []).flatMap((variation: any) => variation.imageIDs ?? []), ...(product.videoID ? [product.videoID] : [])])];
    const media = await MediaModel.find({ _id: { $in: mediaIDs }, ownerID: product.sellerID, resourceType: "PRODUCT", resourceID: product._id }).lean();
    await MediaModel.updateMany({ _id: { $in: media.map((item: any) => item._id) }, ownerID: product.sellerID, resourceType: "PRODUCT", resourceID: product._id }, { $set: { resourceType: null, resourceID: null } });
    for (const item of media) {
      try {
        await StorageService.deleteFile(item.storageKey);
        await MediaModel.deleteOne({ _id: item._id, ownerID: product.sellerID, resourceID: null, storageKey: item.storageKey });
      } catch (error) {
        console.error("Falha ao remover mídia do anúncio excluído", item._id.toString(), error);
      }
    }
    return true;
  }
  static async approveForCatalog(userID: string | undefined, productID: string, data: unknown) {
    const adminID = await requireAdmin(userID);
    if (!Types.ObjectId.isValid(productID)) throw graphQLError("Produto não encontrado.", "NOT_FOUND");
    const parsed = catalogInputSchema.safeParse(data);
    if (!parsed.success) throw graphQLError(parsed.error.issues[0]?.message ?? "Verifique os dados do item de catálogo.", "BAD_USER_INPUT");
    const product: any = await ProductModel.findOne({ _id: productID, catalogProductID: null }).lean();
    if (!product) throw graphQLError("Produto não encontrado ou já vinculado ao catálogo.", "NOT_FOUND");
    const sourceImageIDs = (product.images ?? []).map((id: any) => id.toString());
    const newImageIDs = parsed.data.imageIDs.filter((id) => !sourceImageIDs.includes(id));
    await requireUnassignedAdminImages(adminID, newImageIDs);
    const videoID = await requireCatalogVideo(adminID, parsed.data.videoID);
    const rawBookDetails = parsed.data.bookDetails ? JSON.parse(parsed.data.bookDetails) : product.bookDetails;
    if (parsed.data.category === "BOOK" && !rawBookDetails) throw graphQLError("Preencha a ficha técnica do livro antes de aprovar.", "BAD_USER_INPUT");
    const bookDetails = parsed.data.category === "BOOK" ? parseBookDetails(JSON.stringify(rawBookDetails)) : rawBookDetails;
    const catalog = await CatalogProductModel.create({ ...parsed.data, videoID, avsin: await nextAVSIN(), images: parsed.data.imageIDs, variations: parsed.data.variations ?? [], bookDetails, sourceProductID: product._id, createdBy: adminID, updatedBy: adminID });
    if (newImageIDs.length) await MediaModel.updateMany({ _id: { $in: newImageIDs }, ownerID: adminID, resourceID: null }, { $set: { resourceType: "CATALOG_PRODUCT", resourceID: catalog._id } });
    if (videoID) await MediaModel.updateOne({ _id: videoID, ownerID: adminID, resourceID: null }, { $set: { resourceType: "CATALOG_PRODUCT", resourceID: catalog._id } });
    if (await ProductModel.exists({ sellerID: product.sellerID, catalogProductID: catalog._id })) throw graphQLError("Esta loja já tem um anúncio vinculado a esse AVSIN.", "CONFLICT");
    const linked = await ProductModel.updateOne({ _id: product._id, catalogProductID: null }, { $set: { catalogProductID: catalog._id } });
    if (!linked.modifiedCount) {
      await CatalogProductModel.deleteOne({ _id: catalog._id });
      if (newImageIDs.length) await MediaModel.updateMany({ _id: { $in: newImageIDs }, ownerID: adminID, resourceType: "CATALOG_PRODUCT", resourceID: catalog._id }, { $set: { resourceType: null, resourceID: null } });
      if (videoID) await MediaModel.updateOne({ _id: videoID, ownerID: adminID, resourceType: "CATALOG_PRODUCT", resourceID: catalog._id }, { $set: { resourceType: null, resourceID: null } });
      throw graphQLError("Outro administrador já vinculou este produto ao catálogo.", "CONFLICT");
    }
    return serializeCatalog(catalog.toObject());
  }
  static async createCatalog(userID: string | undefined, data: unknown) {
    const adminID = await requireAdmin(userID);
    const parsed = catalogInputSchema.safeParse(data);
    if (!parsed.success) throw graphQLError(parsed.error.issues[0]?.message ?? "Verifique os dados do item de catálogo.", "BAD_USER_INPUT");
    await requireUnassignedAdminImages(adminID, parsed.data.imageIDs);
    const videoID = await requireCatalogVideo(adminID, parsed.data.videoID);
    const rawBookDetails = parsed.data.bookDetails ? JSON.parse(parsed.data.bookDetails) : null;
    if (parsed.data.category === "BOOK" && !rawBookDetails) throw graphQLError("Preencha a ficha técnica do livro.", "BAD_USER_INPUT");
    const bookDetails = parsed.data.category === "BOOK" ? parseBookDetails(JSON.stringify(rawBookDetails)) : rawBookDetails;
    const catalog = await CatalogProductModel.create({ ...parsed.data, videoID, avsin: await nextAVSIN(), variations: parsed.data.variations ?? [], bookDetails, createdBy: adminID, updatedBy: adminID });
    await MediaModel.updateMany({ _id: { $in: parsed.data.imageIDs }, ownerID: adminID, resourceID: null }, { $set: { resourceType: "CATALOG_PRODUCT", resourceID: catalog._id } });
    if (videoID) await MediaModel.updateOne({ _id: videoID, ownerID: adminID, resourceID: null }, { $set: { resourceType: "CATALOG_PRODUCT", resourceID: catalog._id } });
    return serializeCatalog(catalog.toObject());
  }
  static async updateCatalog(userID: string | undefined, catalogID: string, data: unknown) {
    const adminID = await requireAdmin(userID);
    if (!Types.ObjectId.isValid(catalogID)) throw graphQLError("Item de catálogo não encontrado.", "NOT_FOUND");
    const parsed = catalogInputSchema.safeParse(data);
    if (!parsed.success) throw graphQLError(parsed.error.issues[0]?.message ?? "Verifique os dados do item de catálogo.", "BAD_USER_INPUT");
    const existing: any = await CatalogProductModel.findById(catalogID).lean();
    if (!existing) throw graphQLError("Item de catálogo não encontrado.", "NOT_FOUND");
    const videoID = await requireCatalogVideo(adminID, parsed.data.videoID, catalogID);
    const currentImageIDs = (existing.images ?? []).map((id: any) => id.toString());
    const newImageIDs = parsed.data.imageIDs.filter((id) => !currentImageIDs.includes(id));
    await requireUnassignedAdminImages(adminID, newImageIDs);
    const retainedImageIDs = parsed.data.imageIDs.length ? parsed.data.imageIDs : currentImageIDs;
    const rawBookDetails = parsed.data.bookDetails ? JSON.parse(parsed.data.bookDetails) : existing.bookDetails;
    if (parsed.data.category === "BOOK" && !rawBookDetails) throw graphQLError("Preencha a ficha técnica do livro.", "BAD_USER_INPUT");
    const bookDetails = parsed.data.category === "BOOK" ? parseBookDetails(JSON.stringify(rawBookDetails)) : rawBookDetails;
    const row = await CatalogProductModel.findByIdAndUpdate(catalogID, { $set: { ...parsed.data, videoID, images: retainedImageIDs, variations: parsed.data.variations ?? existing.variations, bookDetails, updatedBy: adminID } }, { new: true, runValidators: true }).lean();
    if (!row) throw graphQLError("Item de catálogo não encontrado.", "NOT_FOUND");
    await Promise.all([
      MediaModel.updateMany({ _id: { $in: currentImageIDs.filter((id: string) => !retainedImageIDs.includes(id)) }, ownerID: adminID, resourceType: "CATALOG_PRODUCT", resourceID: catalogID }, { $set: { resourceType: null, resourceID: null } }),
      MediaModel.updateMany({ _id: { $in: newImageIDs }, ownerID: adminID, resourceID: null }, { $set: { resourceType: "CATALOG_PRODUCT", resourceID: catalogID } }),
      existing.videoID && existing.videoID.toString() !== videoID?.toString() ? MediaModel.updateOne({ _id: existing.videoID, ownerID: adminID, resourceType: "CATALOG_PRODUCT", resourceID: catalogID }, { $set: { resourceType: null, resourceID: null } }) : Promise.resolve(),
      videoID && existing.videoID?.toString() !== videoID.toString() ? MediaModel.updateOne({ _id: videoID, ownerID: adminID, resourceID: null }, { $set: { resourceType: "CATALOG_PRODUCT", resourceID: catalogID } }) : Promise.resolve(),
    ]);
    return serializeCatalog(row);
  }
  static async create(userID: string | undefined, data: unknown) {
    const id = await this.requireReadyStore(userID);
    const parsed = inputSchema.safeParse(data);
    if (!parsed.success) throw graphQLError(parsed.error.issues[0]?.message ?? "Verifique os dados do produto.", "BAD_USER_INPUT");
    const catalogItem: any = parsed.data.catalogProductID ? await CatalogProductModel.findById(parsed.data.catalogProductID).lean() : null;
    if (parsed.data.catalogProductID && !catalogItem) throw graphQLError("Item de catálogo não encontrado.", "NOT_FOUND");
    if (catalogItem && parsed.data.gtin && catalogItem.gtin && parsed.data.gtin !== catalogItem.gtin) throw graphQLError("O GTIN informado não corresponde ao item de catálogo selecionado.", "BAD_USER_INPUT");
    if (catalogItem && await ProductModel.exists({ sellerID: id, catalogProductID: catalogItem._id })) throw graphQLError("Sua loja já tem um anúncio vinculado a esse AVSIN.", "CONFLICT");
    if (!catalogItem) {
      const matches = await possibleCatalogMatches(parsed.data);
      const exactMatch = matches[0];
      if (exactMatch) throw graphQLError(`Este produto corresponde ao item ${exactMatch.avsin} (${exactMatch.title}). Volte à busca do catálogo e vincule o anúncio existente.`, "BAD_USER_INPUT");
    }
    if (parsed.data.category === "BOOK" && !parsed.data.bookDetails && !catalogItem?.bookDetails) throw graphQLError("Preencha a ficha técnica do livro.", "BAD_USER_INPUT");
    const imageIDs = catalogItem ? [] : [...new Set([...parsed.data.imageIDs, ...parsed.data.variations.flatMap((variation) => variation.imageIDs)])];
    const mediaIDs = [...imageIDs, ...(!catalogItem && parsed.data.videoID ? [parsed.data.videoID] : [])];
    if (!catalogItem) {
      const media = await MediaModel.find({ _id: { $in: mediaIDs }, ownerID: id, purpose: { $in: parsed.data.videoID ? ["PRODUCT_IMAGE", "PRODUCT_VIDEO"] : ["PRODUCT_IMAGE"] }, status: "READY", resourceID: null });
      if (media.length !== mediaIDs.length || media.some((item) => parsed.data.videoID === item.id ? item.purpose !== "PRODUCT_VIDEO" : item.purpose !== "PRODUCT_IMAGE")) throw graphQLError("Uma ou mais mídias não estão disponíveis para este anúncio.", "BAD_USER_INPUT");
    }
    let bookDetails: unknown = null;
    if (parsed.data.category === "BOOK" && !catalogItem) {
      bookDetails = parseBookDetails(parsed.data.bookDetails);
    }
    const { videoID, ...productInput } = parsed.data;
    const catalogProductID = parsed.data.catalogProductID || null;
    const product = await ProductModel.create({ ...productInput, ...(catalogItem ? { title: catalogItem.title, gtin: catalogItem.gtin, category: catalogItem.category, description: catalogItem.description, variations: catalogItem.variations, bookDetails: catalogItem.bookDetails ?? bookDetails } : {}), catalogProductID, videoID: catalogItem ? null : videoID || null, bookDetails: catalogItem?.bookDetails ?? bookDetails, sellerID: id, images: catalogItem?.images?.length ? catalogItem.images : parsed.data.imageIDs });
    await MediaModel.updateMany({ _id: { $in: mediaIDs }, ownerID: id, resourceID: null }, { $set: { resourceType: "PRODUCT", resourceID: product._id } });
    const row: any = product.toObject();
    return { id: product.id, title: row.title, gtin: row.gtin, category: row.category, description: row.description, price: row.price, images: row.images.map(mediaUrl), imageIDs: row.images.map((image: any) => image.toString()), videoUrl: videoID ? `${env.API_PUBLIC_URL.replace(/\/$/, "")}/uploads/media/${videoID}` : "", videoID: videoID || null, variations: row.variations.map((variation: any) => ({ ...variation, imageIDs: variation.imageIDs.map((id: any) => id.toString()), imageUrls: variation.imageIDs.map(mediaUrl) })), bookDetails: row.bookDetails ? JSON.stringify(row.bookDetails) : null, catalogAVSIN: catalogProductID ? (await CatalogProductModel.findById(catalogProductID).select("avsin").lean() as any)?.avsin ?? null : null, international: row.international ?? false, shippingMethod: row.shippingMethod };
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
      international: z.boolean().optional().default(false),
      shippingMethod: z.enum(["MELHOR_ENVIO", "SELLER"]),
    });
    const parsed = updateSchema.safeParse(data);
    if (!parsed.success) throw graphQLError(parsed.error.issues[0]?.message ?? "Verifique os dados do produto.", "BAD_USER_INPUT");
    const existing: any = await ProductModel.findOne({ _id: productID, sellerID }).lean();
    if (!existing) throw graphQLError("Produto não encontrado.", "NOT_FOUND");
    if (existing.catalogProductID) {
      const catalog: any = await CatalogProductModel.findById(existing.catalogProductID).lean();
      if (!catalog) throw graphQLError("O item de catálogo vinculado não foi encontrado.", "NOT_FOUND");
      const row: any = await ProductModel.findOneAndUpdate({ _id: productID, sellerID }, { $set: { price: parsed.data.price, international: parsed.data.international, shippingMethod: parsed.data.shippingMethod } }, { new: true }).lean();
      const images = catalog.images?.length ? catalog.images : existing.images ?? [];
      return { id: row._id.toString(), title: catalog.title, gtin: catalog.gtin ?? "", category: catalog.category, description: catalog.description, price: row.price, images: images.map(mediaUrl), imageIDs: images.map((image: any) => image.toString()), videoUrl: "", videoID: null, variations: (catalog.variations ?? []).map((variation: any) => ({ title: variation.title, options: variation.options, imageIDs: [], imageUrls: [] })), bookDetails: catalog.bookDetails ? JSON.stringify(catalog.bookDetails) : null, catalogAVSIN: catalog.avsin, international: row.international ?? false, shippingMethod: row.shippingMethod };
    }
    const updateData = parsed.data;
    const mediaIDs = [...new Set([...updateData.imageIDs, ...updateData.variations.flatMap((variation: any) => variation.imageIDs), ...(updateData.videoID ? [updateData.videoID] : [])])];
    const allowedPurposes = updateData.videoID ? ["PRODUCT_IMAGE", "PRODUCT_VIDEO"] : ["PRODUCT_IMAGE"];
    const media = await MediaModel.find({ _id: { $in: mediaIDs }, ownerID: sellerID, purpose: { $in: allowedPurposes }, status: "READY" }).lean();
    const validMedia = media.length === mediaIDs.length && media.every((item: any) => {
      const isVideo = item._id.toString() === updateData.videoID;
      const belongsToThisProduct = item.resourceType === "PRODUCT" && item.resourceID?.toString() === productID;
      const isUnassigned = item.resourceID === null;
      return (isVideo ? item.purpose === "PRODUCT_VIDEO" : item.purpose === "PRODUCT_IMAGE") && (belongsToThisProduct || isUnassigned);
    });
    if (!validMedia) throw graphQLError("Uma ou mais mídias não estão disponíveis para este anúncio.", "BAD_USER_INPUT");
    let bookDetails: unknown = null;
    if (updateData.category === "BOOK") {
      bookDetails = parseBookDetails(updateData.bookDetails);
    }
    const row: any = await ProductModel.findOneAndUpdate(
      { _id: productID, sellerID }, { $set: { ...updateData, images: updateData.imageIDs, videoID: updateData.videoID || null, bookDetails } }, { new: true, runValidators: true },
    ).lean();
    if (!row) throw graphQLError("Produto não encontrado.", "NOT_FOUND");
    const oldMediaIDs = [...new Set([...(existing.images ?? []).map((mediaID: any) => mediaID.toString()), ...(existing.videoID ? [existing.videoID.toString()] : []), ...(existing.variations ?? []).flatMap((variation: any) => variation.imageIDs.map((mediaID: any) => mediaID.toString()))])];
    const retainedMediaIDs = new Set(mediaIDs);
    await Promise.all([
      MediaModel.updateMany({ _id: { $in: oldMediaIDs.filter((mediaID) => !retainedMediaIDs.has(mediaID)) }, ownerID: sellerID, resourceType: "PRODUCT", resourceID: productID }, { $set: { resourceType: null, resourceID: null } }),
      MediaModel.updateMany({ _id: { $in: mediaIDs }, ownerID: sellerID }, { $set: { resourceType: "PRODUCT", resourceID: productID } }),
    ]);
    const catalog: any = row.catalogProductID ? await CatalogProductModel.findById(row.catalogProductID).lean() : null;
    const item = catalog ?? row;
    const images = item.images?.length ? item.images : row.images;
    return {
      id: row._id.toString(), title: item.title, gtin: item.gtin ?? "", category: item.category,
      description: item.description, price: row.price, images: images.map(mediaUrl), imageIDs: images.map((image: any) => image.toString()),
      videoUrl: row.videoID ? `${env.API_PUBLIC_URL.replace(/\/$/, "")}/uploads/media/${row.videoID}` : "", videoID: row.videoID?.toString() ?? null,
      variations: (item.variations ?? []).map((variation: any) => ({ title: variation.title, options: variation.options, imageIDs: variation.imageIDs?.map((id: any) => id.toString()) ?? [], imageUrls: variation.imageIDs?.map(mediaUrl) ?? [] })), bookDetails: item.bookDetails ? JSON.stringify(item.bookDetails) : null,
      catalogAVSIN: catalog?.avsin ?? null,
      international: row.international ?? false, shippingMethod: row.shippingMethod,
    };
  }
}
export default ProductService;
