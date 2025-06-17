import React, { useState } from "react";
import { Alert } from "react-native";
import StockActionBase from "../components/StockActionBase";
import { theme } from "../constants/theme";
import { sellStock } from "../services/api";

export default function SellStockScreen() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSellStock = async (
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
      await sellStock(productId, { quantity, reason });
      Alert.alert("Succès", "La vente a été enregistrée avec succès.");
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error?.response?.data?.message ||
          "Impossible de traiter la vente. Veuillez réessayer."
      );
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <StockActionBase
      title="Vendre du Stock"
      actionName="Vente"
      actionColor={theme.colors.primary}
      buttonText={isProcessing ? "Traitement..." : "Confirmer la Vente"}
      onSubmit={handleSellStock}
      isDecrement={true}
    />
  );
}
