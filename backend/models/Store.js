import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const StoreSchema = new mongoose.Schema({
    name: { type: String, required: true },
    logo: { type: String },
    description: { type: String },
    address: {
        line1: { type: String, required: true },
        line2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true } // [longitude, latitude]
        }
    },
    ShopOwner: ({ type: mongoose.Schema.Types.ObjectId, ref: 'ShopOwner', required: true }),
    operatingHours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String }
    },
    deliveryFee: { type: Number, default: 0 },
    minimumOrderAmount: { type: Number, default: 0 },
    serviceArea: {
        type: { type: String, enum: ['Polygon'], default: 'Polygon' },
        coordinates: { type: [[[Number]]], required: true } // GeoJSON polygon
    },
    isActive: { type: Boolean, default: true },
    featuredItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductStore' }],
    matchesInStorePrices: { type: Boolean, default: false },
    ratings: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Apply the pagination plugin to the schema
StoreSchema.plugin(mongoosePaginate);
  
// Index for geospatial queries
StoreSchema.index({ 'address.location': '2dsphere' });
StoreSchema.index({ 'serviceArea': '2dsphere' });

export default mongoose.model('Store', StoreSchema);
