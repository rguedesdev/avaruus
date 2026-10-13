import { z } from "zod";

import { graphQLError } from "../../errors.js";
import MediaService, { mediaUrl } from "../media/service.js";
import { UserModel } from "../user/model.js";
import { SellerSettingsModel } from "./model.js";

function isValidTaxDocument(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^(\d)\1+$/.test(digits)) return false;
  if (digits.length === 11) {
    const digit = (length: number) => {
      const sum = Array.from(digits.slice(0, length)).reduce((total, item, index) => total + Number(item) * (length + 1 - index), 0);
      const remainder = (sum * 10) % 11;
      return remainder === 10 ? 0 : remainder;
    };
    return digit(9) === Number(digits[9]) && digit(10) === Number(digits[10]);
  }
  if (digits.length === 14) {
    const check = (length: number) => {
      const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      const sum = weights.reduce((total, weight, index) => total + Number(digits[index]) * weight, 0);
      const remainder = sum % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };
    return check(12) === Number(digits[12]) && check(13) === Number(digits[13]);
  }
  return false;
}

const settingsSchema = z.object({
  storeName: z.string().trim().min(1, "Informe o nome da loja.").max(100),
  phone: z.string().trim().min(1, "Informe o telefone da loja.").max(30),
  taxDocument: z.string().trim().refine(isValidTaxDocument, "Informe um CPF ou CNPJ válido para a loja."),
  photoImageID: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional().transform((value) => value ?? null),
  description: z.string().trim().max(1000),
  sellerAddresses: z.array(z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i).optional(),
    label: z.string().trim().min(1).max(40),
    recipientName: z.string().trim().min(2).max(120),
    postalCode: z.string().transform((value) => value.replace(/\D/g, "")).refine((value) => value.length === 8, "Informe um CEP válido."),
    street: z.string().trim().min(2).max(160),
    number: z.string().trim().min(1).max(20),
    complement: z.string().trim().max(80),
    neighborhood: z.string().trim().min(2).max(100),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/),
    purposes: z.array(z.enum(["SHIPPING", "RETURN", "PICKUP"])).min(1),
  })).max(30),
  businessHours: z.object(Object.fromEntries(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => [day, z.object({
    closed: z.boolean(), open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  }).refine((hours) => hours.closed || hours.open < hours.close, "O horário de fechamento deve ser posterior ao de abertura.")])) as Record<string, z.ZodTypeAny>),
  orderNotifications: z.boolean(),
  promotionalNotifications: z.boolean(),
  stockNotifications: z.boolean(),
  vacationMode: z.boolean(),
});

const defaults = {
  slug: "", storeName: "", phone: "", taxDocument: "", photoUrl: "", photoImageID: null, description: "", sellerAddresses: [],
  businessHours: Object.fromEntries(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => [day, { closed: day === "sunday", open: "09:00", close: "18:00" }])), orderNotifications: true, promotionalNotifications: false,
  stockNotifications: true, vacationMode: false,
};
const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

function normalizedSettings(settings: any) {
  const storedHours = settings?.businessHours;
  const businessHours = storedHours && typeof storedHours === "object" && dayNames.every((day) => storedHours[day] && typeof storedHours[day] === "object")
    ? Object.fromEntries(dayNames.map((day) => [day, {
      closed: Boolean(storedHours[day].closed),
      open: typeof storedHours[day].open === "string" ? storedHours[day].open : "09:00",
      close: typeof storedHours[day].close === "string" ? storedHours[day].close : "18:00",
    }]))
    : defaults.businessHours;
  return {
    ...defaults,
    ...settings,
    slug: settings?.slug || settings?.slugBase || "",
    sellerAddresses: settings?.sellerAddresses?.map((address: any) => ({ ...address, id: address._id?.toString() ?? address.id })) ?? [],
    businessHours,
    photoUrl: settings?.photoImageID ? mediaUrl(settings.photoImageID) : "",
  };
}

function storeSlugBase(storeName: string) {
  return storeName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48).replace(/-$/g, "") || "loja";
}

function createStoreSlug(storeName: string) {
  return storeSlugBase(storeName);
}

class SellerService {
  private static requireUser(userID?: string) {
    if (!userID) throw graphQLError("Acesso não autenticado.", "UNAUTHENTICATED");
    return userID;
  }

  static async getSettings(userID?: string) {
    const id = this.requireUser(userID);
    let settings = await SellerSettingsModel.findOne({ userID: id }).lean();
    if (settings?.storeName?.trim()) {
      const slugBase = storeSlugBase(settings.storeName);
      const values = { slugBase, slug: createStoreSlug(settings.storeName) };
      settings = await SellerSettingsModel.findOneAndUpdate(
        { userID: id }, { $set: values }, { new: true },
      ).lean() ?? settings;
    }
    return normalizedSettings(settings);
  }

  static async saveSettings(userID: string | undefined, data: unknown) {
    const id = this.requireUser(userID);
    const parsed = settingsSchema.safeParse(data);
    if (!parsed.success) throw graphQLError(parsed.error.issues[0]?.message ?? "Verifique os dados da loja.", "BAD_USER_INPUT");
    const existing = await SellerSettingsModel.findOne({ userID: id }).lean();
    const previousPhotoID = existing?.photoImageID?.toString() ?? null;
    if (parsed.data.photoImageID && parsed.data.photoImageID !== previousPhotoID) {
      await MediaService.requireAttachableSellerAvatar(parsed.data.photoImageID, id);
    }
    const { sellerAddresses, ...otherSettings } = parsed.data;
    const values = {
      ...otherSettings,
      ...(parsed.data.storeName ? {
        slugBase: storeSlugBase(parsed.data.storeName),
        slug: createStoreSlug(parsed.data.storeName),
      } : {}),
      photoUrl: "",
      sellerAddresses: sellerAddresses.map(({ id: addressID, ...address }) => ({ ...address, ...(addressID ? { _id: addressID } : {}) })),
    };
    const settings = await SellerSettingsModel.findOneAndUpdate(
      { userID: id }, { $set: values, $setOnInsert: { userID: id } }, { new: true, upsert: true, runValidators: true },
    ).lean();
    if (settings && parsed.data.photoImageID && parsed.data.photoImageID !== previousPhotoID) {
      await MediaService.attachSellerAvatar(parsed.data.photoImageID, id, settings._id.toString());
    }
    if (settings && previousPhotoID && previousPhotoID !== parsed.data.photoImageID) {
      await MediaService.detachSellerAvatar(previousPhotoID, id, settings._id.toString());
    }
    const persistedSettings = await SellerSettingsModel.findOne({ userID: id }).lean();
    await UserModel.updateOne({ _id: id, accountType: "CUSTOMER" }, { $set: { accountType: "SELLER" } });
    return normalizedSettings(persistedSettings);
  }

  static async getPublicStore(slug: string) {
    let settings = await SellerSettingsModel.findOne({ slug, storeName: { $ne: "" } }).lean()
      ?? await SellerSettingsModel.findOne({ slugBase: slug, storeName: { $ne: "" } }).lean();
    if (!settings) {
      const legacySettings = await SellerSettingsModel.find({ storeName: { $ne: "" } }).lean();
      const matchingStores = legacySettings.filter((candidate) => storeSlugBase(candidate.storeName) === slug);
      const legacyStore = matchingStores.find((candidate) => candidate.slug === slug) ?? matchingStores[0];
      if (legacyStore) {
        settings = await SellerSettingsModel.findOneAndUpdate(
          { userID: legacyStore.userID }, { $set: { slugBase: slug } }, { new: true },
        ).lean() ?? legacyStore;
      }
    }
    if (!settings) return null;
    return {
      slug: settings.slug || settings.slugBase || slug,
      storeName: settings.storeName,
      photoUrl: settings.photoImageID ? mediaUrl(settings.photoImageID) : "",
      description: settings.description,
      vacationMode: settings.vacationMode,
    };
  }
}

export default SellerService;
