import React from "react";
import StockActionBase from "../components/StockActionBase";
import { theme } from "../constants/theme";
// Import the API function - you'll need to create this
import { updateStock } from "../services/api";

export default function UpdateStockScreen() {
  const handleUpdateStock = async (
    productId: string,
    quantity: number,
    reason: string
  ) => {
    await updateStock(productId, { quantity, reason });
  };

  return (
    <StockActionBase
      title="Ajuster le Stock"
      actionName="Ajustement"
      actionColor={theme.colors.primary}
      buttonText="Confirmer l'Ajustement"
      onSubmit={handleUpdateStock}
    />
  );
}
