import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Customer', 
      required: true 
    },
    token: { 
      type: String, 
      required: true 
    },
    type: { 
      type: String, 
      required: true 
    },
    expiresAt: { 
      type: Date, 
      required: true 
    }
  },
  { timestamps: true }
);

export default mongoose.model('Token', tokenSchema);
