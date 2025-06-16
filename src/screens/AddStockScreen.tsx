import React from "react";
import StockActionBase from "../components/StockActionBase";
import { theme } from "../constants/theme";
import { addStock } from "../services/api";

export default function AddStockScreen() {
  const handleAddStock = async (
    productId: string,
    quantity: number,
    reason: string
  ) => {
    await addStock(productId, { quantity, reason });
  };

  return (
    <StockActionBase
      title="Ajouter du Stock"
      actionName="Ajout"
      actionColor={theme.colors.success}
      buttonText="Ajouter au Stock"
      onSubmit={handleAddStock}
    />
  );
}
