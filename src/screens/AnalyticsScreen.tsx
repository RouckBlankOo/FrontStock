import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { PieChart, BarChart } from "react-native-chart-kit";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../constants/theme";
import {
  getInventory,
  getTotalProducts,
  getTotalStocks,
  getTotalPrices,
  getProducts,
  InventoryItem,
} from "../services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface StockAnalysis {
  inStock: number;
  outOfStock: number;
  lowStock: number;
  totalValue: number;
  totalProducts: number;
  totalQuantity: number;
}

interface CategoryAnalysis {
  name: string;
  quantity: number;
  value: number;
  color: string;
  percentage: number;
}

const STOCK_COLORS = {
  inStock: "#4CAF50",
  outOfStock: "#F44336",
  lowStock: "#FF9800",
};

const COLOR_PALETTE = [
  "#4CAF50",
  "#2196F3",
  "#FF9800",
  "#9C27B0",
  "#00BCD4",
  "#795548",
  "#FF5722",
  "#3F51B5",
];

const LOW_STOCK_THRESHOLD = 5;

// Safe number extraction function
const safeNumber = (value: any): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  if (typeof value === "object" && value !== null) {
    // Handle cases where API returns {total: number} or similar
    if (value.total !== undefined) return safeNumber(value.total);
    if (value.count !== undefined) return safeNumber(value.count);
    if (value.value !== undefined) return safeNumber(value.value);
  }
  return 0;
};

// Safe string extraction function
const safeString = (value: any): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }
  return "";
};

const AnalyticsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stockAnalysis, setStockAnalysis] = useState<StockAnalysis | null>(
    null
  );
  const [categoryData, setCategoryData] = useState<CategoryAnalysis[]>([]);
  const [selectedView, setSelectedView] = useState<"overview" | "categories">(
    "overview"
  );
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const loadAnalyticsData = useCallback(async () => {
    try {
      setError(null);
      console.log("Starting analytics data load...");

      // Get basic stats with safe handling
      const statsPromises = [
        getTotalProducts().catch((err) => {
          console.log("getTotalProducts failed:", err);
          return { data: { data: 0 } };
        }),
        getTotalStocks().catch((err) => {
          console.log("getTotalStocks failed:", err);
          return { data: { data: 0 } };
        }),
        getTotalPrices().catch((err) => {
          console.log("getTotalPrices failed:", err);
          return { data: { data: 0 } };
        }),
      ];

      const [totalProductsRes, totalStocksRes, totalPricesRes] =
        await Promise.all(statsPromises);

      console.log("API Responses:", {
        totalProducts: totalProductsRes.data,
        totalStocks: totalStocksRes.data,
        totalPrices: totalPricesRes.data,
      });

      // Get inventory data
      let inventory: InventoryItem[] = [];
      try {
        console.log("Fetching inventory...");
        const inventoryResponse = await getInventory();
        console.log("Inventory response:", inventoryResponse.data);
        inventory = Array.isArray(inventoryResponse.data.data)
          ? inventoryResponse.data.data
          : [];
      } catch (inventoryError) {
        console.log("Inventory API not available, trying products API");
        try {
          const productsResponse = await getProducts({ limit: 100 });
          console.log("Products response:", productsResponse.data);
          const products = productsResponse.data.data?.products || [];
          inventory = convertProductsToInventory(products);
        } catch (productsError) {
          console.log("Products API also failed:", productsError);
          inventory = [];
        }
      }

      console.log("Final inventory:", inventory);

      // Calculate analysis with safe number extraction
      const analysis = calculateStockAnalysis(
        inventory,
        safeNumber(totalProductsRes.data?.data),
        safeNumber(totalStocksRes.data?.data),
        safeNumber(totalPricesRes.data?.data)
      );

      console.log("Calculated analysis:", analysis);
      setStockAnalysis(analysis);

      // Calculate category analysis
      const categoryAnalysis = calculateCategoryAnalysis(inventory);
      console.log("Category analysis:", categoryAnalysis);
      setCategoryData(categoryAnalysis);

      setLastUpdated(new Date().toLocaleString("fr-FR"));
    } catch (error: any) {
      console.error("Error loading analytics data:", error);
      setError("Impossible de charger certaines données");

      // Set safe default values
      setStockAnalysis({
        inStock: 0,
        outOfStock: 0,
        lowStock: 0,
        totalValue: 0,
        totalProducts: 0,
        totalQuantity: 0,
      });
      setCategoryData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const convertProductsToInventory = (products: any[]): InventoryItem[] => {
    if (!Array.isArray(products)) return [];

    const inventory: InventoryItem[] = [];

    products.forEach((product) => {
      if (product && product.stocks && Array.isArray(product.stocks)) {
        product.stocks.forEach((stock: any) => {
          inventory.push({
            productId: safeString(product._id),
            productName: safeString(product.name || "Produit sans nom"),
            category: safeString(product.category || "Non catégorisé"),
            subCategory: safeString(
              product.subCategory || "Non sous-catégorisé"
            ),
            color: safeString(stock.color || "Non spécifié"),
            size: safeString(stock.size || "Non spécifié"),
            quantity: safeNumber(stock.quantity),
            price: safeNumber(product.price),
          });
        });
      }
    });

    return inventory;
  };

  const calculateStockAnalysis = (
    inventory: InventoryItem[],
    totalProducts: number,
    totalStocks: number,
    totalPrices: number
  ): StockAnalysis => {
    let inStock = 0;
    let outOfStock = 0;
    let lowStock = 0;
    let calculatedValue = 0;
    let calculatedQuantity = 0;

    if (Array.isArray(inventory)) {
      inventory.forEach((item) => {
        const quantity = safeNumber(item.quantity);
        const price = safeNumber(item.price);

        calculatedQuantity += quantity;
        calculatedValue += quantity * price;

        if (quantity === 0) {
          outOfStock++;
        } else if (quantity <= LOW_STOCK_THRESHOLD) {
          lowStock++;
        } else {
          inStock++;
        }
      });
    }

    return {
      inStock: Math.max(0, inStock),
      outOfStock: Math.max(0, outOfStock),
      lowStock: Math.max(0, lowStock),
      totalValue: Math.max(0, totalPrices || calculatedValue),
      totalProducts: Math.max(0, totalProducts || inventory.length),
      totalQuantity: Math.max(0, totalStocks || calculatedQuantity),
    };
  };

  const calculateCategoryAnalysis = (
    inventory: InventoryItem[]
  ): CategoryAnalysis[] => {
    if (!Array.isArray(inventory) || inventory.length === 0) return [];

    const categoryMap = new Map<string, { quantity: number; value: number }>();

    inventory.forEach((item) => {
      const categoryName = safeString(item.category) || "Non catégorisé";
      const quantity = safeNumber(item.quantity);
      const price = safeNumber(item.price);

      const current = categoryMap.get(categoryName) || {
        quantity: 0,
        value: 0,
      };
      categoryMap.set(categoryName, {
        quantity: current.quantity + quantity,
        value: current.value + quantity * price,
      });
    });

    const totalQuantity = Array.from(categoryMap.values()).reduce(
      (sum, cat) => sum + cat.quantity,
      0
    );

    return Array.from(categoryMap.entries()).map(([name, data], index) => ({
      name: name || "Catégorie inconnue",
      quantity: Math.max(0, data.quantity),
      value: Math.max(0, data.value),
      color: COLOR_PALETTE[index % COLOR_PALETTE.length],
      percentage: totalQuantity > 0 ? (data.quantity / totalQuantity) * 100 : 0,
    }));
  };

  const formatNumber = (value: any): string => {
    const num = safeNumber(value);
    return num.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
  };

  const formatCurrency = (value: any): string => {
    const num = safeNumber(value);
    return `${num.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} TND`;
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const renderStockDistributionChart = () => {
    if (!stockAnalysis) return null;

    const data = [
      {
        name: "En stock",
        population: stockAnalysis.inStock,
        color: STOCK_COLORS.inStock,
        legendFontColor: STOCK_COLORS.inStock,
        legendFontSize: 14,
      },
      {
        name: "Rupture de stock",
        population: stockAnalysis.outOfStock,
        color: STOCK_COLORS.outOfStock,
        legendFontColor: STOCK_COLORS.outOfStock,
        legendFontSize: 14,
      },
      {
        name: "Stock faible",
        population: stockAnalysis.lowStock,
        color: STOCK_COLORS.lowStock,
        legendFontColor: STOCK_COLORS.lowStock,
        legendFontSize: 14,
      },
    ].filter((item) => item.population > 0);

    if (data.length === 0) {
      return (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Distribution du Stock</Text>
          <View style={styles.noDataContainer}>
            <Ionicons name="analytics-outline" size={64} color="#ddd" />
            <Text style={styles.noDataText}>Aucune donnée disponible</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Distribution du Stock</Text>
        <View style={styles.chartContainer}>
          <PieChart
            data={data}
            width={SCREEN_WIDTH - 60}
            height={250}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total des produits:</Text>
            <Text style={styles.summaryValue}>
              {formatNumber(stockAnalysis.totalProducts)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Quantité totale:</Text>
            <Text style={styles.summaryValue}>
              {formatNumber(stockAnalysis.totalQuantity)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Valeur totale:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(stockAnalysis.totalValue)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCategoryChart = () => {
    if (!Array.isArray(categoryData) || categoryData.length === 0) {
      return (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Répartition par Catégorie</Text>
          <View style={styles.noDataContainer}>
            <Ionicons name="pie-chart-outline" size={64} color="#ddd" />
            <Text style={styles.noDataText}>Aucune catégorie trouvée</Text>
          </View>
        </View>
      );
    }

    const chartData = categoryData.map((category) => {
      const name = safeString(category.name);
      return {
        name: name.length > 12 ? name.substring(0, 12) + "..." : name,
        population: safeNumber(category.quantity),
        color: category.color || "#999",
        legendFontColor: category.color || "#999",
        legendFontSize: 12,
      };
    });

    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Répartition par Catégorie</Text>
        <View style={styles.chartContainer}>
          <PieChart
            data={chartData}
            width={SCREEN_WIDTH - 60}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>

        {/* Category Details */}
        <View style={styles.categoryDetails}>
          {categoryData.map((category, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryRow}>
                <View
                  style={[
                    styles.categoryColor,
                    { backgroundColor: category.color || "#999" },
                  ]}
                />
                <Text style={styles.categoryName}>
                  {safeString(category.name)}
                </Text>
                <Text style={styles.categoryPercentage}>
                  {safeNumber(category.percentage).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.categoryStats}>
                <Text style={styles.categoryQuantity}>
                  Quantité: {formatNumber(category.quantity)}
                </Text>
                <Text style={styles.categoryValue}>
                  Valeur: {formatCurrency(category.value)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderViewSelector = () => (
    <View style={styles.viewSelector}>
      <TouchableOpacity
        style={[
          styles.viewButton,
          selectedView === "overview" && styles.viewButtonActive,
        ]}
        onPress={() => setSelectedView("overview")}
      >
        <Ionicons
          name="analytics-outline"
          size={22}
          color={selectedView === "overview" ? "#fff" : theme.colors.primary}
        />
        <Text
          style={[
            styles.viewButtonText,
            selectedView === "overview" && styles.viewButtonTextActive,
          ]}
        >
          Distribution du Stock
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.viewButton,
          selectedView === "categories" && styles.viewButtonActive,
        ]}
        onPress={() => setSelectedView("categories")}
      >
        <Ionicons
          name="pie-chart-outline"
          size={22}
          color={selectedView === "categories" ? "#fff" : theme.colors.primary}
        />
        <Text
          style={[
            styles.viewButtonText,
            selectedView === "categories" && styles.viewButtonTextActive,
          ]}
        >
          Analyse par Catégorie
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={["#f8fafc", "#e2e8f0", "#f8fafc"]}
        style={styles.gradientBg}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Analyse en cours...</Text>
            <Text style={styles.loadingSubtext}>Chargement des données</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#f8fafc", "#e2e8f0", "#f8fafc"]}
      style={styles.gradientBg}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Analyse du Stock</Text>
            <Text style={styles.subtitle}>Visualisation des données</Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            activeOpacity={0.6}
            disabled={refreshing}
          >
            <Ionicons
              name="refresh"
              size={20}
              color={refreshing ? "#ccc" : theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={20} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* View Selector */}
          {renderViewSelector()}

          {/* Charts based on selected view */}
          {selectedView === "overview"
            ? renderStockDistributionChart()
            : renderCategoryChart()}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Dernière mise à jour</Text>
            <Text style={styles.footerDate}>{lastUpdated}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
  },
  backButton: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  refreshButton: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#F44336",
  },
  errorText: {
    marginLeft: 8,
    color: "#B91C1C",
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.primary,
    textAlign: "center",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  viewSelector: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 6,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  viewButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  viewButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  viewButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  viewButtonTextActive: {
    color: "#fff",
  },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
      },
      android: {
        elevation: 10,
      },
    }),
  },
  chartTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 24,
    textAlign: "center",
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  noDataContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  noDataText: {
    marginTop: 20,
    fontSize: 18,
    color: "#9ca3af",
    textAlign: "center",
  },
  summaryContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  summaryLabel: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  categoryDetails: {
    marginTop: 20,
  },
  categoryItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 16,
  },
  categoryName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  categoryPercentage: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  categoryStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 36,
    marginTop: 4,
  },
  categoryQuantity: {
    fontSize: 14,
    color: "#64748b",
  },
  categoryValue: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  footerDate: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "600",
  },
});

export default AnalyticsScreen;
