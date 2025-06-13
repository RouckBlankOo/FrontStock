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

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Signup" // Set the initial route to Signup
        screenOptions={{
          headerShown: false, // Hide default header since we have custom headers
        }}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
