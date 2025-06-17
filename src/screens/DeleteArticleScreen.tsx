import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { RootStackParamList, Product } from "../types";
import { getProducts, deleteProduct } from "../services/api";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DeleteArticleScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [barcode, setBarcode] = useState<string>("");
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!barcode) {
        setProduct(null);
        return;
      }
      try {
        const response = await getProducts({ barcode });
        if (response.data.data.products.length > 0) {
          setProduct(response.data.data.products[0]);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setProduct(null);
      }
    };

    fetchProduct();
  }, [barcode]);

  const handleBarcodeScan = () => {
    navigation.navigate("BarcodeScanner", {
      onScan: (scannedBarcode: string) => setBarcode(scannedBarcode),
    });
  };

  const handleDelete = async () => {
    if (!product) {
      Alert.alert(
        "Erreur",
        "Veuillez scanner ou entrer un code-barres valide."
      );
      return;
    }

    setIsLoading(true);
    try {
      await deleteProduct(product.barcode);
      Alert.alert("Succès", "Produit supprimé avec succès !", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
      setBarcode("");
      setProduct(null);
    } catch (error: any) {
      const errorMessage =
        error.message || "Échec de la suppression du produit.";
      Alert.alert("Erreur", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: theme.colors.danger }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backIcon}
          accessibilityLabel="Retour"
        >
          <Ionicons
            name="arrow-back-outline"
            size={28}
            color={theme.colors.white}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Supprimer un article</Text>
      </View>
      <View style={styles.formCard}>
        {/* Barcode Input */}
        <View style={styles.formField}>
          <Text style={styles.label}>Code-barres</Text>
          <View style={styles.barcodeContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Entrez ou scannez le code-barres"
              value={barcode}
              onChangeText={setBarcode}
              accessibilityLabel="Entrer le code-barres"
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleBarcodeScan}
              accessibilityLabel="Scanner le code-barres"
            >
              <Ionicons
                name="barcode-outline"
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Product Info */}
        {product && (
          <View style={styles.formField}>
            <Text style={styles.label}>Produit</Text>
            <Text style={styles.productInfo}>{product.name}</Text>
            <Text style={styles.productInfo}>
              Catégorie: {product.category}
            </Text>
            <Text style={styles.productInfo}>
              Sous-catégorie: {product.subCategory}
            </Text>
            <Text style={styles.productInfo}>Prix: {product.price}</Text>
          </View>
        )}

        {/* Delete Button */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.colors.danger },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleDelete}
          disabled={isLoading}
          accessibilityLabel="Supprimer le produit"
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Suppression en cours..." : "Supprimer le produit"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.large,
    paddingTop: theme.spacing.large + 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.medium,
  },
  backIcon: {
    position: "absolute",
    left: theme.spacing.medium,
  },
  title: {
    fontSize: theme.fontSizes.largeTitle,
    fontWeight: "bold",
    color: theme.colors.white,
    textAlign: "center",
  },
  formCard: {
    ...theme.card,
    padding: theme.spacing.large,
    margin: theme.spacing.large,
  },
  formField: {
    marginBottom: theme.spacing.large,
  },
  label: {
    fontSize: theme.fontSizes.regular,
    fontWeight: "500",
    color: theme.colors.text,
    marginBottom: theme.spacing.small,
  },
  barcodeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    ...theme.input,
    borderColor: theme.colors.inputBorder,
    backgroundColor: theme.colors.inputBackground,
    marginBottom: theme.spacing.medium,
  },
  scanButton: {
    padding: theme.spacing.medium,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.medium,
    marginLeft: theme.spacing.small,
  },
  productInfo: {
    fontSize: theme.fontSizes.regular,
    color: theme.colors.text,
    padding: theme.spacing.medium,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.small,
  },
  button: {
    ...theme.button,
    alignItems: "center",
    marginTop: theme.spacing.medium,
  },
  buttonDisabled: {
    opacity: theme.button.disabledOpacity,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.regular,
    fontWeight: "bold",
  },
});
