import express from 'express';
import {
  createSupplier,
  getAllSuppliers,
  updateSupplier,
  deleteSupplier,
  searchSuppliers,
  getSupplierById,
  downloadSupplierPDF,
  getSupplierCountByFoodType,
  downloadAdminDashboardPDF,
  downloadSupplierExcel
} from '../controllers/supplierContoller.js'

const router = express.Router();

// POST: Create supplier
router.post('/suppliers', createSupplier);
 
// GET: Read all suppliers
router.get('/suppliers', getAllSuppliers);

// PUT: Update supplier
router.put('/suppliers/:id', updateSupplier);

//DELETE: Delete supplier
router.delete('/suppliers/:id', deleteSupplier);

// New route: PDF download
router.get('/suppliers/excel', downloadSupplierExcel);

router.get('/suppliers/search', searchSuppliers);

router.get('/suppliers/pdf', downloadSupplierPDF);

router.get('/suppliers/food-type-count', getSupplierCountByFoodType);

router.get('/admin-dashboard/pdf', downloadAdminDashboardPDF);

router.get('/suppliers/:id', getSupplierById);

export default router;
