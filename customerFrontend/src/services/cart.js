import api from "./custApi"


export const cartService = {
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },
  
  addItem: async (itemData) => {
    const response = await api.post('/cart/items', itemData);
    return response.data;
  },
  
  updateItem: async (itemId, updateData) => {
    const response = await api.put(`/cart/items/${itemId}`, updateData);
    return response.data;
  },
  
  removeItem: async (itemId) => {
    const response = await api.delete(`/cart/items/${itemId}`);
    return response.data;
  },
  
  clearCart: async () => {
    const response = await api.delete('/cart');
    return response.data;
  },
  
  applyCoupon: async (couponCode) => {
    const response = await api.put('/cart/coupon', { couponCode });
    return response.data;
  },
  
  removeCoupon: async () => {
    const response = await api.delete('/cart/coupon');
    return response.data;
  },
  
  updateDeliveryOptions: async (options) => {
    const response = await api.put('/cart/delivery-options', options);
    return response.data;
  },
  
  getCartSummary: async () => {
    const response = await api.get('/cart/summary');
    return response.data;
  }
};