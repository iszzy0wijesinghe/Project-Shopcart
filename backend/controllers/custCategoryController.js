import Category from '../models/Category.js';
import ProductStore from '../models/ProductStore.js';
import { isValidObjectId } from 'mongoose';
import createError from 'http-errors';
import logger from '../utils/logger.js';

// Get categories with product counts
export const getCategoriesWithProductCount = async (req, res, next) => {
    try {
      const { storeId } = req.params;
  
      if (!isValidObjectId(storeId)) {
        return next(createError(400, 'Invalid store ID format'));
      }
  
      // Get all categories for the store
      const categories = await Category.find({ storeId }).lean();
  
      // Build result with product counts
      const result = [];
  
      for (const category of categories) {
        // Count products in this category and its subcategories
        const categoryIds = await getAllChildCategoryIds(category._id);
        categoryIds.push(category._id);
  
        const productCount = await ProductStore.countDocuments({
          categoryIds: { $in: categoryIds }
        });
  
        result.push({
          ...category,
          productCount
        });
      }

      logger.info(`Fetched categories with product counts for store ${storeId}`);
  
      res.status(200).json({
        success: true,
        count: result.length,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  export const getAllChildCategoryIds = async (categoryId) => {
    // Find direct child categories
    const children = await Category.find({ parentCategory: categoryId }).select('_id');
    let ids = children.map(child => child._id);
    
    // Recursively fetch subcategory IDs for each child
    for (const child of children) {
      const subIds = await getAllChildCategoryIds(child._id);
      ids = ids.concat(subIds);
    }
    return ids;
  };