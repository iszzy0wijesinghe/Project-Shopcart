import mongoose from 'mongoose';

const shopOwnerRequestSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  companyEmail: {
    type: String,
    required: true,
  },
  maxStock: {
    type: String,
    required: true,
  },
  minStock: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  foodType: {
    type: String,
    required: true,
  },
  categoryType: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  }
}, {
  timestamps: true
});

export default mongoose.model('ShopOwnerRequest', shopOwnerRequestSchema);
