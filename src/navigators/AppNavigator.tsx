import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SignupScreen from "../screens/SignUpScreen";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import AddProductScreen from "../screens/AddProductScreen";
import BarcodeScannerScreen from "../screens/BarcodeScannerScreen";
import DeleteArticleScreen from "../screens/DeleteArticleScreen";
import AddCategoryScreen from "../screens/AddCategoryScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import { RootStackParamList } from "../types";
import FianancialAnalytics from "../screens/FianancialAnalytics";
import AddStockScreen from "../screens/AddStockScreen";
import RemoveStockScreen from "../screens/RemoveStockScreen";
import SellStockScreen from "../screens/SellStockScreen";
import ReturnStockScreen from "../screens/ReturnStockScreen";
import UpdateStockScreen from "../screens/UpdateStockScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Signup"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AddProduct" component={AddProductScreen} />
        <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} />
        <Stack.Screen name="DeleteArticle" component={DeleteArticleScreen} />
        <Stack.Screen name="AddCategory" component={AddCategoryScreen} />
        <Stack.Screen name="AnalyticsScreen" component={AnalyticsScreen} />
        <Stack.Screen
          name="FianancialAnalytics"
          component={FianancialAnalytics}
        />
        <Stack.Screen name="AddStockScreen" component={AddStockScreen} />
        <Stack.Screen name="RemoveStockScreen" component={RemoveStockScreen} />
        <Stack.Screen name="SellStockScreen" component={SellStockScreen} />
        <Stack.Screen name="ReturnStockScreen" component={ReturnStockScreen} />
        <Stack.Screen name="UpdateStockScreen" component={UpdateStockScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
