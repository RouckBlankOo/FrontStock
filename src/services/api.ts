import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONSTANTS } from "../constants/index";
import { Product } from "../types";

const API_URL = CONSTANTS.API_URL_PROD || "http://192.168.1.13:5000/api";

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
    console.error("Request error:", error);
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
    }
    return Promise.reject(error);
  }
);

export const getUser = () => api.get("/auth/me");
export const getProducts = () => api.get("/product");
export const scanBarcode = (barcode: string) => api.get(`/product/scan/${barcode}`);
export const getStockAnalytics = () => api.get("/analytics/stock");
export const getFinanceAnalytics = () => api.get("/analytics/finance");

export const addProduct = (product: Product) => {
  return api.post("/product", product);
};

// UPDATED LOGIN: expects { username, password, deviceName }
export const login = (payload: { username: string; password: string; deviceName?: string }) => {
  return api.post("/user/login", payload);
};

// UPDATED SIGNUP: expects { name, username, password, role }
export const signup = (payload: {
  name: string;
  username: string;
  password: string;
  role: "admin" | "caissier";
}) => {
  // Map "caissier" to "worker" for backend
  const backendPayload = {
    ...payload,
    role: payload.role === "caissier" ? "worker" : "admin",
  };
  return api.post("/user/users", backendPayload);
};