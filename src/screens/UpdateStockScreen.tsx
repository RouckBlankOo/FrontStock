import React, { useState } from "react";
import { Alert } from "react-native";
import StockActionBase from "../components/StockActionBase";
import { theme } from "../constants/theme";
import { updateStock } from "../services/api";

export default function UpdateStockScreen() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpdateStock = async (
    productId: string,
    quantity: number,
    reason: string
  ) => {
    if (!productId || !quantity) {
      Alert.alert(
        "Erreur",
        "Veuillez sélectionner un produit et saisir une quantité."
      );
      return;
    }

    setIsProcessing(true);
    try {
      await updateStock(productId, { quantity, reason });
      Alert.alert(
        "Succès",
        "L'ajustement de stock a été effectué avec succès."
      );
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error?.response?.data?.message ||
          "Impossible de traiter l'ajustement de stock. Veuillez réessayer."
      );
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <StockActionBase
      title="Ajuster le Stock"
      actionName="Ajustement"
      actionColor={theme.colors.primary}
      buttonText={isProcessing ? "Traitement..." : "Confirmer l'Ajustement"}
      onSubmit={handleUpdateStock}
    />
  );
}
