import express from 'express';
const router = express.Router();
import {
  createShopOwnerRequest,
  getAllShopOwnerRequests,
  updateShopOwnerRequest,
  deleteShopOwnerRequest,
  searchShopOwnerRequests,
  downloadAllShopOwnerRequestsPDF,
  getShopOwnerRequestById,
  acceptSupplierRequest,
  ignoreSupplierRequest

} from '../controllers/shopOwnerRequestController.js';

// POST: Submit a supplier request
router.post('/shop-owner-requests', createShopOwnerRequest);

// GET: Get all supplier requests
router.get('/shop-owner-requests', getAllShopOwnerRequests);

router.put('/shop-owner-requests/:id', updateShopOwnerRequest);

// DELETE: Delete a supplier request by ID
router.delete('/shop-owner-requests/:id', deleteShopOwnerRequest);

// ✅ Search route
router.get('/shop-owner-requests/search', searchShopOwnerRequests);

router.get('/shop-owner-requests/pdf', downloadAllShopOwnerRequestsPDF);

router.get('/shop-owner-requests/:id', getShopOwnerRequestById);

router.put('/shop-owner-requests/accept/:id', acceptSupplierRequest);
router.delete('/shop-owner-requests/ignore/:id', ignoreSupplierRequest);

export default router;
