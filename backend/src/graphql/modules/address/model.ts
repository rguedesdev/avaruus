import { model, Schema, Types } from "mongoose";

interface IAddress {
  userID: Types.ObjectId;
  label: string;
  recipientName: string;
  postalCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    userID: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, required: true, trim: true, maxlength: 40 },
    recipientName: { type: String, required: true, trim: true, maxlength: 120 },
    postalCode: { type: String, required: true, minlength: 8, maxlength: 8 },
    street: { type: String, required: true, trim: true, maxlength: 160 },
    number: { type: String, required: true, trim: true, maxlength: 20 },
    complement: { type: String, default: null, trim: true, maxlength: 80 },
    neighborhood: { type: String, required: true, trim: true, maxlength: 100 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, required: true, uppercase: true, minlength: 2, maxlength: 2 },
    isDefault: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

addressSchema.index({ userID: 1, isDefault: 1 });

const AddressModel = model<IAddress>("Address", addressSchema);

export { AddressModel };
