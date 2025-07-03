import mongoose from 'mongoose';

const requestOrderSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  maxQuantity: {
    type: String, // or Number if you're storing "100kg" as just 100
    required: true,
  },
  minQuantity: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  availabilityStatus: {
    type: String,
    default: 'Available'
  },
  orderQuantity: {
    type: String,
    required: true,
  },
  foodType: {
    type: String,
    required: true
  },
  itemCategory: {
    type: String,
    required: true
  },
  createdBy: {
    type: String, // Use user ID when login is implemented. For now, keep it empty or use default
    default: 'Guest'
  }
  
}, {
  timestamps: true
});

export default mongoose.model('requestOrders', requestOrderSchema);
