import React, { useState } from "react";
import { Alert } from "react-native";
import StockActionBase from "../components/StockActionBase";
import { theme } from "../constants/theme";
import { returnStock } from "../services/api";

export default function ReturnStockScreen() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReturnStock = async (productId: string, quantity: number) => {
    if (!productId || !quantity) {
      Alert.alert(
        "Erreur",
        "Veuillez sélectionner un produit et saisir une quantité."
      );
      return;
    }

    setIsProcessing(true);
    try {
      await returnStock(productId, { quantity, reason: "Return to stock" });
      Alert.alert("Succès", "Le retour au stock a été effectué avec succès.");
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error?.response?.data?.message ||
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
