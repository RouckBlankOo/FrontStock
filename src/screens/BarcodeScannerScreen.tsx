import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { RootStackParamList, Product } from "../types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const API_BASE_URL = "http://192.168.1.13:5000"; // Replace with your computer's IP address

export default function BarcodeScannerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // Animation states
  const buttonScale = useState(new Animated.Value(1))[0];

  useEffect(() => {
    (async () => {
      if (permission) {
        setHasPermission(permission.granted);
      } else {
        const newPermission = await requestPermission();
        setHasPermission(newPermission.granted);
      }
    })();
  }, [permission, requestPermission]);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (isProcessing || scannedProduct) return;
    setIsProcessing(true);

    try {
      const product = await fetchProductByBarcode(data);
      setScannedProduct(product);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch product.";
      console.error("Error fetching product:", error);
      Alert.alert("Erreur", `${errorMessage} Veuillez réessayer.`, [
        { text: "OK" },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchProductByBarcode = async (barcode: string): Promise<Product> => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const response = await fetch(`${API_BASE_URL}/api/product/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ barcode }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch product.");
        } else {
          const text = await response.text();
          console.error("Non-JSON response from backend:", text);
          throw new Error(
            `Unexpected response from server: ${text.slice(0, 100)}...`
          );
        }
      }

      const result = await response.json();
      return result.data.product as Product;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch product.";
      console.error("Error fetching product:", error);
      throw new Error(errorMessage);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleRecapture = () => {
    setScannedProduct(null);
    setIsProcessing(false);
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Demande d'autorisation de caméra...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>
          Accès interdit à la caméra. Veuillez autoriser l'accès.
        </Text>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Text style={styles.backButtonText}>Revenir</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backIcon}
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="arrow-back-outline"
              size={28}
              color={theme.colors.background}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Scanner le produit</Text>
        </View>
      </LinearGradient>

      <View style={styles.cameraContainer}>
        {!scannedProduct ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              ref={cameraRef}
              facing="back"
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: [
                  "ean13",
                  "ean8",
                  "upc_a",
                  "upc_e",
                  "code128",
                  "code39",
                  "code93",
                  "codabar",
                  "qr",
                ],
              }}
            />
            <View style={styles.overlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanMessage}>
                {isProcessing
                  ? "Traitement en cours..."
                  : "Placez le code-barres dans le cadre"}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.capturedContainer}>
            {isProcessing ? (
              <Text style={styles.capturedMessage}>
                Récupération du produit...
              </Text>
            ) : scannedProduct ? (
              <>
                <Text style={styles.capturedMessage}>Produit trouvé :</Text>
                <Text style={styles.productDetail}>
                  Nom : {scannedProduct.name}
                </Text>
                <Text style={styles.productDetail}>
                  Code-barres : {scannedProduct.barcode}
                </Text>
                <Text style={styles.productDetail}>
                  Catégorie : {scannedProduct.category}
                </Text>
                <Text style={styles.productDetail}>
                  Sous-catégorie : {scannedProduct.subCategory}
                </Text>
                <Text style={styles.productDetail}>
                  Couleur : {scannedProduct.color}
                </Text>
                <Text style={styles.productDetail}>
                  Taille : {scannedProduct.size}
                </Text>
                <Text style={styles.productDetail}>
                  Quantité : {scannedProduct.quantity}
                </Text>
              </>
            ) : (
              <Text style={styles.capturedMessage}>
                Aucun produit trouvé. Appuyez sur « Reprise » pour réessayer.
              </Text>
            )}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.button, isProcessing && styles.buttonDisabled]}
                onPress={() => {
                  animateButtonPress();
                  handleRecapture();
                }}
                disabled={isProcessing}
                accessibilityLabel="Recapture barcode"
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  style={styles.gradientButton}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={24}
                    color={theme.colors.background}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Reprise</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.large,
    paddingTop: theme.spacing.large + 10,

    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    position: "absolute",
    left: theme.spacing.medium,
  },
  title: {
    fontSize: theme.fontSizes.title + 6,
    fontWeight: "bold",
    color: theme.colors.background,
    textAlign: "center",
  },
  cameraContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    borderRadius: 18,
    backgroundColor: "transparent",
    marginBottom: 24,
  },
  scanMessage: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 12,
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  capturedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.large,
  },
  capturedMessage: {
    fontSize: theme.fontSizes.regular,
    color: theme.colors.text,
    marginBottom: theme.spacing.large,
    textAlign: "center",
  },
  productDetail: {
    fontSize: theme.fontSizes.regular,
    color: theme.colors.text,
    marginBottom: theme.spacing.small,
    textAlign: "center",
  },
  button: {
    marginVertical: theme.spacing.large,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonIcon: {
    marginRight: theme.spacing.small,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: theme.fontSizes.button,
    fontWeight: "bold",
  },
  message: {
    fontSize: theme.fontSizes.regular,
    color: theme.colors.text,
    textAlign: "center",
    marginTop: theme.spacing.large,
  },
  backButton: {
    marginTop: theme.spacing.large,
    padding: theme.spacing.medium,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
  },
  backButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.button,
    fontWeight: "bold",
    textAlign: "center",
  },
});
