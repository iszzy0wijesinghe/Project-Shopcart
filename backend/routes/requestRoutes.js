import express from 'express';
import { createRequestOrder,
        getAllRequestOrders,
        deleteRequestOrder,
        updateRequestOrder,
        getSingleRequestOrder,
        searchRequestOrders,
        downloadRequestOrdersPDF,
        getRequestOrderCountByFoodType } from '../controllers/createRequestOrder.js';

const router = express.Router();

router.get('/request-orders/search', searchRequestOrders);     // specific
router.get('/request-orders/pdf', downloadRequestOrdersPDF);   // specific

router.get('/request-orders', getAllRequestOrders);            // general
router.post('/request-orders', createRequestOrder);            // general

router.get('/request-orders/food-type-count', getRequestOrderCountByFoodType);

router.get('/request-orders/:id', getSingleRequestOrder);      // dynamic
router.put('/request-orders/:id', updateRequestOrder);         // dynamic
router.delete('/request-orders/:id', deleteRequestOrder);      // dynamic

export default router;
