import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import { theme } from "../constants/theme";
import {
  getProducts,
  updateProductStock,
  Product,
  ProductStock,
} from "../services/api";
import { StockUpdatePayload } from "../types";
import { Ionicons } from "@expo/vector-icons"; // For close icon, install expo/vector-icons if not present
import { SafeAreaView } from "react-native-safe-area-context";

interface StockItem extends ProductStock {
  _id: string;
  productId: string;
  productName: string;
}

type StockAction = "add" | "sell" | "update" | "remove" | "return";

const StockScreen = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
  const [quantityChange, setQuantityChange] = useState("");
  const [selectedAction, setSelectedAction] = useState<StockAction>("add");
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stockReason, setStockReason] = useState("");

  const actions: { value: StockAction; label: string; color: string }[] = [
    { value: "add", label: "Ajouter Stock", color: theme.colors.success },
    { value: "sell", label: "Vendre", color: theme.colors.primary },
    { value: "update", label: "Mettre à jour", color: theme.colors.secondary },
    { value: "remove", label: "Retirer", color: theme.colors.error },
    { value: "return", label: "Retourner", color: theme.colors.textSecondary },
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterStocks();
  }, [products, searchQuery]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await getProducts();
      if (response.data.success) {
        setProducts(response.data.data.products);
      }
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error.message || "Erreur lors du chargement des produits"
      );
    } finally {
      setLoading(false);
    }
  };

  const filterStocks = () => {
    const stocks: StockItem[] = [];
    products.forEach((product) => {
      product.stocks.forEach((stock, index) => {
        stocks.push({
          ...stock,
          _id: `${product._id}_${index}`,
          productId: product._id,
          productName: product.name,
        });
      });
    });

    if (searchQuery) {
      const filtered = stocks.filter(
        (stock) =>
          stock.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.size.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStocks(filtered);
    } else {
      setFilteredStocks(stocks);
    }
  };

  const openStockModal = (stock: StockItem) => {
    setSelectedStock(stock);
    setQuantityChange("");
    setSelectedAction("add");
    setStockReason("");
    setModalVisible(true);
  };

  const closeStockModal = () => {
    setSelectedStock(null);
    setQuantityChange("");
    setSelectedAction("add");
    setStockReason("");
    setModalVisible(false);
  };

  const handleStockUpdate = async () => {
    if (!selectedStock || !quantityChange || !selectedAction) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs requis");
      return;
    }

    const quantityChangeValue = parseInt(quantityChange);
    if (isNaN(quantityChangeValue) || quantityChangeValue <= 0) {
      Alert.alert("Erreur", "Veuillez entrer une quantité valide");
      return;
    }

    if (
      (selectedAction === "remove" || selectedAction === "sell") &&
      quantityChangeValue > selectedStock.quantity
    ) {
      Alert.alert("Erreur", "Quantité insuffisante en stock");
      return;
    }

    setSubmitting(true);
    try {
      const stockId = selectedStock._id;

      const response = await updateProductStock(stockId, {
        quantityChange: quantityChangeValue,
        reason: stockReason || `Action: ${selectedAction}`,
        action: selectedAction,
      });

      if (response.data.success) {
        Alert.alert("Succès", "Stock mis à jour avec succès");
        closeStockModal();
        loadProducts();
      }
    } catch (error: any) {
      console.error("Error updating stock:", error);
      Alert.alert(
        "Erreur",
        error.message || "Erreur lors de la mise à jour du stock"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getActionColor = (action: StockAction) => {
    return (
      actions.find((a) => a.value === action)?.color || theme.colors.primary
    );
  };

  const renderStockItem = ({ item }: { item: StockItem }) => (
    <View>
      <TouchableOpacity
        style={styles.stockItem}
        onPress={() => openStockModal(item)}
        activeOpacity={0.85}
      >
        <View style={styles.stockInfo}>
          <Text style={styles.productName}>{item.productName}</Text>
          <View style={styles.stockDetails}>
            <View style={styles.stockProperty}>
              <Text style={styles.propertyLabel}>Couleur:</Text>
              <Text style={styles.propertyValue}>{item.color}</Text>
            </View>
            <View style={styles.stockProperty}>
              <Text style={styles.propertyLabel}>Taille:</Text>
              <Text style={styles.propertyValue}>{item.size}</Text>
            </View>
          </View>
        </View>
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Quantité</Text>
          <Text
            style={[
              styles.quantity,
              {
                color:
                  item.quantity > 0 ? theme.colors.success : theme.colors.error,
              },
            ]}
          >
            {item.quantity}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.divider} />
    </View>
  );

  const renderActionButton = (action: {
    value: StockAction;
    label: string;
    color: string;
  }) => (
    <TouchableOpacity
      key={action.value}
      style={[
        styles.actionButton,
        {
          backgroundColor:
            selectedAction === action.value
              ? action.color
              : theme.colors.inputBackground,
          borderColor: action.color,
          shadowColor:
            selectedAction === action.value ? action.color : "transparent",
          shadowOpacity: selectedAction === action.value ? 0.15 : 0,
          shadowRadius: 4,
        },
      ]}
      onPress={() => setSelectedAction(action.value)}
      activeOpacity={0.85}
    >
      <Text
        style={[
          styles.actionButtonText,
          {
            color:
              selectedAction === action.value
                ? theme.colors.white
                : action.color,
            fontWeight: selectedAction === action.value ? "bold" : "500",
          },
        ]}
      >
        {action.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Gestion du Stock</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par produit, couleur ou taille..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des produits...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStocks}
          keyExtractor={(item) => item._id}
          renderItem={renderStockItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons
                name="cube-outline"
                size={48}
                color={theme.colors.inputBorder}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.emptyText}>Aucun stock trouvé</Text>
            </View>
          }
        />
      )}

      {/* Stock Update Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeStockModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Pressable
              style={styles.closeIconContainer}
              onPress={closeStockModal}
            >
              <Ionicons
                name="close"
                size={28}
                color={theme.colors.textSecondary}
              />
            </Pressable>
            <Text style={styles.modalTitle}>Gestion du Stock</Text>

            {selectedStock && (
              <View style={styles.selectedStockInfo}>
                <Text style={styles.selectedProductName}>
                  {selectedStock.productName}
                </Text>
                <Text style={styles.selectedStockDetails}>
                  {selectedStock.color} - {selectedStock.size}
                </Text>
                <Text style={styles.currentQuantity}>
                  Quantité actuelle:{" "}
                  <Text
                    style={{ fontWeight: "bold", color: theme.colors.success }}
                  >
                    {selectedStock.quantity}
                  </Text>
                </Text>
              </View>
            )}

            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Action à effectuer:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.actionsScroll}
                contentContainerStyle={{ gap: theme.spacing.small }}
              >
                {actions.map(renderActionButton)}
              </ScrollView>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Quantité:</Text>
              <TextInput
                style={styles.quantityInput}
                placeholder="Entrer la quantité"
                value={quantityChange}
                onChangeText={setQuantityChange}
                keyboardType="numeric"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeStockModal}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  { backgroundColor: getActionColor(selectedAction) },
                ]}
                onPress={handleStockUpdate}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.medium,
  },
  title: {
    fontSize: theme.fontSizes.title,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.large,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  searchContainer: {
    marginBottom: theme.spacing.medium,
  },
  searchInput: {
    ...theme.input,
    backgroundColor: theme.colors.inputBackground,
    borderColor: theme.colors.inputBorder,
    color: theme.colors.text,
    borderRadius: theme.borderRadius.large,
    paddingHorizontal: theme.spacing.large,
    fontSize: theme.fontSizes.regular,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  loadingText: {
    marginTop: theme.spacing.small,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.regular,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.regular,
    textAlign: "center",
    marginTop: 4,
  },
  listContainer: {
    paddingBottom: theme.spacing.large,
  },
  stockItem: {
    ...theme.card,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: theme.spacing.xs,
    padding: theme.spacing.medium,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.white,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.inputBorder,
    marginHorizontal: theme.spacing.small,
    opacity: 0.15,
  },
  stockInfo: {
    flex: 1,
  },
  productName: {
    fontSize: theme.fontSizes.regular,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    letterSpacing: 0.2,
  },
  stockDetails: {
    flexDirection: "row",
    gap: theme.spacing.medium,
  },
  stockProperty: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: theme.spacing.medium,
  },
  propertyLabel: {
    fontSize: theme.fontSizes.small,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.xs,
  },
  propertyValue: {
    fontSize: theme.fontSizes.small,
    color: theme.colors.text,
    fontWeight: "bold",
  },
  quantityContainer: {
    alignItems: "center",
    minWidth: 60,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: theme.borderRadius.small,
    backgroundColor: theme.colors.inputBackground,
  },
  quantityLabel: {
    fontSize: theme.fontSizes.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  quantity: {
    fontSize: theme.fontSizes.subtitle,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.modalOverlay,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.medium,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.large,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    position: "relative",
  },
  closeIconContainer: {
    position: "absolute",
    right: theme.spacing.medium,
    top: theme.spacing.medium,
    zIndex: 10,
    padding: 4,
  },
  modalTitle: {
    fontSize: theme.fontSizes.title,
    fontWeight: "bold",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.large,
    letterSpacing: 0.5,
  },
  selectedStockInfo: {
    backgroundColor: theme.colors.inputBackground,
    padding: theme.spacing.medium,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.large,
    alignItems: "center",
  },
  selectedProductName: {
    fontSize: theme.fontSizes.regular,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    letterSpacing: 0.2,
  },
  selectedStockDetails: {
    fontSize: theme.fontSizes.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  currentQuantity: {
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
    fontWeight: "500",
  },
  formSection: {
    marginBottom: theme.spacing.large,
  },
  sectionLabel: {
    fontSize: theme.fontSizes.regular,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.small,
    letterSpacing: 0.2,
  },
  actionsScroll: {
    marginHorizontal: -theme.spacing.xs,
    paddingVertical: 2,
  },
  actionButton: {
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.large,
    borderRadius: theme.borderRadius.large,
    borderWidth: 1.5,
    marginHorizontal: theme.spacing.xs,
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  actionButtonText: {
    fontSize: theme.fontSizes.small,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  quantityInput: {
    ...theme.input,
    backgroundColor: theme.colors.inputBackground,
    borderColor: theme.colors.inputBorder,
    color: theme.colors.text,
    borderRadius: theme.borderRadius.medium,
    fontSize: theme.fontSizes.regular,
    paddingHorizontal: theme.spacing.medium,
    marginTop: 2,
  },
  reasonInput: {
    ...theme.input,
    backgroundColor: theme.colors.inputBackground,
    borderColor: theme.colors.inputBorder,
    color: theme.colors.text,
    borderRadius: theme.borderRadius.medium,
    fontSize: theme.fontSizes.regular,
    paddingHorizontal: theme.spacing.medium,
    minHeight: 40,
    maxHeight: 80,
    marginTop: 2,
  },
  modalButtons: {
    flexDirection: "row",
    gap: theme.spacing.medium,
    marginTop: theme.spacing.medium,
  },
  modalButton: {
    flex: 1,
    ...theme.button,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.borderRadius.large,
    paddingVertical: theme.spacing.medium,
    marginHorizontal: theme.spacing.xs,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: theme.colors.textSecondary,
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.regular,
    fontWeight: "bold",
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  confirmButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.regular,
    fontWeight: "bold",
  },
});

export default StockScreen;
