import React from "react";
import StockActionBase from "../components/StockActionBase";
import { theme } from "../constants/theme";
// Import the API function - you'll need to create this
import { removeStock } from "../services/api";

export default function RemoveStockScreen() {
  const handleRemoveStock = async (
    productId: string,
    color: string,
    size: string,
    quantity: number,
    reason: string
  ) => {
    await removeStock(productId, { color, size, quantity, reason });
  };

  return (
    <StockActionBase
      title="Retirer du Stock"
      actionName="Retrait"
      actionColor={theme.colors.error}
      buttonText="Retirer du Stock"
      onSubmit={handleRemoveStock}
      isDecrement={true}
    />
  );
}
