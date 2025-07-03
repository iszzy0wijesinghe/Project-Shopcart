import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  /**
   * Display name of the category (e.g. "Vegetables", "Meat & Fish", "Dairy")
   */
  name: {
    type: String,
    required: true,
    trim: true
  },
  /**
   * A unique slug for SEO-friendly URLs or referencing
   * e.g., "vegetables", "meat-and-fish"
   */
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  /**
   * Short description or additional info about this category
   */
  description: {
    type: String,
    default: ''
  },
  /**
   * If you want to show an icon or image for the category
   */
  imageUrl: {
    type: String,
    default: ''
  },
  /**
   * Whether the category is active (visible) or not
   */
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model('Category', CategorySchema);
