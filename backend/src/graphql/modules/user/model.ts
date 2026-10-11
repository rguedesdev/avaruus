import { model, Schema, Types } from "mongoose";

interface IUser {
  accountType: "CUSTOMER" | "SELLER" | "ADMIN";
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  avatarUrl: string | null;
  avatarImageID: Types.ObjectId | null;
  cpfEncrypted: string | null;
  cpfHash: string | null;
  cpfLastFour: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    accountType: {
      type: String,
      enum: ["CUSTOMER", "SELLER", "ADMIN"],
      default: "CUSTOMER",
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      minlength: 3,
      maxlength: 30,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    avatarUrl: { type: String, default: null },
    avatarImageID: { type: Schema.Types.ObjectId, ref: "Media", default: null },
    cpfEncrypted: { type: String, default: null, select: false },
    cpfHash: { type: String, default: null, unique: true, sparse: true, select: false },
    cpfLastFour: { type: String, default: null },
  },
  { timestamps: true },
);

const UserModel = model<IUser>("User", userSchema);

export { UserModel };
export type { IUser };
