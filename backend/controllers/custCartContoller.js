import Cart from "../models/Cart.js";
import Store from '../models/Store.js';
import ProductStore from '../models/ProductStore.js';
// const Coupon = require('../models/Coupon');
import mongoose from "mongoose";
// const { calculateTax } = require('../utils/taxCalculator');
import logger from '../utils/logger.js';

export async function getCart(req, res, next) {
    try {
        const userId = req.user.id;
        const storeId = req.params.storeId;
        const { sessionId } = req.query;

        // Ensure storeId is provided to uniquely identify the cart
        if (!storeId) {
            return res.status(400).json({ message: 'storeId is required to fetch the correct cart.' });
        }
    
        // Find the cart by userId/sessionId and storeId
        const query = userId ? { userId, storeId } : { sessionId, storeId };
        
        const cart = await Cart.findOne(query)
          .populate({
            path: 'items.productId',
            select: 'name images price salePrice inventory unit attributes'
          })
          .populate('storeId', 'name logo deliveryFee');
        
        if (!cart) {
            logger.info(`No active cart found for userId: ${userId} and storeId: ${storeId}`);
            return res.status(200).json({
                cart: null,
                message: 'No active cart found'
            });
        }
    
        // Check product availability and update pricing
        const updatedItems = [];
        let subtotal = 0;
        let itemsChanged = false;
        
        for (const item of cart.items) {
          if (!item.productId) {
            // Product was deleted
            itemsChanged = true;
            continue;
          }
          
          // Check if product is still available
          if (item.productId.inventory.status === 'out_of_stock') {
            item.availability = 'out_of_stock';
            itemsChanged = true;
          } else if (item.productId.inventory.quantity < item.quantity) {
            item.availability = 'limited';
            item.quantity = Math.min(item.quantity, item.productId.inventory.quantity);
            itemsChanged = true;
          } else {
            item.availability = 'in_stock';
          }
          
          // Update price if it changed
          const currentPrice = item.productId.salePrice || item.productId.price;
          if (currentPrice !== item.price) {
            item.price = currentPrice;
            itemsChanged = true;
          }
          
          subtotal += item.price * item.quantity;
          updatedItems.push(item);
        }
        
        // Update cart if items or prices changed
        if (itemsChanged) {
          cart.items = updatedItems;
          cart.subtotal = subtotal;
          cart.total = subtotal + cart.deliveryFee + cart.tax;
          
          // Apply discounts
          cart.discounts.forEach(discount => {
            if (discount.type === 'percentage') {
              cart.total -= (cart.subtotal * (discount.amount / 100));
            } else {
              cart.total -= discount.amount;
            }
          });
          
          await cart.save();
        }

        logger.info(`Fetched cart for userId: ${userId} and storeId: ${storeId}`);
    
        return res.status(200).json({ cart });
    } catch (error) {
        console.error('Get cart error:', error);
        return res.status(500).json({ message: 'Failed to fetch cart', error: error.message });
    }
}

export async function getCarts(req, res) {
    try {
      // Use authenticated user's id if available; fallback to sessionId for guest users
      const userId = req.user.id;
    //   const { sessionId } = req.query;
      const query = userId ? { userId } : { sessionId };

      logger.info(`Fetching carts for userId: ${userId || 'guest'}`);
  
      // Find all carts matching the query
      const carts = await Cart.find({ userId: userId })
        .populate({
          path: 'items.productId',
          select: 'name images price salePrice inventory unit attributes'
        })
        .populate('storeId', 'name logo deliveryFee');
  
      // If no carts are found, return a response indicating that
      if (!carts || carts.length === 0) {
        return res.status(200).json({
          carts: [],
          totalCarts: 0,
          message: 'No active carts found'
        });
      }
  
      // Optionally, you could run logic to update item availability or pricing here
      // if you want the carts to reflect real-time data as in your getCart function.
      // For this endpoint, we assume the frontend just needs to see the current state.

      logger.info(`Fetched ${carts.length} carts for userId: ${userId || 'guest'}`);
  
      return res.status(200).json({
        totalCarts: carts.length,
        carts
      });
    } catch (error) {
        console.error('Get carts error:', error);
        return res.status(500).json({
            message: 'Failed to fetch carts',
            error: error.message
        });
    }
}