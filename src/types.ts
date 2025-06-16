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
  AddStockScreen: undefined; // Added AddStockScreen
  RemoveStockScreen: undefined; // Added RemoveStockScreen
  SellStockScreen: undefined; // Added SellStockScreen
  ReturnStockScreen: undefined; // Added ReturnStockScreen
  UpdateStockScreen: undefined; // Added UpdateStockScreen
  StockActionMenu: undefined; // Added StockActionMenu
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