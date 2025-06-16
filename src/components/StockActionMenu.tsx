import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { theme } from "../constants/theme";

interface StockActionProps {
  onClose?: () => void;
}

export default function StockActionMenu({ onClose }: StockActionProps) {
  const navigation = useNavigation();

  const actions = [
    {
      id: "add",
      label: "Ajouter Stock",
      icon: "add-circle-outline",
      screen: "AddStockScreen",
      color: theme.colors.success,
    },
    {
      id: "remove",
      label: "Retirer Stock",
      icon: "remove-circle-outline",
      screen: "RemoveStockScreen",
      color: theme.colors.error,
    },
    {
      id: "sell",
      label: "Vendre",
      icon: "cart-outline",
      screen: "SellStockScreen",
      color: theme.colors.primary,
    },
    {
      id: "return",
      label: "Retour",
      icon: "return-down-back-outline",
      screen: "ReturnStockScreen",
      color: theme.colors.error,
    },
    {
      id: "update",
      label: "Ajuster Stock",
      icon: "sync-outline",
      screen: "UpdateStockScreen",
      color: theme.colors.primary,
    },
  ];

  const handleActionPress = (screen: string) => {
    if (onClose) onClose();
    navigation.navigate(screen as never);
  };

  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={styles.actionButton}
          onPress={() => handleActionPress(action.screen)}
        >
          <View
            style={[styles.iconContainer, { backgroundColor: action.color }]}
          >
            <Ionicons name={action.icon as any} size={22} color="#fff" />
          </View>
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 16,
  },
  actionButton: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
});
