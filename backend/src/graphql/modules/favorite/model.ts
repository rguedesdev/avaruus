import { model, Schema, Types } from "mongoose";

interface IFavorite {
  userID: Types.ObjectId;
  productSlug: string;
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    userID: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    productSlug: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
  },
  { timestamps: true },
);

favoriteSchema.index({ userID: 1, productSlug: 1 }, { unique: true });

const FavoriteModel = model<IFavorite>("Favorite", favoriteSchema);

export { FavoriteModel };
