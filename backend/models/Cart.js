import mongoose from "mongoose";

const CartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    sessionId: { type: String }, // For guest carts
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    items: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductStore', required: true },
      name: { type: String, required: true },
      image: { type: String },
      price: { type: Number, required: true },
      salePrice: { type: Number },
      quantity: { type: Number, required: true, min: 1 },
      unit: { type: String },
      notes: { type: String },
      substitutionPreference: { 
        type: String, 
        enum: ['refund', 'shopper_choice', 'specific_replacement'], 
        default: 'shopper_choice' 
      },
      specificReplacement: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
    }],
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    tip: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    couponCodes: [{ type: String }],
    discounts: [{
      code: { type: String },
      amount: { type: Number },
      type: { type: String, enum: ['percentage', 'fixed'] }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date } // TTL for cart cleanup
  });

// Indexes
CartSchema.index({ userId: 1 });
CartSchema.index({ sessionId: 1 });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export default mongoose.model('Cart', CartSchema);