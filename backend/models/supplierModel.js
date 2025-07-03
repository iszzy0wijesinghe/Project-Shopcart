import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  lastStockOrder: {
    type: String,
    required: true,
  },
  minOrderQuantity: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  companyEmail: {
    type: String,
    required: true,
  },
  foodType: {
    type: String,
    required: true,
  },
  itemCategory: {
    type: String,
    required: true,
  }
}, { timestamps: true });

export default mongoose.model('Supplier', supplierSchema);
