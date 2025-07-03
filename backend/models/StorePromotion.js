import mongoose from "mongoose";

const StorePromotionSchema = new mongoose.Schema({
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    type: { type: String, enum: ['amount_off', 'percentage_off'], required: true },
    value: { type: Number, required: true }, // $15 or 10%
    minimumPurchase: { type: Number, default: 0 },
    maximumDiscount: { type: Number }, // Cap for percentage discounts
    code: { type: String }, // Optional promo code
    description: { type: String, required: true }, // "$15 off" display text
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    displayOnStorefront: { type: Boolean, default: true }
});

// Index for geospatial queries
StorePromotionSchema.index({ userId: 1 });

export default mongoose.model('StorePromotion', StorePromotionSchema);


// const PromotionSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     description: { type: String, required: true },
//     storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' }, // Optional, for store-specific promos
//     type: { 
//       type: String, 
//       enum: [
//         'amount_off', 'percentage_off', 'bogo', 'free_delivery', 
//         'free_item', 'reward_points', 'threshold_discount'
//       ],
//       required: true 
//     },
//     value: { type: Number, required: true },
//     displayText: { type: String, required: true }, // "$15 off" or "In-store prices"
//     displayStyle: {
//       backgroundColor: { type: String, default: '#FFF8E1' }, // Light yellow default
//       textColor: { type: String, default: '#FF8F00' },
//       borderColor: { type: String, default: '#FFE082' },
//       priority: { type: Number, default: 1 }, // Higher numbers show first
//     },
//     conditions: {
//       minimumPurchase: { type: Number, default: 0 },
//       maximumDiscount: { type: Number },
//       applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
//       applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
//       limitPerCustomer: { type: Number },
//       newCustomersOnly: { type: Boolean, default: false },
//       requiresCouponCode: { type: Boolean, default: false },
//       couponCode: { type: String },
//     },
//     startDate: { type: Date, required: true },
//     endDate: { type: Date, required: true },
//     isActive: { type: Boolean, default: true }
//   });