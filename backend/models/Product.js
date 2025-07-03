import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    // Product name, e.g., "Fresh Tomatoes"
    name: {
      type: String,
      required: true,
      trim: true
    },
    // Reference to the category document
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    /**
     * The standard/base price for this product
     *  - For vegetables, interpret as "per 500g"
     *  - For groceries, interpret as "per item" or package
     */
    price: {
      type: Number,
      required: true,
      min: 0
    },
    /**
     * Shop-owner discount fields
     */
    priceBeforeDiscount: {
      type: Number,
      required: true,
      min: 0
    },
    priceAfterDiscount: {
      type: Number,
      required: true,
      min: 0
    },
    availability: {
      type: Boolean,
      default: false
    },
    imageUrl: {
      type: String,
      default: 'https://res.cloudinary.com/dcbx57wnb/image/upload/v1738412338/pngtree-grocery-bag-clipart-grocery-bag-with-vegetables-cartoon-vector-png-image_6866175_x5bz8t.png'
    },
    description: {
      type: String,
      default: ''
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Product', ProductSchema);
