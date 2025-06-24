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
  subCategories: string[] | SubCategory[];
}

export interface SubCategory {
  _id: string;
  name: string;
  category: string; // Category ID
}

export interface ProductStock {
  _id?: string;
  color: string;
  size: string;
  quantity: number;
  createdAt?: string;
  updatedAt?: string;
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

export interface InventoryItem {
  productId: string;
  productName: string;
  category: string;
  subCategory: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Stock update response interface
export interface StockUpdateResponse {
  productId: string;
  stockId: string;
  color: string;
  size: string;
  action: string;
  previousQuantity: number;
  newQuantity: number;
  quantityChange: number;
  success: boolean;
}

const API_URL = CONSTANTS.API_URL_PROD;

console.log("API Service - Initializing with URL:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    console.log("API Request Interceptor - Start");
    const token = await AsyncStorage.getItem("token");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("API Request Interceptor - Token added to headers");
    } else {
      console.log("API Request Interceptor - No token found");
    }
    
    console.log(`API Request - ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    if (config.data) {
      console.log("API Request - Body:", JSON.stringify(config.data, null, 2));
    }
    if (config.params) {
      console.log("API Request - Params:", config.params);
    }
    
    return config;
  },
  (error) => {
    console.error("API Request Interceptor - Error:", error.message);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`API Response - ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log("API Response - Data:", JSON.stringify(response.data, null, 2));
    return response;
  },
  (error) => {
    console.error("API Response Interceptor - Error:", error.message);
    
    if (error.response) {
      console.error("API Response Error - Status:", error.response.status);
      console.error("API Response Error - Data:", JSON.stringify(error.response.data, null, 2));
      console.error("API Response Error - Headers:", error.response.headers);
      
      const { status, data } = error.response;
      let errorMessage = data.message || "Une erreur est survenue.";
      
      if (status === 401) {
        errorMessage = "Non authentifié. Veuillez vous reconnecter.";
      } else if (status === 409) {
        errorMessage = "Conflit: Cette ressource existe déjà.";
      } else if (status === 400) {
        errorMessage = data.message || "Requête invalide.";
      } else if (status === 404) {
        errorMessage = "Ressource non trouvée. Vérifiez l'URL de l'API.";
      }
      
      return Promise.reject({ ...error, message: errorMessage });
    } else if (error.request) {
      console.error("API Response Error - No response received");
      console.error("API Response Error - Request:", error.request);
    } else {
      console.error("API Response Error - Setup:", error.message);
    }
    
    return Promise.reject(error);
  }
);

// Root API
export const healthCheck = () => {
  console.log("API Call - Health Check");
  return api.get<ApiResponse<string>>("/");
};

// Category APIs
export const createCategory = (payload: { name: string }) => {
  console.log("API Call - Create Category:", payload);
  return api.post<ApiResponse<Category>>("/category/categories", payload);
};

export const getCategories = (params?: {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  sortBy?: string;
  name?: string;
}) => {
  console.log("API Call - Get Categories:", params);
  const queryParams = {
    page: params?.page?.toString(),
    limit: params?.limit?.toString(),
    order: params?.order,
    sortBy: params?.sortBy,
    name: params?.name,
  };
  return api.get<ApiResponse<{
    page: number;
    size: number;
    total: number;
    totalPages: number;
    categories: Category[];
  }>>("/category/categories", { params: queryParams });
};

export const updateCategory = (id: string, payload: { name: string }) => {
  console.log("API Call - Update Category:", { id, payload });
  return api.put<ApiResponse<Category>>(`/category/categories/${id}`, payload);
};

export const deleteCategory = (id: string) => {
  console.log("API Call - Delete Category:", id);
  return api.delete<ApiResponse<null>>(`/category/categories/${id}`);
};

export const createSubCategory = (payload: { name: string; category: string }) => {
  console.log("API Call - Create SubCategory:", payload);
  return api.post<ApiResponse<SubCategory>>("/category/subcategories", payload);
};

export const getSubCategories = (params?: {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  sortBy?: string;
  category?: string;
  name?: string;
}) => {
  console.log("API Call - Get SubCategories:", params);
  const queryParams = {
    page: params?.page?.toString(),
    limit: params?.limit?.toString(),
    order: params?.order,
    sortBy: params?.sortBy,
    category: params?.category,
    name: params?.name,
  };
  return api.get<ApiResponse<{
    page: number;
    size: number;
    total: number;
    totalPages: number;
    subCategories: SubCategory[];
  }>>("/category/subcategories", { params: queryParams });
};

export const updateSubCategory = (id: string, payload: { name: string; category: string }) => {
  console.log("API Call - Update SubCategory:", { id, payload });
  return api.put<ApiResponse<SubCategory>>(`/category/subcategories/${id}`, payload);
};

export const deleteSubCategory = (id: string) => {
  console.log("API Call - Delete SubCategory:", id);
  return api.delete<ApiResponse<null>>(`/category/subcategories/${id}`);
};

// User APIs
export const login = (payload: {
  username: string;
  password: string;
  deviceName?: string;
}) => {
  console.log("API Call - Login:", { username: payload.username, deviceName: payload.deviceName });
  return api.post<ApiResponse<{ token: string; user: User }>>("/user/login", payload);
};

export const createUser = (payload: {
  name: string;
  username: string;
  password: string;
  role: "admin" | "worker";
}) => {
  console.log("API Call - Create User:", { ...payload, password: "[HIDDEN]" });
  return api.post<ApiResponse<User>>("/user/users", payload);
};

export const getUsers = (params?: {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  sortBy?: string;
}) => {
  console.log("API Call - Get Users:", params);
  const queryParams = {
    page: params?.page?.toString(),
    limit: params?.limit?.toString(),
    order: params?.order,
    sortBy: params?.sortBy,
  };
  return api.get<ApiResponse<{
    page: number;
    size: number;
    total: number;
    totalPages: number;
    users: User[];
  }>>("/user/users", { params: queryParams });
};

export const getProductById = (id: string) => {
  console.log("API Call - Get Product By ID:", id);
  return api.get<ApiResponse<Product>>(`/product/products/${id}`);
};

export const updateUser = (id: string, payload: {
  name?: string;
  password?: string;
  role?: "admin" | "worker";
}) => {
  console.log("API Call - Update User:", { id, payload: { ...payload, password: payload.password ? "[HIDDEN]" : undefined } });
  return api.put<ApiResponse<User>>(`/user/users/${id}`, payload);
};

export const getUserLoginHistory = (id: string, params?: {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  sortBy?: string;
}) => {
  console.log("API Call - Get User Login History:", { id, params });
  const queryParams = {
    page: params?.page?.toString(),
    limit: params?.limit?.toString(),
    order: params?.order,
    sortBy: params?.sortBy,
  };
  return api.get<ApiResponse<{
    page: number;
    size: number;
    total: number;
    totalPages: number;
    loginHistory: any[];
  }>>(`/user/users/${id}/login-history`, { params: queryParams });
};

export const getSession = () => {
  console.log("API Call - Get Session");
  return api.get<ApiResponse<any>>("/user/session");
};

// Product APIs
export const createProduct = (payload: {
  name: string;
  category: string;
  subCategory: string;
  description?: string;
  price: number;
  stocks: ProductStock[];
}) => {
  console.log("API Call - Create Product:", payload);
  return api.post<ApiResponse<Product>>("/product/products", payload);
};

// Updated and simplified stock update function
export const updateProductStock = async (stockId: string, payload: {
  quantityChange: number;
  action: "add" | "sell" | "update" | "remove" | "return";
}) => {
  console.log("API Call - Update Product Stock - START");
  console.log("API Call - Stock ID:", stockId);
  console.log("API Call - Payload:", payload);
  
  try {
    // Validate input
    if (!stockId) {
      console.error("API Call - Update Product Stock - No stock ID provided");
      throw new Error("Stock ID is required");
    }
    
    if (!payload.quantityChange || !payload.action) {
      console.error("API Call - Update Product Stock - Missing required payload fields");
      throw new Error("Quantity change and action are required");
    }
    
    // Valid actions
    const validActions = ["add", "sell", "update", "remove", "return"];
    if (!validActions.includes(payload.action)) {
      console.error("API Call - Update Product Stock - Invalid action:", payload.action);
      throw new Error(`Invalid action. Must be one of: ${validActions.join(", ")}`);
    }
    
    console.log("API Call - Update Product Stock - Making request to:", `/product/products/${stockId}/stock`);
    
    const response = await api.put<ApiResponse<StockUpdateResponse>>(
      `/product/products/${stockId}/stock`,
      {
        quantityChange: payload.quantityChange,
        action: payload.action,
      }
    );
    
    console.log("API Call - Update Product Stock - SUCCESS");
    console.log("API Call - Response data:", response.data);
    
    return response;
    
  } catch (error: any) {
    console.error("API Call - Update Product Stock - ERROR");
    console.error("API Call - Error details:", error);
    
    if (error.response) {
      console.error("API Call - Response error status:", error.response.status);
      console.error("API Call - Response error data:", error.response.data);
    } else if (error.request) {
      console.error("API Call - Request error:", error.request);
    } else {
      console.error("API Call - General error:", error.message);
    }
    
    throw error;
  }
};

export const getProductStockHistory = (id: string, params?: {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  sortBy?: string;
  startDate?: string;
  endDate?: string;
  action?: string;
}) => {
  console.log("API Call - Get Product Stock History:", { id, params });
  const queryParams = {
    page: params?.page?.toString(),
    limit: params?.limit?.toString(),
    order: params?.order,
    sortBy: params?.sortBy,
    startDate: params?.startDate,
    endDate: params?.endDate,
    action: params?.action,
  };
  return api.get<ApiResponse<{
    page: number;
    size: number;
    total: number;
    totalPages: number;
    stockHistory: any[];
  }>>(`/product/products/${id}/stock-history`, { params: queryParams });
};

export const getProducts = (params?: {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  sortBy?: string;
  name?: string;
  category?: string;
  subCategory?: string;
  color?: string;
  stockSize?: string;
  quantity?: string;
}) => {
  console.log("API Call - Get Products:", params);
  const queryParams = {
    page: params?.page?.toString(),
    limit: params?.limit?.toString(),
    order: params?.order,
    sortBy: params?.sortBy,
    name: params?.name,
    category: params?.category,
    subCategory: params?.subCategory,
    color: params?.color,
    stockSize: params?.stockSize,
    quantity: params?.quantity,
  };
  return api.get<ApiResponse<{
    page: number;
    size: number;
    total: number;
    totalPages: number;
    products: Product[];
  }>>("/product/get-products", { params: queryParams });
};

export const updateProduct = (id: string, payload: {
  name?: string;
  category?: string;
  subCategory?: string;
  price?: number;
  stocks?: ProductStock[];
  description?: string;
}) => {
  console.log("API Call - Update Product:", { id, payload });
  return api.put<ApiResponse<Product>>(`/product/products/${id}`, payload);
};

export const getInventory = () => {
  console.log("API Call - Get Inventory");
  return api.get<ApiResponse<InventoryItem[]>>("/product/inventory");
};

export const getUserStockHistory = (userId: string, params?: {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  sortBy?: string;
}) => {
  console.log("API Call - Get User Stock History:", { userId, params });
  const queryParams = {
    page: params?.page?.toString(),
    limit: params?.limit?.toString(),
    order: params?.order,
    sortBy: params?.sortBy,
  };
  return api.get<ApiResponse<{
    page: number;
    size: number;
    total: number;
    totalPages: number;
    stockHistory: any[];
  }>>(`/product/user/${userId}/stock-history`, { params: queryParams });
};

export const getAllStockHistory = (params?: {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  sortBy?: string;
  product?: string;
  user?: string;
  color?: string;
  size?: string;
  startDate?: string;
  endDate?: string;
  action?: string;
}) => {
  console.log("API Call - Get All Stock History:", params);
  const queryParams = {
    page: params?.page?.toString(),
    limit: params?.limit?.toString(),
    order: params?.order,
    sortBy: params?.sortBy,
    product: params?.product,
    user: params?.user,
    color: params?.color,
    size: params?.size,
    startDate: params?.startDate,
    endDate: params?.endDate,
    action: params?.action,
  };
  return api.get<ApiResponse<{
    page: number;
    size: number;
    total: number;
    totalPages: number;
    stockHistory: any[];
  }>>("/product/stock-history", { params: queryParams });
};

// Stats APIs
export const getTotalProducts = (params?: {
  startDate?: string;
  endDate?: string;
}) => {
  console.log("API Call - Get Total Products:", params);
  const queryParams = {
    startDate: params?.startDate,
    endDate: params?.endDate,
  };
  return api.get<ApiResponse<number>>("/stats/total-products", { params: queryParams });
};

export const getTotalStocks = (params?: {
  startDate?: string;
  endDate?: string;
}) => {
  console.log("API Call - Get Total Stocks:", params);
  const queryParams = {
    startDate: params?.startDate,
    endDate: params?.endDate,
  };
  return api.get<ApiResponse<number>>("/stats/total-stocks", { params: queryParams });
};

export const getTotalPrices = (params?: {
  startDate?: string;
  endDate?: string;
}) => {
  console.log("API Call - Get Total Prices:", params);
  const queryParams = {
    startDate: params?.startDate,
    endDate: params?.endDate,
  };
  return api.get<ApiResponse<number>>("/stats/total-prices", { params: queryParams });
};

export const getProfit = (params?: {
  startDate?: string;
  endDate?: string;
}) => {
  console.log("API Call - Get Profit:", params);
  const queryParams = {
    startDate: params?.startDate,
    endDate: params?.endDate,
  };
  return api.get<ApiResponse<number>>("/stats/profit", { params: queryParams });
};

// Utility function to find stock by product and color/size (if needed)
export const findStockByProductAndAttributes = async (
  productId: string, 
  color: string, 
  size: string
): Promise<{ stockId: string; product: Product } | null> => {
  console.log("API Utility - Find Stock By Product and Attributes:", { productId, color, size });
  
  try {
    const response = await getProductById(productId);
    const product = response.data.data;
    
    console.log("API Utility - Product found:", product);
    
    const stock = product.stocks.find(s => 
      s.color.toLowerCase() === color.toLowerCase() && 
      s.size.toLowerCase() === size.toLowerCase()
    );
    
    if (stock) {
      console.log("API Utility - Stock found:", stock);
      return { stockId: stock._id, product };
    } else {
      console.log("API Utility - No matching stock found");
      return null;
    }
  } catch (error) {
    console.error("API Utility - Error finding stock:", error);
    throw error;
  }
};

export default api;