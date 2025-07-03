import Product from '../models/Product.js';
import Category from '../models/Category.js';
import logger from '../utils/logger.js';
import { uploadToCloudinary, deleteOldImageFromCloudinary } from '../utils/cloudinaryUpload.js';
import { generateProductsPdf } from '../utils/productPdfGenerator.js';

/* ---------- CATEGORY ---------- */

// List all categories (optionally filter by isActive)
export const listCategories = async (req, res) => {
  try {
    const { active } = req.query;
    const filter = {};

    if (active === 'true' || active === 'false') {
      filter.isActive = active === 'true';
    }

    const categories = await Category.find(filter);
    return res.status(200).json({
      success: true,
      data: categories });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message });
  }
};

// Create a new category (Admin only)
export const createCategory = async (req, res) => {
  try {
    const { name, slug, description } = req.body;
    const { storeId } = req.user;
    const profilePhotoBuffer = req.files.imageUrl[0].buffer;
    
    // Check if the storeId has the required authority
    if (storeId !== 'STORE1234') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Store does not have the required authority to create a Category',
      });
    }

    // Basic validation
    if (!name || !slug || !description || profilePhotoBuffer) {
      return res.status(400).json({
        success: false,
        message: 'Name, slug, description and imageUrl are required.'
      });
    }

    // Check if a category with the same name already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: `Category named '${name}' already exists.`
      });
    }

    // Upload profile photo (image) to Cloudinary; defaults to image upload
    const profilePhotoResult = await uploadToCloudinary(profilePhotoBuffer, { folder: 'veg_category_pics' });

    const newCategory = await Category.create({
      name,
      slug,
      description,
      imageUrl: profilePhotoResult.secure_url
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: newCategory });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message });
  }
};

// Update a category (Admin only)
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.user;
    const { name, slug, description } = req.body;
    
    // Check if the storeId has the required authority
    if (storeId !== 'STORE1234') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Store does not have the required authority to update a Category',
      });
    }

    // 1. Find the existing category
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // 2. Prepare an update object
    const updateData = { name, slug, description };

    // 3. Check if a new image file was uploaded
    //    (Assuming the Multer field name is "imageUrl" => req.files?.imageUrl?.[0] is the file)
    if (req.files?.imageUrl?.length) {
      // (a) Delete the old image from Cloudinary (if there is an old URL)
      if (existingCategory.imageUrl) {
        await deleteOldImageFromCloudinary(existingCategory.imageUrl);
      }

      // (b) Upload the new image to Cloudinary
      const newProfilePhotoBuffer = req.files.imageUrl[0].buffer;
      const uploadResult = await uploadToCloudinary(newProfilePhotoBuffer, {
        folder: 'veg_category_pics', // or any folder you'd like
      });

      // (c) Store the new URL in the updateData
      updateData.imageUrl = uploadResult.secure_url;
    }

    // 4. Update the category in MongoDB
    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedCategory) {
      return res.status(404).json({ success: false, message: 'Category not found after update.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      data: updatedCategory,
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Soft delete or remove a category (Admin only)
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.user;
    
    // Check if the storeId has the required authority
    if (storeId !== 'STORE1234') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Store does not have the required authority to update a Category',
      });
    }

    // If you want to physically remove it:
    // const removed = await Category.findByIdAndRemove(id);
    // Or do a soft delete by setting isActive=false
    const removed = await Category.findByIdAndUpdate(id, { isActive: false }, { new: true });

    if (!removed) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully.',
      data: removed });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message });
  }
};


/* ---------- PRODUCTS ---------- */

// Create a Product (Admin only)
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      priceBeforeDiscount,
      priceAfterDiscount,
      availability = false,
      imageUrl = '',
      description = ''
    } = req.body;
    // const { storeId } = req.user;
    
    // Check if the storeId has the required authority
    // if (storeId !== 'STORE1234') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Unauthorized. Store does not have the required authority to create a Product',
    //   });
    // }

    // Basic validation
    if (!name || !category || price === undefined || priceBeforeDiscount === undefined || priceAfterDiscount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, price, priceBeforeDiscount, and priceAfterDiscount are required.'
      });
    }

    // Check if a product with the same name exists in the same category
    const existingProduct = await Product.findOne({ name, category });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: `Product named '${name}' already exists in the selected category.`
      });
    }

    // Create a new product
    const newProduct = await Product.create({
      name,
      category,
      price,
      priceBeforeDiscount,
      priceAfterDiscount,
      availability,
      imageUrl,
      description
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: newProduct
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
      error: err.message
    });
  }
};

// Create bulk of Products (Admin only)
export const bulkcreateProducts = async (req, res) => {
  try {
    const products = req.body; // Expecting an array of products
    const { storeId } = req.user;
    
    // Check if the storeId has the required authority
    if (storeId !== 'STORE1234') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Store does not have the required authority to create a Product',
      });
    }

    if (!Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        message: "Request body should be an array of products.",
      });
    }

    const newProducts = await Product.insertMany(products); // Bulk insert

    return res.status(201).json({
      success: true,
      message: "Products created successfully.",
      data: newProducts
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message
    });
  }
};

//  Soft-delete a product by ID (Admin only)
//  Hard-delete a product by ID (Admin only)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // const { storeId } = req.user;

    // // Only your store admin can delete
    // if (storeId !== 'STORE1234') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Unauthorized. Store does not have permission to delete this product.',
    //   });
    // }

    // Attempt to remove the product
    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Product '${deleted.name}' has been permanently removed.`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//  List products with pagination and optional filters.
/** Query Params:
 *  - page: (number) current page, defaults to 1
 *  - limit: (number) items per page, defaults to 10
 *  - category: (ObjectId or string) filter by category reference
 *  - availability: (boolean) filter by true/false
 *  - search: (string) partial match on product name
 */
export const listProducts = async (req, res) => {
    try {
      // 1) Parse pagination parameters (fallback to defaults)
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
  
      // 2) Build the filter object
      const { category, availability, search } = req.query;
      const filter = { isDeleted: false };
  
      if (category) {
        filter.category = category; // e.g., an ObjectId string
      }
  
      if (availability === 'true' || availability === 'false') {
        filter.availability = availability === 'true';
      }
  
      if (search) {
        // case-insensitive partial match on name
        filter.name = { $regex: search, $options: 'i' };
      }
  
      // 3) Count total documents for pagination
      const totalCount = await Product.countDocuments(filter);
  
      // 4) Fetch paginated results
      const products = await Product.find(filter)
        .sort({ createdAt: -1 })       // newest first, adjust as needed
        .skip((page - 1) * limit)      // skip items from previous pages
        .limit(limit)                  // limit to 'limit' items
        .populate('category', 'name slug')
  
        // If you want category details, use populate:
        // .populate('category', 'name slug')
  
      // 5) Calculate total pages
      const totalPages = Math.ceil(totalCount / limit);
  
      // 6) Construct response
      return res.status(200).json({
        success: true,
        data: products,
        pagination: {
          totalItems: totalCount,
          currentPage: page,
          limit,
          totalPages
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

//  Get a single product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.user;

    // Check if the storeId has the required authority
    if (storeId !== 'STORE1234') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Store does not have the required authority to get details of the product.',
      });
    }
    // Exclude any deleted items
    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or archived.'
      });
    }

    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const downloadProductsPdf = async (req, res) => {
  try {
    // Set headers so the browser knows it’s a PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="product-catalog.pdf"'
    );

    // Stream the PDF
    await generateProductsPdf(res);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating PDF.',
      error: error.message
    });
  }
};

//  Update an existing product (Admin only)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // const { storeId } = req.user;

    // Check if the storeId has the required authority
    // if (storeId !== 'STORE1234') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Unauthorized. Store does not have the required authority to update the product.',
    //   });
    // }

    // We only allow updates on certain fields
    // (In practice, you can control which fields are updatable with a whitelist.)
    const { 
      priceBeforeDiscount,
      priceAfterDiscount,
      availability
      // You may also allow the shop owner to change "price" if the PDF modifies it monthly
      // price (for vegetables/groceries)
    } = req.body;

    if (priceAfterDiscount > priceBeforeDiscount) {
      return res.status(400).json({
      success: false,
      message: 'Discounted price cannot exceed the original price.'
      });
    }

    // Build an update object only with fields provided
    const updateFields = {};
    if (priceBeforeDiscount !== undefined) updateFields.priceBeforeDiscount = priceBeforeDiscount;
    if (priceAfterDiscount !== undefined) updateFields.priceAfterDiscount = priceAfterDiscount;
    if (availability !== undefined) updateFields.availability = availability;

    // Optional: If the monthly PDF also changes the base price (like new cost for 500g)
    if (req.body.price !== undefined) {
      updateFields.price = req.body.price;
    }

    const updated = await Product.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or was archived.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Product (${updated.name}) updated successfully.`,
      data: updated
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//  Toggle availability (Admin only)
export const toggleProductAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.user;
    
    // Check if the storeId has the required authority
    if (storeId !== 'STORE1234') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Store does not have the required authority to toggle the availabilty of a Product.',
      });
    }

    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or archived.'
      });
    }

    // Flip the availability
    product.availability = !product.availability;
    await product.save();

    return res.status(200).json({
      success: true,
      message: `Availability of the ${product.name} changed to ${product.availability} successfully.`,
      data: product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getSearchSuggestions = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Query parameter is required" });
    }
    // Create a case-insensitive regular expression from the query
    const regex = new RegExp(query, "i");
    // Find products where the name matches the regex and the product is not deleted
    const suggestions = await Product.find({ name: regex, isDeleted: false })
      .limit(10)
      .select("name");

    // Return only the product names as suggestions
    return res.status(200).json({ data: suggestions.map(product => product.name) });
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    return res.status(500).json({ message: "Error fetching search suggestions" });
  }
};