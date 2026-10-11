import { model, Schema, Types } from "mongoose";

interface ISellerSettings {
  userID: Types.ObjectId;
  slug?: string;
  slugBase?: string;
  storeName: string;
  phone: string;
  taxDocument: string;
  photoUrl: string;
  photoImageID: Types.ObjectId | null;
  description: string;
  sellerAddresses: Array<{
    _id?: Types.ObjectId;
    label: string;
    recipientName: string;
    postalCode: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    purposes: Array<"SHIPPING" | "RETURN" | "PICKUP">;
  }>;
  businessHours: Record<string, { closed: boolean; open: string; close: string }>;
  orderNotifications: boolean;
  promotionalNotifications: boolean;
  stockNotifications: boolean;
  vacationMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sellerSettingsSchema = new Schema<ISellerSettings>({
  userID: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  slug: { type: String, trim: true, unique: true, sparse: true },
  slugBase: { type: String, trim: true, index: true },
  storeName: { type: String, default: "", trim: true, maxlength: 100 },
  phone: { type: String, default: "", trim: true, maxlength: 30 },
  taxDocument: { type: String, default: "", trim: true, maxlength: 14 },
  photoUrl: { type: String, default: "", trim: true, maxlength: 500 },
  photoImageID: { type: Schema.Types.ObjectId, ref: "Media", default: null },
  description: { type: String, default: "", trim: true, maxlength: 1000 },
  sellerAddresses: [{
    label: { type: String, required: true, trim: true, maxlength: 40 },
    recipientName: { type: String, required: true, trim: true, maxlength: 120 },
    postalCode: { type: String, required: true, minlength: 8, maxlength: 8 },
    street: { type: String, required: true, trim: true, maxlength: 160 },
    number: { type: String, required: true, trim: true, maxlength: 20 },
    complement: { type: String, default: "", trim: true, maxlength: 80 },
    neighborhood: { type: String, required: true, trim: true, maxlength: 100 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, required: true, uppercase: true, minlength: 2, maxlength: 2 },
    purposes: { type: [String], enum: ["SHIPPING", "RETURN", "PICKUP"], required: true },
  }],
  businessHours: { type: Schema.Types.Mixed, default: {} },
  orderNotifications: { type: Boolean, default: true },
  promotionalNotifications: { type: Boolean, default: false },
  stockNotifications: { type: Boolean, default: true },
  vacationMode: { type: Boolean, default: false },
}, { timestamps: true });

const SellerSettingsModel = model<ISellerSettings>("SellerSettings", sellerSettingsSchema);

export { SellerSettingsModel };
export type { ISellerSettings };
