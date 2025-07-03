import ProductStore from '../models/ProductStore.js';
import Category from '../models/Category.js';
import { isValidObjectId } from 'mongoose';
import createError from 'http-errors';
import logger from '../utils/logger.js';

// Get all products with optional filtering
export const getAllProducts = async (req, res, next) => {
  try {
    const {
      storeId,
      categoryId,
      search,
      minPrice,
      maxPrice,
      sort = 'name',
      order = 'asc',
      page = 1,
      limit = 20,
      attributes,
    //   inStock
    } = req.query;

    const inStock = true; // Default to true for inStock filter

    // Build filter object
    const filter = {};

    // Store filter
    if (storeId) {
      if (!isValidObjectId(storeId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid store ID format'
        });
      }
      filter.storeId = storeId;
    }

    // Category filter
    if (categoryId) {
      if (!isValidObjectId(categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID format'
        });
      }
      
      // Find the category and all its child categories
      const categoryIds = [categoryId];
      const childCategories = await Category.find({ parentCategory: categoryId });
      childCategories.forEach(cat => categoryIds.push(cat._id));
      
      filter.categoryIds = { $in: categoryIds };
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    // Inventory status filter
    if (inStock === 'true') {
      filter['inventory.status'] = { $ne: 'out_of_stock' };
    }

    // Product attributes filter (e.g., organic, glutenFree, etc.)
    if (attributes) {
      const attributeFilters = attributes.split(',');
      attributeFilters.forEach(attr => {
        filter[`attributes.${attr}`] = true;
      });
    }

    // Search query using text index
    if (search) {
      filter.$text = { $search: search };
    }

    // Sorting options
    const sortOptions = {};
    if (sort === 'price') {
      sortOptions.price = order === 'desc' ? -1 : 1;
    } else if (sort === 'popularity') {
      sortOptions.reviewCount = order === 'desc' ? -1 : 1;
    } else if (sort === 'rating') {
      sortOptions.averageRating = order === 'desc' ? -1 : 1;
    } else {
      // Default sort by name
      sortOptions.name = order === 'desc' ? -1 : 1;
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const pageSize = Number(limit);

    // Execute query with pagination
    const products = await ProductStore.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .populate('categoryIds', 'name slug')
      .lean();

    // Get total count for pagination
    const totalProducts = await ProductStore.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / pageSize);

    // Return response with pagination metadata
    return res.status(200).json({
      success: true,
      count: products.length,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalProducts,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1
      },
      data: products
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get a single product by ID
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return next(createError(400, 'Invalid product ID format'));
    }

    const product = await ProductStore.findById(id)
      .populate('categoryIds', 'name slug')
      .populate('storeId', 'name logo')
      .populate({
        path: 'relatedProducts',
        select: 'name price images averageRating',
        limit: 5
      })
      .lean();

    if (!product) {
      return next(createError(404, 'Product not found'));
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};



// Create a new product
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      storeId,
      categoryIds,
      price,
      salePrice,
      unit,
      images,
      brand,
      barcode,
      inventory,
      attributes,
      nutritionFacts,
      tags,
      relatedProducts
    } = req.body;

    // Validate required fields
    if (!name || !storeId || !price || !unit) {
      return next(createError(400, 'Please provide all required fields: name, storeId, price, unit'));
    }

    // Validate storeId
    if (!isValidObjectId(storeId)) {
      return next(createError(400, 'Invalid store ID format'));
    }

    // Validate categoryIds if provided
    if (categoryIds && categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        if (!isValidObjectId(categoryId)) {
          return next(createError(400, `Invalid category ID format: ${categoryId}`));
        }
        
        // Check if category exists
        const categoryExists = await Category.exists({ _id: categoryId, storeId });
        if (!categoryExists) {
          return next(createError(400, `Category not found or doesn't belong to the specified store: ${categoryId}`));
        }
      }
    }

    // Create new product
    const product = new ProductStore({
      name,
      description,
      storeId,
      categoryIds,
      price,
      salePrice,
      unit,
      images,
      brand,
      barcode,
      inventory,
      attributes,
      nutritionFacts,
      tags,
      relatedProducts
    });

    await product.save();

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// Update a product
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!isValidObjectId(id)) {
      return next(createError(400, 'Invalid product ID format'));
    }

    // Verify storeId if it's being updated
    if (updateData.storeId && !isValidObjectId(updateData.storeId)) {
      return next(createError(400, 'Invalid store ID format'));
    }

    // Verify categoryIds if they're being updated
    if (updateData.categoryIds && updateData.categoryIds.length > 0) {
      for (const categoryId of updateData.categoryIds) {
        if (!isValidObjectId(categoryId)) {
          return next(createError(400, `Invalid category ID format: ${categoryId}`));
        }
      }
    }

    // Set updatedAt timestamp
    updateData.updatedAt = Date.now();

    // Find and update the product
    const product = await ProductStore.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('categoryIds', 'name slug');

    if (!product) {
      return next(createError(404, 'Product not found'));
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// Delete a product
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return next(createError(400, 'Invalid product ID format'));
    }

    const product = await ProductStore.findByIdAndDelete(id);

    if (!product) {
      return next(createError(404, 'Product not found'));
    }

    res.status(200).json({
      success: true,
      message: 'Product successfully deleted',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};



// Get featured products
export const getFeaturedProductsStore = async (req, res, next) => {
  try {
    const { storeId, limit = 10 } = req.query;

    const filter = { isFeatured: true };

    if (storeId) {
      if (!isValidObjectId(storeId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid store ID format'
        });
      }
      filter.storeId = storeId;
    }

    const featuredProducts = await ProductStore.find(filter)
      .limit(Number(limit))
      .select('name storeId price salePrice unit images')
      .lean();

    res.status(200).json({
      success: true,
      count: featuredProducts.length,
      data: featuredProducts
    });
  } catch (error) {
    next(error);
  }
};

// Get popular products
export const getPopularProductsStore = async (req, res, next) => {
  try {
    const { storeId, limit = 10 } = req.query;

    const filter = { isPopular: true };

    if (storeId) {
      if (!isValidObjectId(storeId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid store ID format'
        });
      }
      filter.storeId = storeId;
    }

    const popularProducts = await ProductStore.find(filter)
      .sort({ reviewCount: -1, averageRating: -1 })
      .limit(Number(limit))
      .select('name storeId price salePrice unit images')
      .lean();

    res.status(200).json({
      success: true,
      count: popularProducts.length,
      data: popularProducts
    });
  } catch (error) {
    next(error);
  }
};

// Get recommended products (can be personalized in the future)
export const getRecommendedProductsStore = async (req, res, next) => {
  try {
    const { storeId, productId, limit = 10 } = req.query;

    let filter = { isRecommended: true };

    if (storeId) {
      if (!isValidObjectId(storeId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid store ID format'
        });
      }
      filter.storeId = storeId;
    }

    // If productId is provided, first check if it has related products
    let recommendedProducts = [];
    
    if (productId && isValidObjectId(productId)) {
      const product = await ProductStore.findById(productId).populate('relatedProducts').lean();
      
      if (product && product.relatedProducts && product.relatedProducts.length > 0) {
        recommendedProducts = product.relatedProducts;
        
        // If we don't have enough related products, we'll add more below
        if (recommendedProducts.length < limit) {
          // Exclude the ones we already have
          const relatedIds = recommendedProducts.map(p => p._id);
          filter._id = { $nin: [...relatedIds, productId] };
        } else {
          // We have enough related products
          return res.status(200).json({
            success: true,
            count: recommendedProducts.length,
            data: recommendedProducts.slice(0, limit)
          });
        }
      } else {
        // No related products found, exclude current product from recommendations
        filter._id = { $ne: productId };
      }
    }

    // Get additional recommended products if needed
    const additionalProducts = await ProductStore.find(filter)
      .sort({ averageRating: -1 })
      .limit(Number(limit) - recommendedProducts.length)
      .select('name storeId price salePrice unit images')
      .lean();

    // Combine related and additional recommended products
    recommendedProducts = [...recommendedProducts, ...additionalProducts];

    res.status(200).json({
      success: true,
      count: recommendedProducts.length,
      data: recommendedProducts
    });
  } catch (error) {
    next(error);
  }
};



// Search products
export const searchProductsByStore = async (req, res, next) => {
  try {
    const { q, storeId, categories, limit = 20, page = 1, minPrice, maxPrice, sort = 'relevance' } = req.query;

    if (!q) {
      return next(createError(400, 'Search query is required'));
    }

    // Build the search filter
    const filter = {};
    
    // Create a more sophisticated search mechanism that works well even with single letters
    if (q.length < 3) {
      // For short queries, use regex at the beginning of words for better suggestions
      filter.$or = [
        { name: { $regex: `^${q}`, $options: "i" } },         // Words starting with the query
        { name: { $regex: `\\s${q}`, $options: "i" } },       // Words after space starting with query
        { brand: { $regex: `^${q}`, $options: "i" } },        // Brand starting with query
        { tags: { $regex: `^${q}`, $options: "i" } }          // Tags starting with query
      ];
    } else {
      // For longer queries, use text search for better relevance
      filter.$text = { $search: q };
    }

    if (!storeId){
      return res.status(400).json({
        success: false,
        message: 'No storeId provided'
      });
    }

    // Add storeId filter if provided
    if (storeId) {
      if (!isValidObjectId(storeId)) {
        return next(createError(400, 'Invalid store ID format'));
      }
      filter.storeId = storeId;
    }

    // Add category filter if provided
    if (categories) {
      const categoryIds = categories.split(',').filter(id => isValidObjectId(id));
      if (categoryIds.length > 0) {
        filter.categoryIds = { $in: categoryIds };
      }
    }

    // Add price range filter if provided
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    // Only include in-stock items by default
    filter['inventory.status'] = { $ne: 'out_of_stock' };

    const skip = (Number(page) - 1) * Number(limit);
    const pageSize = Number(limit);

    // Determine sort method based on user preference
    let sortOptions = {};
    
    if (filter.$text) {
      // If using text search, sort by relevance score
      sortOptions = { score: { $meta: 'textScore' } };
    } else {
      // Otherwise use specified sort method
      switch (sort) {
        case 'price_asc':
          sortOptions = { price: 1 };
          break;
        case 'price_desc':
          sortOptions = { price: -1 };
          break;
        case 'name_asc':
          sortOptions = { name: 1 };
          break;
        case 'popularity':
          sortOptions = { isPopular: -1, averageRating: -1 };
          break;
        case 'newest':
          sortOptions = { createdAt: -1 };
          break;
        default:
          // Default to name for non-text searches
          sortOptions = { name: 1 };
      }
    }

    // Setup projection to return only required fields
    const projection = {
      name: 1,
      _id: 1,
      price: 1,
      salePrice: 1,
      storeId: 1,
      unit: 1,
      images: 1
    };

    // Add score to projection for text searches
    if (filter.$text) {
      projection.score = { $meta: 'textScore' };
    }

    // Execute search with optimized query
    let products = await ProductStore.find(filter, projection)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .lean();

    // Get total count for pagination
    const totalProducts = await ProductStore.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / pageSize);

    // If we have few results with exact search, try a fuzzy search to add suggestions
    if (products.length < 5 && q.length >= 3) {
      // Remove text search and use regex for fuzzy matching
      const fuzzyFilter = { ...filter };
      delete fuzzyFilter.$text;
      
      // Create regex pattern that matches characters in sequence but allows characters in between
      // This is a simple implementation of fuzzy search
      const fuzzyPattern = q.split('').join('.*');
      fuzzyFilter.name = { $regex: fuzzyPattern, $options: "i" };
      
      // Get additional suggestions
      const additionalSuggestions = await ProductStore.find(fuzzyFilter, projection)
        .sort({ name: 1 })
        .limit(10)
        .lean();
      
      // Add only new suggestions that weren't in original results
      const existingIds = new Set(products.map(p => p._id.toString()));
      const newSuggestions = additionalSuggestions.filter(p => !existingIds.has(p._id.toString()));
      
      // Add a suggestion flag to these results
      newSuggestions.forEach(p => p.isSuggestion = true);
      
      // Append new suggestions to results
      products = [...products, ...newSuggestions].slice(0, pageSize);
    }

    // Return structured response
    res.status(200).json({
      success: true,
      count: products.length,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalProducts,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1,
      },
      data: products,
    });
  } catch (error) {
    console.error('Search error:', error);
    next(error);
  }
};

export const searchProductsAcrossStores = async (req, res, next) => {
  try {
    const { 
      q, 
      storeIds, 
      categories, 
      limit = 20, 
      page = 1, 
      minPrice, 
      maxPrice, 
      sort = 'relevance',
      includeOutOfStock = false
    } = req.query;

    if (!q) {
      return next(createError(400, 'Search query is required'));
    }

    if (!storeIds){
      return res.status(400).json({
        success: false,
        message: 'No storeIds provided'
      });
    }

    // Build the search filter
    const filter = {};
    
    // Create a more sophisticated search mechanism that works well even with single letters
    if (q.length < 5) {
      // For short queries, use regex at the beginning of words for better suggestions
      filter.$or = [
        { name: { $regex: `^${q}`, $options: "i" } },         // Words starting with the query
        { name: { $regex: `\\s${q}`, $options: "i" } },       // Words after space starting with query
        { brand: { $regex: `^${q}`, $options: "i" } },        // Brand starting with query
        { tags: { $regex: `^${q}`, $options: "i" } }          // Tags starting with query
      ];
    } else {
      // For longer queries, use text search for better relevance
      filter.$text = { $search: q };
    }

    // Add storeIds filter if provided
    if (storeIds) {
      // Process comma-separated store IDs
      const storeIdsArray = storeIds
        .split(',')
        .map(id => id.trim())
        .filter(id => isValidObjectId(id));
        
      if (storeIdsArray.length === 0) {
        return next(createError(400, 'No valid store IDs provided'));
      }
      
      filter.storeId = { $in: storeIdsArray };
    }

    // Add category filter if provided
    if (categories) {
      const categoryIds = categories
        .split(',')
        .map(id => id.trim())
        .filter(id => isValidObjectId(id));
        
      if (categoryIds.length > 0) {
        filter.categoryIds = { $in: categoryIds };
      }
    }

    // Add price range filter if provided
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    // Only include in-stock items unless includeOutOfStock is true
    if (includeOutOfStock !== 'true') {
      filter['inventory.status'] = { $ne: 'out_of_stock' };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const pageSize = Number(limit);

    // Determine sort method based on user preference
    let sortOptions = {};
    
    if (filter.$text) {
      // If using text search, sort by relevance score
      sortOptions = { score: { $meta: 'textScore' } };
    } else {
      // Otherwise use specified sort method
      switch (sort) {
        case 'price_asc':
          sortOptions = { price: 1 };
          break;
        case 'price_desc':
          sortOptions = { price: -1 };
          break;
        case 'name_asc':
          sortOptions = { name: 1 };
          break;
        case 'popularity':
          sortOptions = { isPopular: -1, averageRating: -1 };
          break;
        case 'newest':
          sortOptions = { createdAt: -1 };
          break;
        default:
          // Default to name for non-text searches
          sortOptions = { name: 1 };
      }
    }

    // Setup projection to return only required fields
    const projection = {
      name: 1,
      _id: 1,
      price: 1,
      salePrice: 1,
      storeId: 1,
      unit: 1,
      images: 1
    };

    // Add score to projection for text searches
    if (filter.$text) {
      projection.score = { $meta: 'textScore' };
    }

    // Execute search with optimized query
    let products = await ProductStore.find(filter, projection)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .populate('storeId', 'name logo')  // Include store information
      .lean();

    // Get total count for pagination
    const totalProducts = await ProductStore.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / pageSize);

    // If we have few results with exact search, try a fuzzy search to add suggestions
    if (products.length < 10 && q.length >= 3) {
      // Remove text search and use regex for fuzzy matching
      const fuzzyFilter = { ...filter };
      delete fuzzyFilter.$text;
      
      // Create regex pattern that matches characters in sequence but allows characters in between
      const fuzzyPattern = q.split('').join('.*');
      fuzzyFilter.name = { $regex: fuzzyPattern, $options: "i" };
      
      // Get additional suggestions
      const additionalSuggestions = await ProductStore.find(fuzzyFilter, projection)
        .sort({ name: 1 })
        .limit(15)  // Higher limit for cross-store search
        .populate('storeId', 'name logo')
        .lean();
      
      // Add only new suggestions that weren't in original results
      const existingIds = new Set(products.map(p => p._id.toString()));
      const newSuggestions = additionalSuggestions.filter(p => !existingIds.has(p._id.toString()));
      
      // Add a suggestion flag to these results
      newSuggestions.forEach(p => p.isSuggestion = true);
      
      // Append new suggestions to results
      products = [...products, ...newSuggestions].slice(0, pageSize);
    }

    // Group products by store for a better organized response
    const productsByStore = {};
    products.forEach(product => {
      const storeId = product.storeId._id.toString();
      if (!productsByStore[storeId]) {
        productsByStore[storeId] = {
          storeInfo: {
            _id: product.storeId._id,
            name: product.storeId.name,
            logo: product.storeId.logo
          },
          products: []
        };
      }
      
      // Remove the full store object to avoid duplication
      const { storeId: _, ...productWithoutStoreObj } = product;
      productsByStore[storeId].products.push(productWithoutStoreObj);
    });

    // Return structured response
    res.status(200).json({
      success: true,
      count: products.length,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalProducts,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1,
      },
      byStore: Object.values(productsByStore),
      data: products, // Keep the flat list for backward compatibility
    });
  } catch (error) {
    console.error('Cross-store search error:', error);
    next(error);
  }
};



// Get products by category
export const getProductsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 20, sort = 'name', order = 'asc' } = req.query;

    if (!isValidObjectId(categoryId)) {
      return next(createError(400, 'Invalid category ID format'));
    }

    // Find the category and all its child categories
    const categoryIds = [categoryId];
    const childCategories = await Category.find({ parentCategory: categoryId });
    childCategories.forEach(cat => categoryIds.push(cat._id));

    // Build filter
    const filter = { categoryIds: { $in: categoryIds } };

    // Sorting options
    const sortOptions = {};
    if (sort === 'price') {
      sortOptions.price = order === 'desc' ? -1 : 1;
    } else if (sort === 'popularity') {
      sortOptions.reviewCount = order === 'desc' ? -1 : 1;
    } else if (sort === 'rating') {
      sortOptions.averageRating = order === 'desc' ? -1 : 1;
    } else {
      // Default sort by name
      sortOptions.name = order === 'desc' ? -1 : 1;
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const pageSize = Number(limit);

    // Get products
    const products = await ProductStore.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .populate('categoryIds', 'name slug')
      .lean();

    // Get total count for pagination
    const totalProducts = await ProductStore.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / pageSize);

    res.status(200).json({
      success: true,
      count: products.length,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalProducts,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1
      },
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// Update product inventory
export const updateProductInventory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, status } = req.body;

    if (!isValidObjectId(id)) {
      return next(createError(400, 'Invalid product ID format'));
    }

    if (quantity === undefined && status === undefined) {
      return next(createError(400, 'Please provide quantity or status to update'));
    }

    // Build update object
    const updateData = { updatedAt: Date.now() };
    
    if (quantity !== undefined) {
      updateData['inventory.quantity'] = Number(quantity);
      
      // Automatically update status based on quantity
      if (Number(quantity) <= 0) {
        updateData['inventory.status'] = 'out_of_stock';
      } else if (Number(quantity) < 5) {
        updateData['inventory.status'] = 'low_stock';
      } else {
        updateData['inventory.status'] = 'in_stock';
      }
    }
    
    // Override automatic status if explicitly provided
    if (status !== undefined) {
      if (!['in_stock', 'low_stock', 'out_of_stock'].includes(status)) {
        return next(createError(400, 'Invalid status value'));
      }
      updateData['inventory.status'] = status;
    }

    // Update the product
    const product = await ProductStore.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!product) {
      return next(createError(404, 'Product not found'));
    }

    res.status(200).json({
      success: true,
      data: product.inventory
    });
  } catch (error) {
    next(error);
  }
};

// Bulk update products
export const bulkUpdateProducts = async (req, res, next) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return next(createError(400, 'Please provide an array of products to update'));
    }

    const results = {
      success: [],
      errors: []
    };

    // Process each product update
    for (const product of products) {
      try {
        if (!product._id || !isValidObjectId(product._id)) {
          results.errors.push({
            _id: product._id || 'unknown',
            error: 'Invalid product ID format'
          });
          continue;
        }

        // Remove _id from the update data
        const { _id, ...updateData } = product;
        
        // Set updatedAt timestamp
        updateData.updatedAt = Date.now();

        // Update the product
        const updatedProduct = await ProductStore.findByIdAndUpdate(
          _id,
          updateData,
          { new: true, runValidators: true }
        );

        if (!updatedProduct) {
          results.errors.push({
            _id,
            error: 'Product not found'
          });
          continue;
        }

        results.success.push({
          _id,
          product: updatedProduct
        });
      } catch (error) {
        results.errors.push({
          _id: product._id || 'unknown',
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalProcessed: products.length,
        successCount: results.success.length,
        errorCount: results.errors.length,
        results
      }
    });
  } catch (error) {
    next(error);
  }
};