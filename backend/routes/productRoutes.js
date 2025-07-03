// routes/catalogRoutes.js
import { Router } from 'express';
import multer from 'multer';
import {
  // Category
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,

  // Product
  createProduct,
  deleteProduct,
  bulkcreateProducts,
  listProducts,
  downloadProductsPdf,
  getProductById,
  updateProduct,
  toggleProductAvailability,
  getSearchSuggestions
} from '../controllers/productController.js';

import { validateAccessToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Configure Multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });


 /**  CATEGORY ROUTES */

// GET - list categories
router.get('/categories', listCategories);

// POST - create a new category (admin only)
router.post('/categories', upload.single('imageUrl'), validateAccessToken, createCategory);

// PUT - update a category (admin only)
router.put('/categories/:id', upload.fields([{ name: 'imageUrl', maxCount: 1 }]), validateAccessToken, updateCategory);

// DELETE - remove or soft-delete a category (admin only)
router.delete('/categories/:id', validateAccessToken, deleteCategory);


/**  PRODUCT ROUTES  */

// POST - create a new product (admin only)
router.post('/products/create_product', createProduct);

router.delete('/product/:id', validateAccessToken, deleteProduct);

// POST - create a new bulk products (admin only)
router.post('/products/bulk_create_product', validateAccessToken, bulkcreateProducts);

// GET - list products with pagination/filters
router.get('/products', listProducts);

// GET - list products with pagination/filters
router.get('/products/pdf', downloadProductsPdf);

// GET - retrieve a single product by ID
router.get('/products/:id', validateAccessToken, getProductById);

// PATCH - update product fields (admin only)
router.patch('/products/:id', updateProduct);

// PATCH - specialized route to toggle availability (admin only)
router.patch('/products/:id/toggle-availability', validateAccessToken, toggleProductAvailability);

router.get("/products/suggestions", getSearchSuggestions);


export default router;
