import React from "react";
import StockActionBase from "../components/StockActionBase";
import { theme } from "../constants/theme";
// Import the API function - you'll need to create this
import { returnStock } from "../services/api";

export default function ReturnStockScreen() {
  const handleReturnStock = async (
    productId: string,
    quantity: number,
    reason: string
  ) => {
    await returnStock(productId, { quantity, reason });
  };

  return (
    <StockActionBase
      title="Retour au Stock"
      actionName="Retour"
      actionColor={theme.colors.warning}
      buttonText="Confirmer le Retour"
      onSubmit={handleReturnStock}
    />
  );
}
