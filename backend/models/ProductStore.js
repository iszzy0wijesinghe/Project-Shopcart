import mongoose from "mongoose";

const ProductStoreSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    price: { type: Number, required: true },
    salePrice: { type: Number },
    unit: { type: String, required: true }, // e.g., "lb", "oz", "each"
    unitDescription: { type: String },
    images: [{ type: String }],
    brand: { type: String },
    barcode: { type: String },
    inventory: {
      quantity: { type: Number, default: 0 },
      status: { type: String, enum: ['in_stock', 'low_stock', 'out_of_stock'], default: 'in_stock' }
    },
    attributes: {
      organic: { type: Boolean, default: false },
      glutenFree: { type: Boolean, default: false },
      vegan: { type: Boolean, default: false },
      vegetarian: { type: Boolean, default: false },
      dairyFree: { type: Boolean, default: false },
      nutFree: { type: Boolean, default: false },
      // other attributes
    },
    nutritionFacts: {
      servingSize: { type: String },
      calories: { type: Number },
      fat: { type: Number },
      carbs: { type: Number },
      protein: { type: Number },
      // other nutrition details
    },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isPopular: { type: Boolean, default: false },
    isRecommended: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    tags: [{ type: String }],
    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
// Indexes for queries
ProductStoreSchema.index({ storeId: 1 });
ProductStoreSchema.index({ categoryIds: 1 });
ProductStoreSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });

export default mongoose.model('ProductStore', ProductStoreSchema);