import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  TextInput,
  Modal,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../constants/theme";
import { RootStackParamList } from "../types";
import { productColors } from "../constants/colors";
import {
  getProducts,
  getCategories,
  getSubCategories,
  updateProductStock,
  Product,
  Category,
  SubCategory,
} from "../services/api";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface StockDisplayItem {
  _id: string;
  productId: string;
  stockId: string;
  productName: string;
  category: string;
  subCategory: string;
  price: number;
  color: string;
  size: string;
  quantity: number;
}

export default function HomeScreen() {
  console.log("HomeScreen - Component initialized");

  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();
  const [menuVisible, setMenuVisible] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockItems, setStockItems] = useState<StockDisplayItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<StockDisplayItem | null>(
    null
  );
  const [itemDetailVisible, setItemDetailVisible] = useState(false);
  const [stockUpdateModalVisible, setStockUpdateModalVisible] = useState(false);
  const [quantityInput, setQuantityInput] = useState("");
  const [updateAction, setUpdateAction] = useState<"add" | "remove" | "update">(
    "add"
  );
  const [updatingStock, setUpdatingStock] = useState(false);

  // Column sorting
  const [sortBy, setSortBy] = useState<keyof StockDisplayItem>("productName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { width } = useWindowDimensions();

  // Reset menu state when screen comes into focus
  useEffect(() => {
    console.log("HomeScreen - Screen focus changed:", isFocused);
    if (isFocused) {
      setMenuVisible(false);
    }
  }, [isFocused]);

  // Handle animation separately from state changes to avoid insertion effect errors
  useEffect(() => {
    console.log("HomeScreen - Menu visibility changed:", menuVisible);
    Animated.timing(menuAnim, {
      toValue: menuVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [menuVisible, menuAnim]);

  // Fetch products on load
  useEffect(() => {
    console.log("HomeScreen - Initial data fetch");
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    console.log("HomeScreen - fetchData - Starting data fetch...");
    setLoading(true);
    setError(null);

    try {
      // Fetch products and categories in parallel
      console.log(
        "HomeScreen - fetchData - Fetching products and categories..."
      );
      const [productsRes, categoriesRes] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);

      console.log(
        "HomeScreen - fetchData - Products response:",
        productsRes.data
      );
      console.log(
        "HomeScreen - fetchData - Categories response:",
        categoriesRes.data
      );

      if (!productsRes.data.success || !categoriesRes.data.success) {
        throw new Error("Failed to fetch data");
      }

      const productsData = productsRes.data.data.products || [];
      const categoriesData = categoriesRes.data.data.categories || [];

      console.log(
        "HomeScreen - fetchData - Products data count:",
        productsData.length
      );
      console.log(
        "HomeScreen - fetchData - Categories data count:",
        categoriesData.length
      );

      setProducts(productsData);
      setCategories(categoriesData);

      // Fetch subcategories for each category
      if (categoriesData.length > 0) {
        console.log("HomeScreen - fetchData - Fetching subcategories...");
        const subCategoriesPromises = categoriesData.map(
          (category: Category) => {
            console.log(
              "HomeScreen - fetchData - Fetching subcategories for category:",
              category._id
            );
            return getSubCategories({ category: category._id });
          }
        );

        const subCategoriesResponses = await Promise.all(subCategoriesPromises);
        const allSubCategories = subCategoriesResponses.flatMap((response) => {
          if (response.data.success) {
            return response.data.data.subCategories || [];
          }
          return [];
        });

        console.log(
          "HomeScreen - fetchData - All subcategories count:",
          allSubCategories.length
        );
        setSubCategories(allSubCategories);

        // Transform products to flat stock items for display
        const stockDisplayItems = transformProductsToStockItems(
          productsData,
          categoriesData,
          allSubCategories
        );

        console.log(
          "HomeScreen - fetchData - Stock display items count:",
          stockDisplayItems.length
        );
        setStockItems(stockDisplayItems);
      } else {
        console.log(
          "HomeScreen - fetchData - No categories, transforming without subcategories"
        );
        // No categories, just transform products with empty subcategories
        const stockDisplayItems = transformProductsToStockItems(
          productsData,
          categoriesData,
          []
        );
        setStockItems(stockDisplayItems);
      }
    } catch (error: any) {
      console.error("HomeScreen - fetchData - Error:", error);
      console.error("HomeScreen - fetchData - Error message:", error.message);
      console.error(
        "HomeScreen - fetchData - Error response:",
        error.response?.data
      );
      setError(
        error.message ||
          "Une erreur est survenue lors du chargement des données"
      );
    } finally {
      console.log("HomeScreen - fetchData - Completed");
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    console.log("HomeScreen - onRefresh - Refreshing data");
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Transform products data to flat stock items for display
  const transformProductsToStockItems = useCallback(
    (
      products: Product[],
      categories: Category[],
      subCategories: SubCategory[]
    ): StockDisplayItem[] => {
      console.log(
        "HomeScreen - transformProductsToStockItems - Starting transformation"
      );
      console.log(
        "HomeScreen - transformProductsToStockItems - Products:",
        products.length
      );
      console.log(
        "HomeScreen - transformProductsToStockItems - Categories:",
        categories.length
      );
      console.log(
        "HomeScreen - transformProductsToStockItems - SubCategories:",
        subCategories.length
      );

      const categoryMap = new Map<string, string>();
      categories.forEach((cat) => {
        categoryMap.set(cat._id, cat.name);
        console.log(
          "HomeScreen - transformProductsToStockItems - Category mapping:",
          cat._id,
          "->",
          cat.name
        );
      });

      const subCategoryMap = new Map<string, string>();
      subCategories.forEach((subCat) => {
        subCategoryMap.set(subCat._id, subCat.name);
        console.log(
          "HomeScreen - transformProductsToStockItems - SubCategory mapping:",
          subCat._id,
          "->",
          subCat.name
        );
      });

      const stockItems: StockDisplayItem[] = [];

      products.forEach((product, productIndex) => {
        console.log(
          `HomeScreen - transformProductsToStockItems - Processing product ${
            productIndex + 1
          }:`,
          {
            id: product._id,
            name: product.name,
            stocksCount: product.stocks?.length || 0,
            categoryId: product.category,
            subCategoryId: product.subCategory,
          }
        );

        // Skip products without stocks
        if (!product.stocks || product.stocks.length === 0) {
          console.log(
            "HomeScreen - transformProductsToStockItems - Skipping product without stocks:",
            product.name
          );
          return;
        }

        const categoryId =
          typeof product.category === "string"
            ? product.category
            : (product.category as any)?._id;
        const subCategoryId =
          typeof product.subCategory === "string"
            ? product.subCategory
            : (product.subCategory as any)?._id;

        const categoryName =
          categoryMap.get(categoryId) || "Catégorie inconnue";
        const subCategoryName =
          subCategoryMap.get(subCategoryId) || "Sous-catégorie inconnue";

        console.log(
          "HomeScreen - transformProductsToStockItems - Resolved names:",
          {
            categoryName,
            subCategoryName,
          }
        );

        // Create a stock item for each color/size combination
        product.stocks.forEach((stock, stockIndex) => {
          const stockItem: StockDisplayItem = {
            _id: `${product._id}-${stock.color}-${stock.size}`,
            productId: product._id,
            stockId: stock._id ?? "", // Individual stock ID, fallback to empty string if undefined
            productName: product.name,
            category: categoryName,
            subCategory: subCategoryName,
            price: product.price,
            color: stock.color,
            size: stock.size,
            quantity: stock.quantity,
          };

          console.log(
            `HomeScreen - transformProductsToStockItems - Stock item ${
              stockIndex + 1
            }:`,
            {
              displayId: stockItem._id,
              productId: stockItem.productId,
              stockId: stockItem.stockId,
              productName: stockItem.productName,
              color: stock.color,
              size: stock.size,
              quantity: stock.quantity,
            }
          );

          stockItems.push(stockItem);
        });
      });

      console.log(
        "HomeScreen - transformProductsToStockItems - Total stock items created:",
        stockItems.length
      );
      return stockItems;
    },
    []
  );

  // Filter stock items based on search query
  const filteredStockItems = stockItems.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matches =
      item.productName.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.subCategory.toLowerCase().includes(query) ||
      item.color.toLowerCase().includes(query) ||
      item.size.toLowerCase().includes(query);

    if (searchQuery && matches) {
      console.log("HomeScreen - filteredStockItems - Item matches search:", {
        query,
        item: item.productName,
        color: item.color,
        size: item.size,
      });
    }

    return matches;
  });

  // Sort stock items
  // Sort stock items with enhanced color sorting
  const sortedStockItems = [...filteredStockItems].sort((a, b) => {
    if (!sortBy) return 0;

    const valueA = a[sortBy];
    const valueB = b[sortBy];

    // Special handling for color sorting
    if (sortBy === "color") {
      console.log("HomeScreen - sortedStockItems - Sorting by color:", {
        valueA,
        valueB,
        sortOrder,
      });

      // Define a color order if you want specific color ordering
      const colorOrder = [
        "blanc",
        "noir",
        "gris",
        "rouge",
        "rose",
        "orange",
        "jaune",
        "vert",
        "bleu",
        "violet",
        "marron",
        "beige",
      ];

      const indexA = colorOrder.findIndex(
        (color) => color.toLowerCase() === valueA.toString().toLowerCase()
      );
      const indexB = colorOrder.findIndex(
        (color) => color.toLowerCase() === valueB.toString().toLowerCase()
      );

      // If both colors are in the predefined order, sort by that order
      if (indexA !== -1 && indexB !== -1) {
        return sortOrder === "asc" ? indexA - indexB : indexB - indexA;
      }

      // If one or both colors are not in predefined order, fall back to alphabetical
      const colorA = valueA.toString().toLowerCase();
      const colorB = valueB.toString().toLowerCase();
      return sortOrder === "asc"
        ? colorA.localeCompare(colorB)
        : colorB.localeCompare(colorA);
    }

    // Regular sorting for other fields
    if (typeof valueA === "string" && typeof valueB === "string") {
      return sortOrder === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    // For numeric values
    if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
    if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = useCallback(
    (column: keyof StockDisplayItem) => {
      console.log("HomeScreen - handleSort - Column clicked:", column);
      console.log("HomeScreen - handleSort - Current sort:", {
        sortBy,
        sortOrder,
      });

      if (sortBy === column) {
        // Toggle sort order if same column clicked
        const newOrder = sortOrder === "asc" ? "desc" : "asc";
        console.log("HomeScreen - handleSort - Toggling order to:", newOrder);
        setSortOrder(newOrder);
      } else {
        // New column, default to ascending
        console.log("HomeScreen - handleSort - New column, setting to asc");
        setSortBy(column);
        setSortOrder("asc");
      }
    },
    [sortBy, sortOrder]
  );

  // Menu toggle with useCallback to prevent re-renders
  const toggleMenu = useCallback(() => {
    console.log("HomeScreen - toggleMenu - Current visibility:", menuVisible);
    setMenuVisible((prev) => !prev);
  }, [menuVisible]);

  const menuTranslateY = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
  });

  // Navigation function with useCallback to prevent re-renders
  const navigateTo = useCallback(
    (screen: keyof RootStackParamList) => {
      console.log("HomeScreen - navigateTo - Screen:", screen);
      // First hide the menu
      setMenuVisible(false);

      // Use a timeout to ensure state update completes before navigation
      setTimeout(() => {
        console.log("HomeScreen - navigateTo - Navigating to:", screen);
        navigation.navigate(screen);
      }, 300); // Match animation duration
    },
    [navigation]
  );

  const handleItemPress = useCallback((item: StockDisplayItem) => {
    console.log("HomeScreen - handleItemPress - Item selected:", {
      displayId: item._id,
      productId: item.productId,
      stockId: item.stockId,
      productName: item.productName,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
    });
    setSelectedItem(item);
    setItemDetailVisible(true);
  }, []);

  const getStatusColor = useCallback((quantity: number) => {
    if (quantity <= 0) return theme.colors.error;
    if (quantity <= 5) return "#FFA500"; // Orange for low stock
    return theme.colors.success;
  }, []);

  // Handle stock update with enhanced error handling and barcode support
  const handleStockUpdate = useCallback(async () => {
    console.log("HomeScreen - handleStockUpdate - Starting stock update");
    console.log(
      "HomeScreen - handleStockUpdate - Selected item:",
      selectedItem
    );
    console.log(
      "HomeScreen - handleStockUpdate - Quantity input:",
      quantityInput
    );
    console.log(
      "HomeScreen - handleStockUpdate - Update action:",
      updateAction
    );

    if (!selectedItem || !quantityInput.trim()) {
      console.log(
        "HomeScreen - handleStockUpdate - Missing selected item or quantity"
      );
      Alert.alert("Erreur", "Veuillez entrer une quantité valide");
      return;
    }

    const quantity = parseInt(quantityInput);
    console.log("HomeScreen - handleStockUpdate - Parsed quantity:", quantity);

    if (isNaN(quantity) || quantity < 0) {
      console.log("HomeScreen - handleStockUpdate - Invalid quantity");
      Alert.alert("Erreur", "Veuillez entrer un nombre positif ou zéro");
      return;
    }

    // For remove action, ensure we don't go below 0
    if (updateAction === "remove" && quantity > selectedItem.quantity) {
      console.log("HomeScreen - handleStockUpdate - Insufficient stock");
      Alert.alert(
        "Erreur",
        `Impossible de retirer ${quantity} articles. Stock disponible: ${selectedItem.quantity}`
      );
      return;
    }

    setUpdatingStock(true);
    console.log("HomeScreen - handleStockUpdate - Update started");

    try {
      console.log(
        "HomeScreen - handleStockUpdate - Calling API with stock ID:",
        selectedItem.stockId
      );
      console.log("HomeScreen - handleStockUpdate - API parameters:", {
        stockId: selectedItem.stockId,
        quantityChange: quantity,
        action: updateAction,
      });

      const response = await updateProductStock(selectedItem.stockId, {
        quantityChange: quantity,
        action: updateAction,
      });

      console.log("HomeScreen - handleStockUpdate - API Response:", response);
      console.log(
        "HomeScreen - handleStockUpdate - Response data:",
        response.data
      );

      if (response.data.success) {
        console.log("HomeScreen - handleStockUpdate - Update successful");

        // Calculate new quantity for display
        let newQuantity = selectedItem.quantity;
        switch (updateAction) {
          case "add":
            newQuantity = selectedItem.quantity + quantity;
            break;
          case "remove":
            newQuantity = selectedItem.quantity - quantity;
            break;
          case "update":
            newQuantity = quantity; // Direct replacement
            break;
        }

        Alert.alert(
          "Succès",
          `Stock ${
            updateAction === "add"
              ? "ajouté"
              : updateAction === "update"
              ? "mis à jour"
              : "retiré"
          } avec succès!\n\n` +
            `Produit: ${selectedItem.productName}\n` +
            `Couleur: ${selectedItem.color} | Taille: ${selectedItem.size}\n` +
            `${
              updateAction === "update"
                ? `Nouvelle quantité: ${quantity}`
                : `Quantité ${
                    updateAction === "add" ? "ajoutée" : "retirée"
                  }: ${quantity}`
            }\n` +
            `Stock précédent: ${selectedItem.quantity}\n` +
            `Nouveau stock: ${newQuantity}`,
          [
            {
              text: "OK",
              onPress: () => {
                console.log(
                  "HomeScreen - handleStockUpdate - Closing modals and refreshing"
                );
                setStockUpdateModalVisible(false);
                setItemDetailVisible(false);
                setQuantityInput("");
                // Refresh data to show updated stock
                fetchData();
              },
            },
          ]
        );
      } else {
        console.log(
          "HomeScreen - handleStockUpdate - API returned failure:",
          response.data.message
        );
        throw new Error(
          response.data.message || "Erreur lors de la mise à jour"
        );
      }
    } catch (error: any) {
      console.error("HomeScreen - handleStockUpdate - Error:", error);
      console.error(
        "HomeScreen - handleStockUpdate - Error response:",
        error.response?.data
      );
      console.error(
        "HomeScreen - handleStockUpdate - Error status:",
        error.response?.status
      );

      let errorMessage = "Erreur lors de la mise à jour du stock";

      // Enhanced error handling for specific cases
      if (error.response?.status === 400) {
        if (error.response.data.message?.includes("barcode")) {
          errorMessage =
            "Erreur de validation du produit. Le produit sera mis à jour automatiquement.";
          console.log(
            "HomeScreen - handleStockUpdate - Barcode validation error, will refresh data"
          );
          // Still refresh data as the update might have worked despite validation error
          setTimeout(() => {
            fetchData();
          }, 1000);
        } else {
          errorMessage = error.response.data.message || "Données invalides";
        }
      } else if (error.response?.status === 404) {
        errorMessage = `Stock non trouvé. Le produit a peut-être été modifié ou supprimé.`;
      } else if (error.response?.status === 500) {
        if (error.response.data.message?.includes("barcode")) {
          errorMessage =
            "Mise à jour du stock effectuée malgré une erreur de validation.";
          console.log(
            "HomeScreen - handleStockUpdate - Server validation error, but update likely succeeded"
          );
          // Refresh data to see if update actually worked
          setTimeout(() => {
            fetchData();
          }, 1000);
        } else {
          errorMessage = error.response.data.message || "Erreur serveur";
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.log(
        "HomeScreen - handleStockUpdate - Final error message:",
        errorMessage
      );
      Alert.alert("Erreur", errorMessage);
    } finally {
      console.log("HomeScreen - handleStockUpdate - Update completed");
      setUpdatingStock(false);
    }
  }, [selectedItem, quantityInput, updateAction, fetchData]);

  const renderStockItem = useCallback(
    ({ item }: { item: StockDisplayItem }) => {
      const colorObj = productColors.find(
        (c) => c.name.toLowerCase() === item.color.toLowerCase()
      );

      return (
        <TouchableOpacity
          style={styles.stockItem}
          onPress={() => handleItemPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.stockInfo}>
            <Text style={styles.productName}>{item.productName}</Text>
            <View style={styles.stockDetails}>
              <View style={styles.stockProperty}>
                <Text style={styles.propertyLabel}>Catégorie:</Text>
                <Text style={styles.propertyValue}>{item.category}</Text>
              </View>
              <View style={styles.stockProperty}>
                <Text style={styles.propertyLabel}>Sous-cat:</Text>
                <Text style={styles.propertyValue}>{item.subCategory}</Text>
              </View>
            </View>
            <View style={styles.stockDetails}>
              <View style={styles.stockProperty}>
                <Text style={styles.propertyLabel}>Couleur:</Text>
                <View style={styles.colorContainer}>
                  <Text style={styles.propertyValue}>{item.color}</Text>
                  <View
                    style={[
                      styles.colorCircle,
                      { backgroundColor: colorObj?.value || "#ccc" },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.stockProperty}>
                <Text style={styles.propertyLabel}>Taille:</Text>
                <Text style={styles.propertyValue}>{item.size}</Text>
              </View>
              <View style={styles.stockProperty}>
                <Text style={styles.propertyLabel}>Prix:</Text>
                <Text style={styles.propertyValue}>{item.price}TND</Text>
              </View>
            </View>
          </View>

          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantité</Text>
            <Text
              style={[
                styles.quantity,
                { color: getStatusColor(item.quantity) },
              ]}
            >
              {item.quantity}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handleItemPress, getStatusColor]
  );

  // Open stock update modal with specific action
  const openStockUpdateModal = useCallback(
    (action: "add" | "remove" | "update") => {
      console.log("HomeScreen - openStockUpdateModal - Action:", action);
      setUpdateAction(action);
      setQuantityInput("");
      setItemDetailVisible(false);
      setStockUpdateModalVisible(true);
    },
    []
  );

  console.log("HomeScreen - Render - Current state:", {
    loading,
    error,
    stockItemsCount: stockItems.length,
    filteredItemsCount: filteredStockItems.length,
    sortedItemsCount: sortedStockItems.length,
    searchQuery,
    sortBy,
    sortOrder,
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="home-outline" size={24} color={theme.colors.primary} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Inventaire Stoky</Text>
          <Text style={styles.subtitle}>
            {sortedStockItems.length} produits en stock
          </Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color={theme.colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un produit..."
          value={searchQuery}
          onChangeText={(text) => {
            console.log("HomeScreen - Search query changed:", text);
            setSearchQuery(text);
          }}
          placeholderTextColor={theme.colors.textSecondary}
        />
        {searchQuery ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              console.log("HomeScreen - Clearing search query");
              setSearchQuery("");
            }}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Trier par:</Text>
        <View style={styles.sortOptions}>
          <TouchableOpacity
            style={[
              styles.sortOption,
              sortBy === "productName" && styles.sortOptionActive,
            ]}
            onPress={() => handleSort("productName")}
          >
            <Text
              style={[
                styles.sortOptionText,
                sortBy === "productName" && styles.sortOptionTextActive,
              ]}
            >
              Nom{" "}
              {sortBy === "productName" && (sortOrder === "asc" ? "↑" : "↓")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortOption,
              sortBy === "category" && styles.sortOptionActive,
            ]}
            onPress={() => handleSort("category")}
          >
            <Text
              style={[
                styles.sortOptionText,
                sortBy === "category" && styles.sortOptionTextActive,
              ]}
            >
              Catégorie{" "}
              {sortBy === "category" && (sortOrder === "asc" ? "↑" : "↓")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortOption,
              sortBy === "color" && styles.sortOptionActive,
            ]}
            onPress={() => handleSort("color")}
          >
            <Text
              style={[
                styles.sortOptionText,
                sortBy === "color" && styles.sortOptionTextActive,
              ]}
            >
              Couleur {sortBy === "color" && (sortOrder === "asc" ? "↑" : "↓")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortOption,
              sortBy === "quantity" && styles.sortOptionActive,
            ]}
            onPress={() => handleSort("quantity")}
          >
            <Text
              style={[
                styles.sortOptionText,
                sortBy === "quantity" && styles.sortOptionTextActive,
              ]}
            >
              Quantité{" "}
              {sortBy === "quantity" && (sortOrder === "asc" ? "↑" : "↓")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement de l'inventaire...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={theme.colors.error}
          />
          <Text style={styles.errorText}>Erreur: {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              console.log("HomeScreen - Retry button pressed");
              fetchData();
            }}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : sortedStockItems.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons
            name="cube-outline"
            size={48}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.emptyText}>Aucun produit trouvé</Text>
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => {
                console.log("HomeScreen - Clear search from empty state");
                setSearchQuery("");
              }}
            >
              <Text style={styles.clearSearchText}>Effacer la recherche</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.emptySubText}>
              Ajoutez des produits pour les voir listés ici
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={sortedStockItems}
          renderItem={renderStockItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}

      {/* Floating menu button */}
      <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
        <Ionicons name="menu" size={28} color={theme.colors.white} />
      </TouchableOpacity>

      {/* Animated floating menu */}
      {menuVisible && (
        <Animated.View
          style={[
            styles.menuContainer,
            {
              transform: [{ translateY: menuTranslateY }],
              width: width > 400 ? 320 : width * 0.85,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigateTo("AddProduct")}
          >
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.menuText}>Ajouter un produit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigateTo("BarcodeScannerScreen")}
          >
            <Ionicons
              name="barcode-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.menuText}>Scanner un code-barres</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigateTo("SellStockScreen")}
          >
            <Ionicons
              name="cart-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.menuText}>Vendre un article</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigateTo("ReturnStockScreen")}
          >
            <Ionicons
              name="return-down-back-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.menuText}>Retour d'un article</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigateTo("AnalyticsScreen")}
          >
            <Ionicons
              name="stats-chart-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.menuText}>Statistiques</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigateTo("AddCategory")}
          >
            <Ionicons
              name="folder-open-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.menuText}>Gérer les catégories</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Item Detail Modal */}
      <Modal
        visible={itemDetailVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          console.log("HomeScreen - Item detail modal closed");
          setItemDetailVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          {selectedItem && (
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedItem.productName}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    console.log("HomeScreen - Close item detail modal");
                    setItemDetailVisible(false);
                  }}
                >
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Catégorie:</Text>
                <Text style={styles.detailValue}>{selectedItem.category}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sous-catégorie:</Text>
                <Text style={styles.detailValue}>
                  {selectedItem.subCategory}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Couleur:</Text>
                <View style={styles.colorDetailContainer}>
                  <Text style={styles.detailValue}>{selectedItem.color}</Text>
                  <View
                    style={[
                      styles.colorDetailCircle,
                      {
                        backgroundColor:
                          productColors.find(
                            (c) =>
                              c.name.toLowerCase() ===
                              selectedItem.color.toLowerCase()
                          )?.value || "#ccc",
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Taille:</Text>
                <Text style={styles.detailValue}>{selectedItem.size}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantité:</Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: getStatusColor(selectedItem.quantity) },
                  ]}
                >
                  {selectedItem.quantity}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Prix:</Text>
                <Text style={styles.detailValue}>{selectedItem.price}TND</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Stock ID:</Text>
                <Text style={[styles.detailValue, styles.stockIdText]}>
                  {selectedItem.stockId}
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.addButton]}
                  onPress={() => {
                    console.log("HomeScreen - Add stock button pressed");
                    openStockUpdateModal("add");
                  }}
                >
                  <Ionicons
                    name="add-outline"
                    size={20}
                    color={theme.colors.white}
                  />
                  <Text style={styles.actionButtonText}>Ajouter</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.updateButton]}
                  onPress={() => {
                    console.log("HomeScreen - Update stock button pressed");
                    openStockUpdateModal("update");
                  }}
                >
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={theme.colors.white}
                  />
                  <Text style={styles.actionButtonText}>Modifier</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.removeButton]}
                  onPress={() => {
                    console.log("HomeScreen - Remove stock button pressed");
                    openStockUpdateModal("remove");
                  }}
                >
                  <Ionicons
                    name="remove-outline"
                    size={20}
                    color={theme.colors.white}
                  />
                  <Text style={styles.actionButtonText}>Retirer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Stock Update Modal */}
      <Modal
        visible={stockUpdateModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          console.log("HomeScreen - Stock update modal closed");
          setStockUpdateModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {updateAction === "add"
                  ? "Ajouter du stock"
                  : updateAction === "update"
                  ? "Modifier la quantité"
                  : "Retirer du stock"}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  console.log("HomeScreen - Close stock update modal");
                  setStockUpdateModalVisible(false);
                }}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <>
                <View style={styles.productInfo}>
                  <Text style={styles.productInfoText}>
                    {selectedItem.productName} - {selectedItem.color} -{" "}
                    {selectedItem.size}
                  </Text>
                  <Text style={styles.currentStockText}>
                    Stock actuel: {selectedItem.quantity}
                  </Text>
                  <Text style={styles.stockIdText}>
                    Stock ID: {selectedItem.stockId}
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {updateAction === "update"
                      ? "Nouvelle quantité:"
                      : `Quantité à ${
                          updateAction === "add" ? "ajouter" : "retirer"
                        }:`}
                  </Text>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantityInput}
                    onChangeText={(text) => {
                      console.log("HomeScreen - Quantity input changed:", text);
                      setQuantityInput(text);
                    }}
                    placeholder="Entrez la quantité"
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>

                <View style={styles.modalActionButtons}>
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.cancelButton]}
                    onPress={() => {
                      console.log("HomeScreen - Cancel stock update");
                      setStockUpdateModalVisible(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalActionButton,
                      updateAction === "add"
                        ? styles.addButton
                        : updateAction === "update"
                        ? styles.updateButton
                        : styles.removeButton,
                      updatingStock && styles.disabledButton,
                    ]}
                    onPress={() => {
                      console.log("HomeScreen - Confirm stock update");
                      handleStockUpdate();
                    }}
                    disabled={updatingStock}
                  >
                    {updatingStock ? (
                      <ActivityIndicator
                        size="small"
                        color={theme.colors.white}
                      />
                    ) : (
                      <Text style={styles.actionButtonText}>
                        {updateAction === "add"
                          ? "Ajouter"
                          : updateAction === "update"
                          ? "Modifier"
                          : "Retirer"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.colors.text,
  },
  clearButton: {
    padding: 4,
  },
  sortContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sortLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  sortOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.lightGrey,
    marginRight: 8,
    marginBottom: 8,
  },
  sortOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  sortOptionText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  sortOptionTextActive: {
    color: theme.colors.white,
    fontWeight: "bold",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  errorText: {
    marginTop: 12,
    color: theme.colors.error,
    textAlign: "center",
    fontSize: 16,
    paddingHorizontal: 24,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontWeight: "bold",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  clearSearchText: {
    marginTop: 8,
    color: theme.colors.primary,
    fontWeight: "500",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  stockItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
    padding: 12,
    borderRadius: 10,
    backgroundColor: theme.colors.white,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  stockInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 4,
  },
  stockDetails: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 4,
  },
  stockProperty: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 4,
  },
  propertyLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginRight: 4,
  },
  propertyValue: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: "500",
  },
  colorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginLeft: 4,
  },
  quantityContainer: {
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.lightGrey,
  },
  quantityLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  quantity: {
    fontSize: 18,
    fontWeight: "bold",
  },
  menuButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  menuContainer: {
    position: "absolute",
    bottom: 80,
    right: 16,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuText: {
    marginLeft: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 16,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.primary,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.text,
  },
  colorDetailContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorDetailCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  addButton: {
    backgroundColor: theme.colors.success,
  },
  updateButton: {
    backgroundColor: theme.colors.primary,
  },
  removeButton: {
    backgroundColor: theme.colors.error,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontWeight: "bold",
    marginLeft: 4,
    fontSize: 14,
  },
  // Stock update modal styles
  productInfo: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: theme.colors.lightGrey,
    borderRadius: 8,
  },
  productInfoText: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 4,
  },
  currentStockText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  stockIdText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 8,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.white,
  },
  modalActionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: theme.colors.lightGrey,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
});
