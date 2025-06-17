import React, { useState } from "react";
import { View, Text, Alert } from "react-native";
import StockActionBase from "../components/StockActionBase";
import { theme } from "../constants/theme";
// Import the API function - you'll need to create this
import { returnStock } from "../services/api";

export default function ReturnStockScreen() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReturnStock = async (
    productId: string,
    quantity: number,
    reason: string
  ) => {
    setIsProcessing(true);
    try {
      await returnStock(productId, { quantity, reason });
      // You could show a success message or navigate to another screen
    } catch (error) {
      Alert.alert(
        "Erreur",
        "Impossible de traiter le retour de stock. Veuillez réessayer."
      );
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <StockActionBase
      title="Retour au Stock"
      actionName="Retour"
      actionColor={theme.colors.error}
      buttonText={isProcessing ? "Traitement..." : "Confirmer le Retour"}
      onSubmit={handleReturnStock}
    />
  );
}
