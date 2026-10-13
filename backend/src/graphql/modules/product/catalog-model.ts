import { model, Schema } from "mongoose";

const catalogVariationSchema = new Schema({ title: { type: String, required: true, trim: true, maxlength: 60 }, options: [{ type: String, required: true, trim: true, maxlength: 60 }], imageIDs: [{ type: Schema.Types.ObjectId, ref: "Media" }] }, { _id: false });
const catalogProductSchema = new Schema({
  avsin: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 150 },
  gtin: { type: String, trim: true, maxlength: 14, default: "", index: true },
  category: { type: String, required: true, enum: ["BOOK", "ELECTRONICS", "HOME", "FASHION", "SPORTS", "OTHER"] },
  description: { type: String, required: true, trim: true, minlength: 1, maxlength: 5000 },
  images: [{ type: Schema.Types.ObjectId, ref: "Media" }],
  videoID: { type: Schema.Types.ObjectId, ref: "Media", default: null },
  variations: { type: [catalogVariationSchema], default: [] },
  bookDetails: { type: Schema.Types.Mixed, default: null },
  sourceProductID: { type: Schema.Types.ObjectId, ref: "Product", default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

const catalogCounterSchema = new Schema({ _id: { type: String }, sequence: { type: Number, default: 0 } }, { versionKey: false });
const CatalogProductModel = model("CatalogProduct", catalogProductSchema);
const CatalogCounterModel = model("CatalogCounter", catalogCounterSchema);
export { CatalogProductModel, CatalogCounterModel };
