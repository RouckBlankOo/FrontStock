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
  StockScreen: undefined; // Replaced FianancialAnalytics with StockManagement
  AddStockScreen: undefined; // Added AddStockScreen
  RemoveStockScreen: undefined; // Added RemoveStockScreen
  SellStockScreen: undefined; // Added SellStockScreen
  ReturnStockScreen: undefined; // Added ReturnStockScreen
  UpdateStockScreen: undefined; // Added UpdateStockScreen
  StockActionMenu: undefined; // Added StockActionMenu
  ProductDetails: { productId: string };
  BarcodeScannerScreen: undefined;
};

// Add this new interface
export interface StockUpdatePayload {
  quantityChange: number; // Change in quantity
  reason?: string;       // Optional reason
  action: 'add' | 'sell' | 'update' | 'remove' | 'return'; // Action type
}