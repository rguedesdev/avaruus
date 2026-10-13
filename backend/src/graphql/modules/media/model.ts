import { model, Schema, Types } from "mongoose";

interface IMedia {
  ownerID: Types.ObjectId;
  storageKey: string;
  originalName: string;
  mimeType: string;
  originalMimeType: string;
  originalSize: number;
  size: number;
  width: number;
  height: number;
  purpose: "USER_AVATAR" | "SELLER_AVATAR" | "PRODUCT_IMAGE" | "PRODUCT_VIDEO";
  status: "READY";
  resourceType: "USER" | "SELLER_SETTINGS" | "PRODUCT" | "CATALOG_PRODUCT" | null;
  resourceID: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<IMedia>(
  {
    ownerID: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    storageKey: { type: String, required: true, unique: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, enum: ["image/webp", "video/mp4", "video/webm"], required: true },
    originalMimeType: { type: String, required: true },
    originalSize: { type: Number, required: true, min: 0 },
    size: { type: Number, required: true, min: 0 },
    width: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 },
    purpose: { type: String, enum: ["USER_AVATAR", "SELLER_AVATAR", "PRODUCT_IMAGE", "PRODUCT_VIDEO"], required: true },
    status: { type: String, enum: ["READY"], required: true },
    resourceType: { type: String, enum: ["USER", "SELLER_SETTINGS", "PRODUCT", "CATALOG_PRODUCT", null], default: null },
    resourceID: { type: Schema.Types.ObjectId, default: null, index: true },
  },
  { timestamps: true },
);

const MediaModel = model<IMedia>("Media", mediaSchema);

export { MediaModel };
export type { IMedia };
