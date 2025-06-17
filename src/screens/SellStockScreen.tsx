import React from "react";
import StockActionBase from "../components/StockActionBase";
import { theme } from "../constants/theme";
// Import the API function - you'll need to create this
import { sellStock } from "../services/api";

export default function SellStockScreen() {
  const handleSellStock = async (
    productId: string,
    color: string,
    size: string,
    quantity: number,
    reason: string
  ) => {
    await sellStock(productId, { color, size, quantity, reason });
  };

  return (
    <StockActionBase
      title="Vendre du Stock"
      actionName="Vente"
      actionColor={theme.colors.primary}
      buttonText="Confirmer la Vente"
      onSubmit={handleSellStock}
      isDecrement={true}
    />
  );
}
