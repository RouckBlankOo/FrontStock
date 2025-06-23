import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import BarcodeScanner from "./BarcodeScanner";
import ProductSelector from "../components/ProductSelector";
import { theme } from "../constants/theme";
import { addStock, sellStock, removeStock, returnStock } from "../services/api";

type ActionType = "add" | "sell" | "remove" | "return";

interface StockUpdateFormProps {
  initialAction?: ActionType;
}

interface ActionConfig {
  title: string;
  actionName: string;
  color: string;
  icon: string;
  isDecrement: boolean;
  apiFunction: (productId: string, data: any) => Promise<any>;
}

const StockUpdateForm = ({ initialAction = "add" }: StockUpdateFormProps) => {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [actionType, setActionType] = useState<ActionType>(initialAction);

  // Define configurations for each action type
  const actionConfigs: Record<ActionType, ActionConfig> = {
    add: {
      title: "Ajouter au Stock",
      actionName: "Ajout",
      color: theme.colors.success,
      icon: "add-circle",
      isDecrement: false,
      apiFunction: addStock,
    },
    sell: {
      title: "Vendre un Article",
      actionName: "Vente",
      color: theme.colors.primary,
      icon: "cart",
      isDecrement: true,
      apiFunction: sellStock,
    },
    remove: {
      title: "Retirer du Stock",
      actionName: "Retrait",
      color: theme.colors.error,
      icon: "remove-circle",
      isDecrement: true,
      apiFunction: removeStock,
    },
    return: {
      title: "Retour au Stock",
      actionName: "Retour",
      color: theme.colors.error,
      icon: "return-up-back",
      isDecrement: false,
      apiFunction: returnStock,
    },
  };

  // Get current action configuration
  const currentConfig = actionConfigs[actionType];

  const handleBarcodeScanned = (value: string) => {
    setProductId(value);
  };

  const handleProductSelected = (id: string) => {
    setProductId(id);
  };

  const resetForm = () => {
    setProductId("");
    setQuantity("");
    setReason("");
    setError("");
  };

  const handleSubmit = async () => {
    if (!productId) {
      setError("Veuillez sélectionner un produit");
      return;
    }

    if (!quantity) {
      setError("Veuillez saisir une quantité");
      return;
    }

    const quantityNum = parseInt(quantity, 10);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError("La quantité doit être un nombre positif");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Call the appropriate API function based on action type
      let data: any = { quantity: quantityNum };

      // Add reason to data if provided
      if (reason && ["remove", "return"].includes(actionType)) {
        data.reason = reason;
      }

      await currentConfig.apiFunction(productId, data);

      setSuccess(true);
      resetForm();

      // Show success message
      Alert.alert(
        "Succès",
        `${currentConfig.actionName} effectué avec succès!`,
        [{ text: "OK" }]
      );

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Une erreur est survenue. Veuillez réessayer."
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Gestion du Stock</Text>
          <View style={styles.headerAccent} />
        </View>

        <View style={styles.card}>
          {/* Action Type Selector */}
          <View style={styles.actionSelectorContainer}>
            <Text style={styles.label}>Type d'opération</Text>
            <View style={styles.actionButtons}>
              {Object.entries(actionConfigs).map(([key, config]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.actionButton,
                    actionType === key && {
                      backgroundColor: config.color,
                      borderColor: config.color,
                    },
                  ]}
                  onPress={() => {
                    setActionType(key as ActionType);
                    resetForm();
                  }}
                >
                  <Ionicons
                    name={config.icon as any}
                    size={20}
                    color={actionType === key ? "white" : config.color}
                  />
                  <Text
                    style={[
                      styles.actionButtonText,
                      actionType === key && { color: "white" },
                    ]}
                  >
                    {config.actionName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          <BarcodeScanner onBarcodeScanned={handleBarcodeScanned} />

          <View style={styles.divider} />

          <ProductSelector
            selectedProductId={productId}
            onProductSelected={handleProductSelected}
          />

          <View>
            <Text style={styles.label}>Quantité</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="apps"
                size={20}
                color={theme.colors.grey}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder={`Quantité à ${
                  currentConfig.isDecrement ? "retirer" : "ajouter"
                }`}
                placeholderTextColor={theme.colors.grey}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Show reason field for remove and return operations */}
          {["remove", "return"].includes(actionType) && (
            <View style={styles.marginTop}>
              <Text style={styles.label}>
                Motif {actionType === "remove" ? "du retrait" : "du retour"}
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="information-circle"
                  size={20}
                  color={theme.colors.grey}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Saisissez un motif (optionnel)"
                  placeholderTextColor={theme.colors.grey}
                />
              </View>
            </View>
          )}
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle"
              size={20}
              color={theme.colors.error}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: currentConfig.color },
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons
                name={currentConfig.icon as any}
                size={20}
                color="white"
                style={styles.buttonIcon}
              />
              <Text style={styles.submitButtonText}>
                {currentConfig.isDecrement
                  ? "Confirmer le retrait"
                  : "Confirmer l'ajout"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: theme.colors.text,
    marginBottom: 8,
  },
  headerAccent: {
    height: 4,
    width: 60,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionSelectorContainer: {
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
    minWidth: "23%",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
    color: theme.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.lightGrey,
    marginVertical: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: theme.colors.text,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "white",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  marginTop: {
    marginTop: 20,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.errorLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: theme.colors.error,
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonIcon: {
    marginRight: 10,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

// Add these colors to your theme if they don't exist already
// theme.colors.warning = '#f39c12';

export default StockUpdateForm;
