import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../constants/theme";
import { updateProductStock, getProducts } from "../services/api";
import BarcodeScanner from "../components/BarcodeScanner";

export default function ReturnStockScreen() {
  console.log("ReturnStockScreen - Component initialized");

  const navigation = useNavigation();
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedStockId, setScannedStockId] = useState<string | null>(null);
  const [quantityConfirmed, setQuantityConfirmed] = useState(false);
  const [stockInfo, setStockInfo] = useState<any>(null);

  const incrementQuantity = () => {
    console.log("ReturnStockScreen - Incrementing quantity from:", quantity);
    setQuantity((prev) => {
      const newQuantity = prev + 1;
      console.log("ReturnStockScreen - New quantity:", newQuantity);
      return newQuantity;
    });
  };

  const decrementQuantity = () => {
    console.log("ReturnStockScreen - Decrementing quantity from:", quantity);
    setQuantity((prev) => {
      const newQuantity = Math.max(1, prev - 1);
      console.log("ReturnStockScreen - New quantity:", newQuantity);
      return newQuantity;
    });
  };

  const handleQuantityChange = (text: string) => {
    console.log("ReturnStockScreen - Quantity text input:", text);
    const numericValue = parseInt(text) || 0;
    console.log("ReturnStockScreen - Parsed numeric value:", numericValue);

    if (numericValue >= 1) {
      setQuantity(numericValue);
      console.log("ReturnStockScreen - Quantity updated to:", numericValue);
    } else {
      console.log(
        "ReturnStockScreen - Invalid quantity, keeping current:",
        quantity
      );
    }
  };

  const handleConfirmQuantity = () => {
    console.log("ReturnStockScreen - Confirming quantity:", quantity);

    if (quantity < 1) {
      console.log(
        "ReturnStockScreen - Invalid quantity for confirmation:",
        quantity
      );
      Alert.alert("Erreur", "La quantité doit être au moins 1.");
      return;
    }

    console.log("ReturnStockScreen - Quantity confirmed, showing scanner");
    setQuantityConfirmed(true);
    setShowScanner(true);
  };

  // Find stock information from products
  const findStockInfo = async (stockId: string) => {
    console.log("ReturnStockScreen - Finding stock info for ID:", stockId);

    try {
      // Get all products to find which one contains this stock ID
      const response = await getProducts();
      console.log("ReturnStockScreen - Products response:", response.data);

      if (response.data.success) {
        const products = response.data.data.products;
        console.log(
          "ReturnStockScreen - Searching through",
          products.length,
          "products"
        );

        for (const product of products) {
          console.log(
            "ReturnStockScreen - Checking product:",
            product.name,
            "with",
            product.stocks?.length,
            "stocks"
          );

          if (product.stocks) {
            const stock = product.stocks.find((s: any) => s._id === stockId);
            if (stock) {
              console.log("ReturnStockScreen - Found stock:", stock);
              const stockInfo = {
                productName: product.name,
                productId: product._id,
                stockId: stock._id,
                color: stock.color,
                size: stock.size,
                currentQuantity: stock.quantity,
                price: product.price,
              };
              console.log(
                "ReturnStockScreen - Stock info compiled:",
                stockInfo
              );
              return stockInfo;
            }
          }
        }
      }

      console.log("ReturnStockScreen - No stock found with ID:", stockId);
      return null;
    } catch (error) {
      console.error("ReturnStockScreen - Error finding stock info:", error);
      return null;
    }
  };

  const handleReturnStock = async (stockId: string, quantity: number) => {
    console.log("ReturnStockScreen - Starting return stock process");
    console.log("ReturnStockScreen - Stock ID:", stockId);
    console.log("ReturnStockScreen - Quantity:", quantity);

    if (!stockId || !quantity) {
      console.log("ReturnStockScreen - Missing required parameters");
      Alert.alert(
        "Erreur",
        "Veuillez scanner un code-barres et saisir une quantité."
      );
      return;
    }

    setIsProcessing(true);
    console.log("ReturnStockScreen - Processing started");

    try {
      console.log("ReturnStockScreen - Calling API with params:", {
        stockId,
        quantityChange: quantity,
        action: "return",
      });

      // Call the API with stock ID and return action
      const response = await updateProductStock(stockId, {
        quantityChange: quantity,
        action: "return",
      });

      console.log("ReturnStockScreen - API Response:", response);

      if (response.data.success) {
        console.log("ReturnStockScreen - Return successful");

        // Get updated stock info for display
        const updatedStockInfo = {
          ...stockInfo,
          previousQuantity: response.data.data.previousQuantity,
          newQuantity: response.data.data.newQuantity,
        };

        Alert.alert(
          "Succès",
          `Le retour au stock a été effectué avec succès!\n\n` +
            `Produit: ${updatedStockInfo.productName}\n` +
            `Couleur: ${updatedStockInfo.color}\n` +
            `Taille: ${updatedStockInfo.size}\n` +
            `Quantité avant: ${updatedStockInfo.previousQuantity}\n` +
            `Quantité retournée: ${quantity}\n` +
            `Nouvelle quantité: ${updatedStockInfo.newQuantity}`,
          [
            {
              text: "OK",
              onPress: () => {
                console.log("ReturnStockScreen - Resetting form after success");
                resetForm();
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        console.log(
          "ReturnStockScreen - API returned failure:",
          response.data.message
        );
        throw new Error(response.data.message || "Erreur lors du retour");
      }
    } catch (error: any) {
      console.error("ReturnStockScreen - Return stock error:", error);
      console.error(
        "ReturnStockScreen - Error response:",
        error?.response?.data
      );
      console.error("ReturnStockScreen - Error message:", error?.message);

      let errorMessage = "Impossible de traiter le retour de stock.";

      if (error?.response?.status === 404) {
        errorMessage = "Stock non trouvé. Vérifiez le code-barres scanné.";
      } else if (error?.response?.status === 400) {
        errorMessage = error.response.data.message || "Données invalides.";
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert("Erreur", errorMessage);
    } finally {
      console.log("ReturnStockScreen - Processing finished");
      setIsProcessing(false);
    }
  };

  const handleBarcodeScanned = async (scannedData: string) => {
    console.log("ReturnStockScreen - Barcode scanned:", scannedData);

    setScannedStockId(scannedData);
    setShowScanner(false);

    // Try to find stock information
    const stockInformation = await findStockInfo(scannedData);

    if (stockInformation) {
      console.log(
        "ReturnStockScreen - Stock information found:",
        stockInformation
      );
      setStockInfo(stockInformation);

      Alert.alert(
        "Stock trouvé",
        `Produit: ${stockInformation.productName}\n` +
          `Couleur: ${stockInformation.color}\n` +
          `Taille: ${stockInformation.size}\n` +
          `Stock actuel: ${stockInformation.currentQuantity}\n` +
          `Quantité à retourner: ${quantity}`,
        [
          {
            text: "Annuler",
            style: "cancel",
            onPress: () => {
              console.log("ReturnStockScreen - User cancelled return");
              setScannedStockId(null);
              setStockInfo(null);
              setQuantityConfirmed(false);
            },
          },
          {
            text: "Confirmer le retour",
            onPress: () => {
              console.log("ReturnStockScreen - User confirmed return");
              handleReturnStock(scannedData, quantity);
            },
          },
        ]
      );
    } else {
      console.log("ReturnStockScreen - No stock information found");
      Alert.alert(
        "Code scanné",
        `Code: ${scannedData}\n` +
          `Quantité à retourner: ${quantity}\n\n` +
          `Attention: Impossible de trouver les détails du stock. Continuer?`,
        [
          {
            text: "Annuler",
            style: "cancel",
            onPress: () => {
              console.log(
                "ReturnStockScreen - User cancelled unknown stock return"
              );
              setScannedStockId(null);
              setQuantityConfirmed(false);
            },
          },
          {
            text: "Continuer quand même",
            onPress: () => {
              console.log(
                "ReturnStockScreen - User confirmed unknown stock return"
              );
              handleReturnStock(scannedData, quantity);
            },
          },
        ]
      );
    }
  };

  const handleCancelScanning = () => {
    console.log("ReturnStockScreen - Cancelling scanning");
    setShowScanner(false);
    setQuantityConfirmed(false);
    setScannedStockId(null);
    setStockInfo(null);
  };

  const resetForm = () => {
    console.log("ReturnStockScreen - Resetting form");
    setQuantity(1);
    setQuantityConfirmed(false);
    setShowScanner(false);
    setScannedStockId(null);
    setStockInfo(null);
  };

  console.log("ReturnStockScreen - Current state:", {
    quantity,
    isProcessing,
    showScanner,
    quantityConfirmed,
    scannedStockId,
    hasStockInfo: !!stockInfo,
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            console.log("ReturnStockScreen - Back button pressed");
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Retour au Stock</Text>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            console.log("ReturnStockScreen - Reset button pressed");
            resetForm();
          }}
        >
          <Ionicons name="refresh" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="return-down-back"
              size={48}
              color={theme.colors.success}
            />
          </View>

          <Text style={styles.description}>
            {!quantityConfirmed
              ? "Sélectionnez la quantité à retourner au stock, puis scannez le code-barres du stock."
              : "Scannez maintenant le code-barres du stock à retourner."}
          </Text>

          {!quantityConfirmed && (
            <>
              <View style={styles.quantitySection}>
                <Text style={styles.quantityLabel}>Quantité à retourner</Text>

                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      quantity <= 1 && styles.disabledButton,
                    ]}
                    onPress={decrementQuantity}
                    disabled={quantity <= 1}
                  >
                    <Ionicons
                      name="remove"
                      size={24}
                      color={
                        quantity <= 1
                          ? theme.colors.textSecondary
                          : theme.colors.primary
                      }
                    />
                  </TouchableOpacity>

                  <TextInput
                    style={styles.quantityInput}
                    value={quantity.toString()}
                    onChangeText={handleQuantityChange}
                    keyboardType="numeric"
                    textAlign="center"
                    selectTextOnFocus
                  />

                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={incrementQuantity}
                  >
                    <Ionicons
                      name="add"
                      size={24}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  isProcessing && styles.disabledButton,
                ]}
                onPress={handleConfirmQuantity}
                disabled={isProcessing || quantity < 1}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={24}
                      color={theme.colors.white}
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.confirmButtonText}>
                      Confirmer la quantité
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {quantityConfirmed && (
            <View style={styles.scannerSection}>
              <View style={styles.quantityInfo}>
                <Text style={styles.quantityInfoLabel}>
                  Quantité confirmée:
                </Text>
                <Text style={styles.quantityInfoValue}>{quantity}</Text>
              </View>

              {stockInfo && (
                <View style={styles.stockInfoCard}>
                  <Text style={styles.stockInfoTitle}>
                    Dernier stock scanné:
                  </Text>
                  <Text style={styles.stockInfoText}>
                    Produit: {stockInfo.productName}
                  </Text>
                  <Text style={styles.stockInfoText}>
                    Couleur: {stockInfo.color} | Taille: {stockInfo.size}
                  </Text>
                  <Text style={styles.stockInfoText}>
                    Stock actuel: {stockInfo.currentQuantity}
                  </Text>
                </View>
              )}

              <View style={styles.scannerContainer}>
                <BarcodeScanner onBarcodeScanned={handleBarcodeScanned} />
              </View>

              <TouchableOpacity
                style={styles.cancelScanButton}
                onPress={handleCancelScanning}
              >
                <Ionicons
                  name="arrow-back"
                  size={20}
                  color={theme.colors.textSecondary}
                  style={styles.buttonIcon}
                />
                <Text style={styles.cancelScanButtonText}>
                  Retour à la sélection de quantité
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.infoContainer}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.infoText}>
              {!quantityConfirmed
                ? "Après avoir confirmé la quantité, vous pourrez scanner le code-barres du stock spécifique."
                : "Scannez le code-barres du stock (ID unique) pour finaliser le retour."}
            </Text>
          </View>
        </View>
      </View>

      {/* Loading overlay during processing */}
      {isProcessing && (
        <Modal transparent visible={isProcessing}>
          <View style={styles.processingOverlay}>
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.processingText}>Traitement du retour...</Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
  backButton: {
    padding: 8,
  },
  resetButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 24,
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.success + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  quantitySection: {
    width: "100%",
    marginBottom: 32,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.lightGrey,
    borderRadius: 12,
    padding: 8,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.white,
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
  quantityInput: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.text,
    minWidth: 80,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.success,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.white,
  },
  scannerSection: {
    width: "100%",
    alignItems: "center",
  },
  quantityInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.success + "20",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  quantityInfoLabel: {
    fontSize: 14,
    color: theme.colors.text,
    marginRight: 8,
  },
  quantityInfoValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.success,
  },
  stockInfoCard: {
    backgroundColor: theme.colors.lightGrey,
    padding: 12,
    borderRadius: 8,
    width: "100%",
    marginBottom: 16,
  },
  stockInfoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  stockInfoText: {
    fontSize: 12,
    color: theme.colors.text,
    marginBottom: 2,
  },
  scannerContainer: {
    width: "100%",
    marginBottom: 24,
  },
  cancelScanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: theme.colors.lightGrey,
    marginBottom: 24,
  },
  cancelScanButtonText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: theme.colors.primary + "10",
    padding: 16,
    borderRadius: 12,
    width: "100%",
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  processingContainer: {
    backgroundColor: theme.colors.white,
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    marginHorizontal: 32,
  },
  processingText: {
    fontSize: 16,
    color: theme.colors.text,
    marginTop: 16,
    textAlign: "center",
  },
});
