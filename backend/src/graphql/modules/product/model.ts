import { model, Schema, Types } from "mongoose";

const variationSchema = new Schema({ title: { type: String, required: true, trim: true, maxlength: 60 }, options: [{ type: String, required: true, trim: true, maxlength: 60 }], imageIDs: [{ type: Schema.Types.ObjectId, ref: "Media" }] }, { _id: false });
const productSchema = new Schema({
  sellerID: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  catalogProductID: { type: Schema.Types.ObjectId, ref: "CatalogProduct", default: null, index: true },
  images: [{ type: Schema.Types.ObjectId, ref: "Media", required: true }], videoID: { type: Schema.Types.ObjectId, ref: "Media", default: null },
  title: { type: String, required: true, trim: true, maxlength: 150 }, gtin: { type: String, trim: true, maxlength: 14, default: "" },
  category: { type: String, required: true, enum: ["BOOK", "ELECTRONICS", "HOME", "FASHION", "SPORTS", "OTHER"] },
  description: { type: String, required: true, trim: true, minlength: 120, maxlength: 5000 }, price: { type: Number, required: true, min: 0.01 },
  variations: { type: [variationSchema], default: [] }, bookDetails: { type: Schema.Types.Mixed, default: null }, international: { type: Boolean, default: false }, shippingMethod: { type: String, required: true, enum: ["MELHOR_ENVIO", "SELLER"] },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

productSchema.index({ sellerID: 1, catalogProductID: 1 }, { unique: true, partialFilterExpression: { catalogProductID: { $type: "objectId" } } });

const ProductModel = model("Product", productSchema);
export { ProductModel };
