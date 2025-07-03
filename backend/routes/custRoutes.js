import express from "express";
import { body } from "express-validator";

import {
    registerCustomer,
    loginCustomer,
    refreshToken,
    logoutCustomer,
    forgotPassword,
    resetPassword,
    googleAuth,
    verifyEmail, 
    getCurrentCustomer,
    changePassword,
    resendVerificationEmail
} from "../controllers/custAuthController.js";

import {
    getCustomerProfile,
    updateCustomerProfile,
    getCustomerAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    getPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    getNotificationPreferences,
    updateNotificationPreferences,
    deleteAccount
} from "../controllers/custUserContoller.js";

import {
    getAllStores,
    getNearbyStores,
    getStoreDetails,
    getFeaturedProducts
} from "../controllers/custStoreContoller.js";

import {
    getCart,
    getCarts,
} from "../controllers/custCartContoller.js";

import {
    getAllProducts,
    getFeaturedProductsStore,
    getPopularProductsStore,
    getRecommendedProductsStore,
    searchProductsByStore,
    searchProductsAcrossStores
} from "../controllers/custProductController.js"

import {
    getCategoriesWithProductCount,
} from "../controllers/custCategoryController.js"

import { decodeAccessToken } from "../middlewares/authMiddleware.js";
import { get } from "http";

const router = express.Router();

// ----------------- Customer Auth Routes ----------------- //

router.post("/custAuth/customer-register", registerCustomer);
router.get("/custAuth/customer-verify-email/:token", verifyEmail);
router.post("/custAuth/customer-resend-verification", resendVerificationEmail);

router.post("/custAuth/customer-login", loginCustomer);
router.post("/custAuth/secure/customer-refresh-token", refreshToken);
router.post("/custAuth/secure/customer-logout", logoutCustomer);

router.post("/custAuth/google", googleAuth);

router.post("/custAuth/customer-forgot-password", forgotPassword);
router.post("/custAuth/customer-reset-password", resetPassword);

router.get("/custAuth/customer", decodeAccessToken, getCurrentCustomer);
router.post("/custAuth/customer-change-password", decodeAccessToken, changePassword);


// ----------------- Customer User Routes ----------------- //

router.get("/cust/profile", decodeAccessToken, getCustomerProfile);
router.put("/cust/profile", decodeAccessToken, updateCustomerProfile);

router.get("/cust/addresses", decodeAccessToken, getCustomerAddresses);
router.post("/cust/address", decodeAccessToken, addAddress);
router.put("/cust/address/:addressId", decodeAccessToken, updateAddress);
router.delete("/cust/address/:addressId", decodeAccessToken, deleteAddress);

router.get("/cust/payment-methods", decodeAccessToken, getPaymentMethods);
router.post("/cust/payment-method", decodeAccessToken, addPaymentMethod);
router.put("/cust/payment-method/:paymentMethodId", decodeAccessToken, updatePaymentMethod);
router.delete("/cust/payment-method/:paymentMethodId", decodeAccessToken, deletePaymentMethod);


// ----------------- Customer Store Routes ----------------- //

router.get("/cust/stores", getAllStores);
router.get("/cust/stores/nearby", getNearbyStores);
router.get("/cust/store/:storeId", getStoreDetails);
router.get("/cust/store/:storeId/featured-products", getFeaturedProducts);


// ----------------- Customer Category Routes ----------------- //

router.get("/cust/categories/:storeId", getCategoriesWithProductCount);


// ----------------- Customer Product Routes ----------------- //

router.get("/cust/products", getAllProducts);
router.get("/cust/featured-products-store", getFeaturedProductsStore);
router.get("/cust/popular-products", getPopularProductsStore);
router.get("/cust/recommended-products", getRecommendedProductsStore);
router.get("/cust/search-products-store", searchProductsByStore);
router.get("/cust/search-across-products-store", searchProductsAcrossStores);


// ----------------- Customer Cart Routes ----------------- //

router.get("/cust/cart/:storeId", decodeAccessToken, getCart);
router.get("/cust/carts", decodeAccessToken, getCarts);

export default router;