import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { getProducts, Product } from "../services/api";
import { theme } from "../constants/theme";

interface StockActionBaseProps {
  title: string;
  actionName: string;
  actionColor: string;
  buttonText: string;
  onSubmit: (
    productId: string,
    quantity: number,
    reason: string
  ) => Promise<void>;
  isDecrement?: boolean;
}

export default function StockActionBase({
  title,
  actionName,
  actionColor,
  buttonText,
  onSubmit,
  isDecrement = false,
}: StockActionBaseProps) {
  const navigation = useNavigation();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await getProducts();
      setProducts(response.data.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      Alert.alert("Erreur", "Impossible de charger les produits.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate input
    if (!selectedProduct) {
      Alert.alert("Erreur", "Veuillez sélectionner un produit.");
      return;
    }

    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert("Erreur", "Veuillez entrer une quantité valide.");
      return;
    }

    if (!reason.trim()) {
      Alert.alert("Erreur", "Veuillez fournir une raison.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(selectedProduct, parsedQuantity, reason);
      Alert.alert("Succès", `${actionName} effectuée avec succès.`);
      // Reset form
      setSelectedProduct("");
      setQuantity("1");
      setReason("");

      // Refresh products to get updated quantities
      fetchProducts();
    } catch (error: any) {
      console.error(`Error ${actionName}:`, error);
      Alert.alert(
        "Erreur",
        error.message || `Impossible de ${actionName.toLowerCase()} le stock.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator size="large" color={actionColor} />
          ) : (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Produit</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedProduct}
                    onValueChange={(itemValue) =>
                      setSelectedProduct(itemValue.toString())
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Sélectionner un produit" value="" />
                    {products.map((product) => (
                      <Picker.Item
                        key={product._id}
                        label={`${product.name} - ${product.stocks.reduce(
                          (sum, stock) => sum + stock.quantity,
                          0
                        )} en stock`}
                        value={product._id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Quantité</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholder="Entrer la quantité"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Raison</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Entrer la raison"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: actionColor },
                  submitting && styles.disabledButton,
                ]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>{buttonText}</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "#3498db",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  picker: {
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.7,
  },
});
