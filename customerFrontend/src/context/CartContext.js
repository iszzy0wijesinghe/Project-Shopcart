// import { createContext, useState, useEffect, useContext } from 'react';

// const CartContext = createContext();

// export const useCart = () => useContext(CartContext);

// export const CartProvider = ({ children }) => {
//   const [cartItems, setCartItems] = useState([]);
//   const [cartCount, setCartCount] = useState(0);
//   const [cartTotal, setCartTotal] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [storeId, setStoreId] = useState(null);

//   // Load cart from local storage on initial render
//   useEffect(() => {
//     const storedCart = localStorage.getItem('cart');
    
//     if (storedCart) {
//       const parsedCart = JSON.parse(storedCart);
//       setCartItems(parsedCart.items || []);
//       setStoreId(parsedCart.storeId || null);
//     }
    
//     setLoading(false);
//   }, []);

//   // Update cart totals whenever cart items change
//   useEffect(() => {
//     const count = cartItems.reduce((total, item) => total + item.quantity, 0);
//     const price = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    
//     setCartCount(count);
//     setCartTotal(price);
    
//     // Save to local storage
//     localStorage.setItem('cart', JSON.stringify({
//       items: cartItems,
//       storeId
//     }));
//   }, [cartItems, storeId]);

//   // Add item to cart
//   const addToCart = (product, quantity = 1) => {
//     // If adding from a different store, ask user if they want to clear cart
//     if (storeId && product.storeId !== storeId && cartItems.length > 0) {
//       if (!window.confirm("Adding items from a different store will clear your current cart. Continue?")) {
//         return false;
//       }
      
//       // Clear cart if confirmed
//       setCartItems([]);
//     }
    
//     // Set the store ID if not set already or if changing stores
//     if (!storeId || product.storeId !== storeId) {
//       setStoreId(product.storeId);
//     }
    
//     // Check if item already exists in cart
//     const existingItemIndex = cartItems.findIndex(item => item.id === product.id);
    
//     if (existingItemIndex >= 0) {
//       // If item exists, update quantity
//       const updatedCartItems = [...cartItems];
//       updatedCartItems[existingItemIndex].quantity += quantity;
//       setCartItems(updatedCartItems);
//     } else {
//       // Add new item
//       setCartItems([...cartItems, {
//         ...product,
//         quantity
//       }]);
//     }
    
//     return true;
//   };

//   // Remove item from cart
//   const removeFromCart = (productId) => {
//     setCartItems(cartItems.filter(item => item.id !== productId));
    
//     // If cart becomes empty, reset store ID
//     if (cartItems.length === 1) {
//       setStoreId(null);
//     }
//   };

//   // Update item quantity
//   const updateQuantity = (productId, quantity) => {
//     if (quantity <= 0) {
//       removeFromCart(productId);
//       return;
//     }
    
//     const updatedCartItems = cartItems.map(item => 
//       item.id === productId ? { ...item, quantity } : item
//     );
    
//     setCartItems(updatedCartItems);
//   };

//   // Clear cart
//   const clearCart = () => {
//     setCartItems([]);
//     setStoreId(null);
//   };

//   const value = {
//     cartItems,
//     cartCount,
//     cartTotal,
//     storeId,
//     loading,
//     addToCart,
//     removeFromCart,
//     updateQuantity,
//     clearCart
//   };

//   return (
//     <CartContext.Provider value={value}>
//       {!loading && children}
//     </CartContext.Provider>
//   );
// };


// context/CartContext.js
// export const useCart = () => ({
//   cartCount: 3,
// });


import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { cartService } from '../services/cart';
import { useAuth } from './AuthContext';

export const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load cart when user changes
  useEffect(() => {
    fetchCart();
  }, [currentUser]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
      setError("Failed to load your cart. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (productId, quantity, notes = '') => {
    setLoading(true);
    try {
      // Check if we already have this product in cart
      const existingItem = cart?.items?.find(item => item.productId === productId);
      
      if (existingItem) {
        // Update quantity instead
        return await updateItemQuantity(existingItem._id, existingItem.quantity + quantity);
      }
      
      const updatedCart = await cartService.addItem({
        productId,
        quantity,
        notes
      });
      
      setCart(updatedCart);
      toast.success('Item added to cart');
      return updatedCart;
    } catch (err) {
      console.error("Failed to add item:", err);
      setError(err.response?.data?.message || "Failed to add item to cart");
      toast.error("Failed to add item to cart");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateItemQuantity = async (itemId, quantity) => {
    if (quantity <= 0) {
      return removeItem(itemId);
    }
    
    setLoading(true);
    try {
      const updatedCart = await cartService.updateItem(itemId, { quantity });
      setCart(updatedCart);
      return updatedCart;
    } catch (err) {
      console.error("Failed to update item:", err);
      setError(err.response?.data?.message || "Failed to update item");
      toast.error("Failed to update cart");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId) => {
    setLoading(true);
    try {
      const updatedCart = await cartService.removeItem(itemId);
      setCart(updatedCart);
      toast.success('Item removed from cart');
      return updatedCart;
    } catch (err) {
      console.error("Failed to remove item:", err);
      setError(err.response?.data?.message || "Failed to remove item");
      toast.error("Failed to remove item from cart");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      await cartService.clearCart();
      setCart(null);
      toast.success('Cart cleared');
    } catch (err) {
      console.error("Failed to clear cart:", err);
      setError(err.response?.data?.message || "Failed to clear cart");
      toast.error("Failed to clear cart");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async (couponCode) => {
    setLoading(true);
    try {
      const updatedCart = await cartService.applyCoupon(couponCode);
      setCart(updatedCart);
      toast.success('Coupon applied');
      return updatedCart;
    } catch (err) {
      console.error("Failed to apply coupon:", err);
      setError(err.response?.data?.message || "Failed to apply coupon");
      toast.error(err.response?.data?.message || "Failed to apply coupon");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = async () => {
    setLoading(true);
    try {
      const updatedCart = await cartService.removeCoupon();
      setCart(updatedCart);
      toast.success('Coupon removed');
      return updatedCart;
    } catch (err) {
      console.error("Failed to remove coupon:", err);
      setError(err.response?.data?.message || "Failed to remove coupon");
      toast.error("Failed to remove coupon");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryOptions = async (options) => {
    setLoading(true);
    try {
      const updatedCart = await cartService.updateDeliveryOptions(options);
      setCart(updatedCart);
      return updatedCart;
    } catch (err) {
      console.error("Failed to update delivery options:", err);
      setError(err.response?.data?.message || "Failed to update delivery options");
      toast.error("Failed to update delivery options");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    cart,
    loading,
    error,
    fetchCart,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    updateDeliveryOptions,
    itemCount: cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
    subtotal: cart?.subtotal || 0,
    total: cart?.total || 0
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};