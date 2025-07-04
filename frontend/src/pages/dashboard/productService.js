import axios from "axios";

const API_BASE_URL = "https://project-shopcart-production.up.railway.app/api/catalog"; // update with your backend URL

// Create an axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Function to list categories. You can optionally pass filter parameters.
export const listCategories = async (params = {}) => {
    const response = await api.get("/categories", { params });
    return response.data;
};

// Function to list products with filters and pagination
export const listProducts = async (params) => {
    const response = await api.get("/products", { params });
    return response.data;
};

// Function to update a product (PATCH endpoint)
export const updateProduct = async (id, data) => {
    const response = await api.patch(`/products/${id}`, data);
    return response.data;
};

// Function to toggle product availability
export const toggleProductAvailability = async (id) => {
    const response = await api.patch(`/products/${id}/toggle-availability`);
    return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/product/${id}`);
  return response.data;
};

export const getSearchSuggestions = async ({ query }) => {
    try {
      const response = await api.get("/products/suggestions", {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching search suggestions:", error);
      throw error;
    }
  };