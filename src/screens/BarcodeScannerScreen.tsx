import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { RootStackParamList } from "../types";
import { getProductById, Product } from "../services/api";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function BarcodeScannerScreen() {
  console.log("🔍 BarcodeScannerScreen - Component initialized");

  const navigation = useNavigation<NavigationProp>();
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scannedData, setScannedData] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [lastScanTime, setLastScanTime] = useState(0);
  const cameraRef = useRef<CameraView>(null);

  console.log("🔍 BarcodeScannerScreen - Current state:", {
    hasPermission: permission?.granted,
    isProcessing,
    hasScannedProduct: !!scannedProduct,
    scannedData,
    error,
    hasScanned,
    scanCount,
  });

  useEffect(() => {
    console.log("🔍 BarcodeScannerScreen - Permission effect triggered");
    checkCameraPermissions();
  }, []);

  const checkCameraPermissions = async () => {
    console.log("🔍 BarcodeScannerScreen - checkCameraPermissions - Starting");
    console.log(
      "🔍 BarcodeScannerScreen - checkCameraPermissions - Current permission:",
      permission
    );

    if (!permission) {
      console.log(
        "🔍 BarcodeScannerScreen - checkCameraPermissions - No permission object, requesting..."
      );
      try {
        const newPermission = await requestPermission();
        console.log(
          "🔍 BarcodeScannerScreen - checkCameraPermissions - Permission result:",
          newPermission
        );
      } catch (error) {
        console.error(
          "🔍 BarcodeScannerScreen - checkCameraPermissions - Error requesting permission:",
          error
        );
      }
    } else {
      console.log(
        "🔍 BarcodeScannerScreen - checkCameraPermissions - Permission already available:",
        permission.granted
      );
    }
  };

  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    const currentTime = Date.now();
    setScanCount((prev) => prev + 1);

    console.log("🎯 BarcodeScannerScreen - BARCODE SCAN DETECTED!");
    console.log("🎯 BarcodeScannerScreen - Scan #:", scanCount + 1);
    console.log("🎯 BarcodeScannerScreen - Scan result:", result);
    console.log("🎯 BarcodeScannerScreen - Data:", result.data);
    console.log("🎯 BarcodeScannerScreen - Type:", result.type);
    console.log("🎯 BarcodeScannerScreen - Current time:", currentTime);
    console.log("🎯 BarcodeScannerScreen - Last scan time:", lastScanTime);
    console.log(
      "🎯 BarcodeScannerScreen - Time diff:",
      currentTime - lastScanTime
    );

    // Prevent rapid successive scans (debounce)
    if (currentTime - lastScanTime < 2000) {
      console.log("🎯 BarcodeScannerScreen - Ignoring rapid scan (debounce)");
      return;
    }

    // Prevent multiple scans
    if (isProcessing || hasScanned || !result.data) {
      console.log("🎯 BarcodeScannerScreen - Ignoring scan due to state:", {
        isProcessing,
        hasScanned,
        hasData: !!result.data,
      });
      return;
    }

    console.log("🎯 BarcodeScannerScreen - Processing valid scan...");
    setLastScanTime(currentTime);
    setIsProcessing(true);
    setHasScanned(true);
    setScannedData(result.data);
    setError(null);

    // Show immediate feedback
    Alert.alert(
      "Code scanné !",
      `Code détecté: ${result.data}\nType: ${result.type}`,
      [
        {
          text: "Rechercher",
          onPress: () => searchProduct(result.data),
        },
        {
          text: "Annuler",
          style: "cancel",
          onPress: () => {
            console.log("🎯 BarcodeScannerScreen - User cancelled search");
            handleRecapture();
          },
        },
      ]
    );
  };

  const searchProduct = async (productId: string) => {
    console.log(
      "🔍 BarcodeScannerScreen - searchProduct - Starting search for:",
      productId
    );

    try {
      console.log("🔍 BarcodeScannerScreen - searchProduct - Calling API...");

      // Try to get product by ID
      const response = await getProductById(productId);
      console.log(
        "🔍 BarcodeScannerScreen - searchProduct - API response:",
        response.data
      );

      if (response.data.success) {
        const product = response.data.data;
        console.log(
          "🔍 BarcodeScannerScreen - searchProduct - Product found:",
          {
            id: product._id,
            name: product.name,
            price: product.price,
            stocksCount: product.stocks?.length || 0,
          }
        );

        setScannedProduct(product);
        setError(null);

        Alert.alert(
          "Produit trouvé !",
          `${product.name}\nPrix: ${product.price}TND`,
          [{ text: "OK" }]
        );
      } else {
        console.log(
          "🔍 BarcodeScannerScreen - searchProduct - API returned failure"
        );
        throw new Error(response.data.message || "Produit non trouvé");
      }
    } catch (error: any) {
      console.error("🔍 BarcodeScannerScreen - searchProduct - Error:", error);
      console.error(
        "🔍 BarcodeScannerScreen - searchProduct - Error response:",
        error.response?.data
      );
      console.error(
        "🔍 BarcodeScannerScreen - searchProduct - Error status:",
        error.response?.status
      );

      let errorMessage = "Échec de la récupération du produit";

      if (error.response?.status === 404) {
        errorMessage = `Produit non trouvé pour le code: ${productId}`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.log(
        "🔍 BarcodeScannerScreen - searchProduct - Final error message:",
        errorMessage
      );
      setError(errorMessage);
      setScannedProduct(null);

      Alert.alert("Produit non trouvé", errorMessage, [
        {
          text: "Réessayer",
          onPress: () => {
            console.log(
              "🔍 BarcodeScannerScreen - searchProduct - User chose to retry"
            );
            handleRecapture();
          },
        },
        {
          text: "Retour",
          onPress: () => {
            console.log(
              "🔍 BarcodeScannerScreen - searchProduct - User chose to go back"
            );
            handleBack();
          },
        },
      ]);
    } finally {
      console.log(
        "🔍 BarcodeScannerScreen - searchProduct - Processing completed"
      );
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    console.log("🔍 BarcodeScannerScreen - handleBack - Navigating back");
    navigation.goBack();
  };

  const handleRecapture = () => {
    console.log(
      "🔍 BarcodeScannerScreen - handleRecapture - Resetting scanner"
    );
    setScannedProduct(null);
    setScannedData("");
    setError(null);
    setIsProcessing(false);
    setHasScanned(false);
    setLastScanTime(0);
  };

  const getTotalStock = (product: Product): number => {
    if (!product.stocks || product.stocks.length === 0) return 0;
    return product.stocks.reduce((sum, stock) => sum + stock.quantity, 0);
  };

  const handleRequestPermission = async () => {
    console.log(
      "🔍 BarcodeScannerScreen - handleRequestPermission - Requesting camera permission"
    );
    try {
      const result = await requestPermission();
      console.log(
        "🔍 BarcodeScannerScreen - handleRequestPermission - Permission result:",
        result
      );
    } catch (error) {
      console.error(
        "🔍 BarcodeScannerScreen - handleRequestPermission - Error:",
        error
      );
      Alert.alert("Erreur", "Impossible de demander la permission de caméra");
    }
  };

  // Enhanced mock scan for testing
  const handleMockScan = () => {
    console.log("🔍 BarcodeScannerScreen - handleMockScan - Simulating scan");

    // Show a list of options for testing
    Alert.alert("Simulation de scan", "Choisissez un type de test:", [
      {
        text: "ID produit réel",
        onPress: () => {
          const mockProductId = "PROD12345"; // You can replace with a real ID
          console.log("🔍 Mock scanning product ID:", mockProductId);
          handleBarcodeScanned({
            data: mockProductId,
            type: "qr",
            cornerPoints: [],
            bounds: { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
          });
        },
      },
      {
        text: "Code inexistant",
        onPress: () => {
          const fakeId = "FAKE_ID_" + Date.now();
          console.log("🔍 Mock scanning fake ID:", fakeId);
          handleBarcodeScanned({
            data: fakeId,
            type: "code128",
            cornerPoints: [],
            bounds: { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
          });
        },
      },
      {
        text: "Annuler",
        style: "cancel",
      },
    ]);
  };

  // Test camera functionality
  const testCamera = () => {
    console.log("🔍 BarcodeScannerScreen - testCamera - Testing camera state");
    Alert.alert(
      "Test de caméra",
      `Permission: ${
        permission?.granted ? "Accordée" : "Refusée"
      }\nCamera ref: ${
        cameraRef.current ? "Disponible" : "Non disponible"
      }\nScans détectés: ${scanCount}`,
      [{ text: "OK" }]
    );
  };

  if (permission === undefined) {
    console.log(
      "🔍 BarcodeScannerScreen - Render - Permission undefined, showing loading"
    );
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backIcon}
            accessibilityLabel="Revenir"
          >
            <Ionicons
              name="arrow-back-outline"
              size={28}
              color={theme.colors.white}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Scanner le produit</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.message}>
            Vérification des permissions de caméra...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (permission === null) {
    console.log(
      "🔍 BarcodeScannerScreen - Render - Permission null, showing error"
    );
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backIcon}
            accessibilityLabel="Revenir"
          >
            <Ionicons
              name="arrow-back-outline"
              size={28}
              color={theme.colors.white}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Scanner le produit</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons
            name="camera-outline"
            size={64}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.message}>
            Impossible d'accéder aux permissions de caméra
          </Text>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            accessibilityLabel="Revenir"
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    console.log(
      "🔍 BarcodeScannerScreen - Render - Permission not granted, showing permission request"
    );
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backIcon}
            accessibilityLabel="Revenir"
          >
            <Ionicons
              name="arrow-back-outline"
              size={28}
              color={theme.colors.white}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Scanner le produit</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons size={64} color={theme.colors.error} />
          <Text style={styles.message}>
            Accès à la caméra requis pour scanner les codes-barres
          </Text>
          <Text style={styles.submessage}>
            Veuillez autoriser l'accès à la caméra pour continuer
          </Text>

          <TouchableOpacity
            onPress={handleRequestPermission}
            style={styles.permissionButton}
            accessibilityLabel="Autoriser la caméra"
          >
            <Ionicons
              name="camera-outline"
              size={20}
              color={theme.colors.white}
              style={styles.buttonIcon}
            />
            <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleMockScan}
            style={styles.mockButton}
            accessibilityLabel="Simuler un scan"
          >
            <Text style={styles.mockButtonText}>Simuler un scan (Test)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            accessibilityLabel="Revenir"
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  console.log("🔍 BarcodeScannerScreen - Render - Main scanner interface");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backIcon}
          accessibilityLabel="Revenir"
        >
          <Ionicons
            name="arrow-back-outline"
            size={28}
            color={theme.colors.white}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Scanner le produit</Text>

        {/* Debug button */}
        {__DEV__ && (
          <TouchableOpacity
            onPress={testCamera}
            style={styles.debugButton}
            accessibilityLabel="Test caméra"
          >
            <Ionicons name="bug-outline" size={20} color={theme.colors.white} />
          </TouchableOpacity>
        )}
      </View>

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
                  "qr",
                  "ean13",
                  "ean8",
                  "code128",
                  "code39",
                  "code93",
                  "codabar",
                  "upc_e",
                  "upc_a",
                  "aztec",
                  "datamatrix",
                  "pdf417",
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

              {/* Scan counter for debugging */}
              <View style={styles.debugInfo}>
                <Text style={styles.debugText}>
                  Scans détectés: {scanCount}
                </Text>
                {scannedData && (
                  <Text style={styles.debugText}>
                    Dernier code: {scannedData}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.mockScanButton}
                onPress={handleMockScan}
              >
                <Text style={styles.mockScanButtonText}>Simuler un scan</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.resultContainer}>
            <View style={styles.resultCard}>
              <View style={styles.successIcon}>
                <Ionicons
                  name="checkmark-circle"
                  size={64}
                  color={theme.colors.success}
                />
              </View>

              <Text style={styles.resultTitle}>Produit trouvé !</Text>

              <View style={styles.productDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Nom :</Text>
                  <Text style={styles.detailValue}>{scannedProduct.name}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Prix :</Text>
                  <Text style={styles.detailValue}>
                    {scannedProduct.price} TND
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Stock total :</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      {
                        color:
                          getTotalStock(scannedProduct) > 0
                            ? theme.colors.success
                            : theme.colors.error,
                      },
                    ]}
                  >
                    {getTotalStock(scannedProduct)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Code scanné :</Text>
                  <Text style={styles.detailValue}>{scannedData}</Text>
                </View>

                {scannedProduct.description && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Description :</Text>
                    <Text style={styles.detailValue}>
                      {scannedProduct.description}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.recaptureButton}
                  onPress={handleRecapture}
                  accessibilityLabel="Scanner un autre produit"
                >
                  <Ionicons
                    name="camera-outline"
                    size={20}
                    color={theme.colors.primary}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.recaptureButtonText}>
                    Scanner un autre
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={handleBack}
                  accessibilityLabel="Terminé"
                >
                  <Ionicons
                    name="checkmark-outline"
                    size={20}
                    color={theme.colors.white}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.doneButtonText}>Terminé</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Loading overlay */}
      {isProcessing && (
        <Modal transparent visible={isProcessing}>
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Recherche du produit...</Text>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backIcon: {
    position: "absolute",
    left: 16,
    padding: 8,
  },
  debugButton: {
    position: "absolute",
    right: 16,
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.white,
    textAlign: "center",
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    borderRadius: 16,
    backgroundColor: "transparent",
    marginBottom: 32,
  },
  scanMessage: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 24,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginBottom: 16,
  },
  debugInfo: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  debugText: {
    color: theme.colors.white,
    fontSize: 12,
    textAlign: "center",
  },
  mockScanButton: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mockScanButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: "500",
  },
  resultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  resultCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  successIcon: {
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.success,
    marginBottom: 24,
    textAlign: "center",
  },
  productDetails: {
    width: "100%",
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  recaptureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.white,
    flex: 1,
    marginRight: 8,
  },
  recaptureButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: "bold",
  },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: theme.colors.success,
    flex: 1,
    marginLeft: 8,
  },
  doneButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginRight: 8,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  message: {
    fontSize: 18,
    color: theme.colors.text,
    textAlign: "center",
    marginTop: 16,
    fontWeight: "500",
  },
  submessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 24,
  },
  permissionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  permissionButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  mockButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.textSecondary,
    borderRadius: 8,
  },
  mockButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: "500",
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.lightGrey,
    borderRadius: 8,
  },
  backButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: theme.colors.white,
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    marginHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text,
    marginTop: 16,
    textAlign: "center",
  },
});
