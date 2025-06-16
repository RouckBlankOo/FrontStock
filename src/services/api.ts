import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONSTANTS } from "../constants/index";

// Define types based on backend schemas
export interface User {
  _id: string;
  name: string;
  username: string;
  role: "admin" | "worker";
}

export interface Category {
  _id: string;
  name: string;
  subCategories: string[] | SubCategory[]; // Array of subCategory IDs or objects
}

export interface SubCategory {
  _id: string;
  name: string;
  category: string; // Category ID
}

export interface ProductStock {
  color: string;
  size: string;
  quantity: number;
}

export interface Product {
  _id: string;
  name: string;
  category: string; // Category ID
  subCategory: string; // SubCategory ID
  description?: string;
  price: number;
  stocks: ProductStock[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Add this interface for categories response
export interface CategoriesResponse {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  categories: Category[];
}

// Add this interface for subcategories response
export interface SubCategoriesResponse {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  subCategories: SubCategory[];
}

const API_URL = CONSTANTS.API_URL_PROD;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(
      `Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`
    );
    return config;
  },
  (error) => {
    console.error("Request error:", error.message);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log("Response received:", response.status);
    return response;
  },
  (error) => {
    console.error("Response error:", error.message);
    if (error.response) {
      console.error("Error data:", error.response.data);
      const { status, data } = error.response;
      let errorMessage = data.message || "Une erreur est survenue.";
      if (status === 401) {
        errorMessage = "Non authentifié. Veuillez vous reconnecter.";
      } else if (status === 409) {
        errorMessage = "Conflit: Cette ressource existe déjà.";
      } else if (status === 400) {
        errorMessage = data.message || "Requête invalide.";
      }
      return Promise.reject({ ...error, message: errorMessage });
    }
    return Promise.reject(error);
  }
);

// User APIs
export const login = (payload: {
  username: string;
  password: string;
  deviceName?: string;
}) => api.post<ApiResponse<{ token: string; user: User }>>("/user/login", payload);

export const signup = (payload: {
  name: string;
  username: string;
  password: string;
  role: "admin" | "caissier";
}) => {
  const backendPayload = {
    ...payload,
    role: payload.role === "caissier" ? "worker" : "admin",
  };
  return api.post<ApiResponse<{ token: string; user: User }>>("/user", backendPayload);
};

export const getUser = () => api.get<ApiResponse<User>>("/user/me");

// Category APIs - Updated to match backend routes
export const getCategories = () => 
  api.get<ApiResponse<CategoriesResponse>>("/category/categories");

// Updated to match backend route structure
export const getSubCategories = (categoryId?: string) => {
  const params = categoryId ? { category: categoryId } : {};
  return api.get<ApiResponse<SubCategoriesResponse>>("/category/subcategories", { params });
};

export const createCategory = (payload: { name: string }) =>
  api.post<ApiResponse<Category>>("/category/categories", payload);

export const createSubCategory = (payload: { name: string; category: string }) =>
  api.post<ApiResponse<SubCategory>>("/category/subcategories", payload);

// Product APIs
export const getProducts = () => api.get<ApiResponse<Product[]>>("/product");

export const addProduct = (product: {
  name: string;
  category: string;
  subCategory: string;
  description?: string;
  price: number;
  stocks: ProductStock[];
}) => api.post<ApiResponse<Product>>("/product", product);

export const deleteProduct = (productId: string) =>
  api.delete<ApiResponse<null>>(`/product/${productId}`);

export const scanBarcode = (barcode: string) =>
  api.get<ApiResponse<Product>>(`/product/scan/${barcode}`);

// Stats APIs
export const getTotalProducts = () => api.get<ApiResponse<number>>("/stats/total-products");

export const getTotalStocks = () => api.get<ApiResponse<number>>("/stats/total-stocks");

export const getProfit = () => api.get<ApiResponse<number>>("/stats/profit");

export const getStockHistory = () => api.get<ApiResponse<any>>("/stats/stock-history");

// Add these functions to your api.ts file

export const addStock = (productId: string, payload: { quantity: number; reason: string }) =>
  api.post<ApiResponse<any>>(`/product/${productId}/add-stock`, payload);

export const removeStock = (productId: string, payload: { quantity: number; reason: string }) =>
  api.post<ApiResponse<any>>(`/product/${productId}/remove-stock`, payload);

export const sellStock = (productId: string, payload: { quantity: number; reason: string }) =>
  api.post<ApiResponse<any>>(`/product/${productId}/sell`, payload);

export const returnStock = (productId: string, payload: { quantity: number; reason: string }) =>
  api.post<ApiResponse<any>>(`/product/${productId}/return`, payload);

export const updateStock = (productId: string, payload: { quantity: number; reason: string }) =>
  api.post<ApiResponse<any>>(`/product/${productId}/update-stock`, payload);

export default api;