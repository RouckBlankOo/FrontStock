export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  AddProduct: undefined;
  BarcodeScanner: undefined;
  DeleteArticle: undefined;
  StockAnalysis: undefined;
  AddCategory: undefined;
  AnalyticsScreen: undefined; // Added AnalyticsScreen
  FianancialAnalytics: undefined; // Added FianancialAnalytics
};

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'caissier';
}

export interface Product {
  id: string;
  name: string;
  barcode: string;
  category: string;
  subCategory: string; // Changed from type to subCategory
  color: string;
  size: string;
  quantity: number;
  price: number;
}