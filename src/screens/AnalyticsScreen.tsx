import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const generateDummyStockData = () => [
  {
    name: "En stock",
    population: Math.floor(Math.random() * 150) + 10,
    color: "#0088FE",
    legendFontColor: "#0088FE",
    legendFontSize: 15,
  },
  {
    name: "Rupture de stock",
    population: Math.floor(Math.random() * 150) + 10,
    color: "#FF8042",
    legendFontColor: "#FF8042",
    legendFontSize: 15,
  },
  {
    name: "Réservé",
    population: Math.floor(Math.random() * 150) + 10,
    color: "#FFBB28",
    legendFontColor: "#FFBB28",
    legendFontSize: 15,
  },
  {
    name: "Vendu",
    population: Math.floor(Math.random() * 150) + 10,
    color: "#00C49F",
    legendFontColor: "#00C49F",
    legendFontSize: 15,
  },
  {
    name: "En attente",
    population: Math.floor(Math.random() * 150) + 10,
    color: "#A020F0",
    legendFontColor: "#A020F0",
    legendFontSize: 15,
  },
  {
    name: "En transit",
    population: Math.floor(Math.random() * 150) + 10,
    color: "#FF69B4",
    legendFontColor: "#FF69B4",
    legendFontSize: 15,
  },
];

const AnalyticsScreen = () => {
  const navigation = useNavigation();
  const [stockData, setStockData] = useState(generateDummyStockData());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleRefresh = () => {
    setStockData(generateDummyStockData());
    setSelectedIndex(null);
  };

  const total = stockData.reduce((sum, item) => sum + item.population, 0);

  return (
    <LinearGradient
      colors={["#f7f9fa", "#e3e8ee", "#f7f9fa"]}
      style={styles.gradientBg}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Back Button */}
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
          <Text style={styles.title}>Analyse du Stock</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            activeOpacity={0.6}
          >
            <Ionicons name="refresh" size={18} color={theme.colors.primary} />
            <Text style={styles.refreshText}>Rafraîchir</Text>
          </TouchableOpacity>
          <View style={styles.chartCard}>
            <PieChart
              data={stockData}
              width={SCREEN_WIDTH - 32}
              height={260}
              chartConfig={{
                color: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
              }}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              absolute
            />
          </View>
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Détails du stock</Text>
            {stockData.map((item, i) => {
              const percent = ((item.population / total) * 100).toFixed(1);
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.detailRow,
                    selectedIndex === i && {
                      backgroundColor: "#f0f4fa",
                      borderRadius: 8,
                    },
                  ]}
                  onPress={() => setSelectedIndex(i)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.detailColor,
                      {
                        backgroundColor: item.color,
                        borderColor: item.color,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.detailLabel,
                      selectedIndex === i && { fontWeight: "bold" },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <View style={styles.detailValueBox}>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: item.color },
                        selectedIndex === i && { fontWeight: "bold" },
                      ]}
                    >
                      {item.population}
                    </Text>
                    <Text style={styles.percentText}>({percent}%)</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {selectedIndex !== null && (
              <View style={styles.selectedDetails}>
                <Text style={styles.selectedTitle}>
                  {stockData[selectedIndex].name}
                </Text>
                <Text style={styles.selectedInfo}>
                  Quantité: {stockData[selectedIndex].population}
                </Text>
                <Text style={styles.selectedInfo}>
                  Pourcentage:{" "}
                  {(
                    (stockData[selectedIndex].population / total) *
                    100
                  ).toFixed(1)}
                  %
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.footerText}>
            Dernière mise à jour : aujourd'hui
          </Text>
        </View>
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
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "transparent",
    paddingTop: 4,
  },
  backButton: {
    position: "absolute",
    top: Platform.select({ ios: 20, android: 10 }),
    left: 8,
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 2,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
      },
      android: { elevation: 2 },
    }),
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: theme.spacing.medium,
    color: theme.colors.primary,
    letterSpacing: 0.5,
    marginTop: theme.spacing.medium,
    textAlign: "center",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: theme.spacing.small,
    backgroundColor: "#f0f4fa",
    borderRadius: theme.borderRadius.medium,
    paddingVertical: 6,
    paddingHorizontal: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
      },
      android: { elevation: 1 },
    }),
  },
  refreshText: {
    color: theme.colors.primary,
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: theme.fontSizes.regular,
  },
  chartCard: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.medium,
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 3 },
    }),
  },
  detailsCard: {
    marginTop: theme.spacing.medium,
    width: "98%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.medium,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
    marginBottom: theme.spacing.medium,
  },
  detailsTitle: {
    fontSize: theme.fontSizes.regular + 2,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: theme.spacing.small,
    letterSpacing: 0.3,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 1,
  },
  detailColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 2,
  },
  detailLabel: {
    flex: 1,
    fontSize: theme.fontSizes.regular,
    color: theme.colors.text,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  detailValueBox: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 60,
    justifyContent: "flex-end",
  },
  detailValue: {
    fontSize: theme.fontSizes.regular + 1,
    fontWeight: "bold",
    marginRight: 4,
  },
  percentText: {
    color: "#888",
    fontWeight: "500",
    fontSize: theme.fontSizes.regular,
  },
  selectedDetails: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f0f4fa",
    borderRadius: 10,
    alignItems: "center",
  },
  selectedTitle: {
    fontWeight: "bold",
    fontSize: 18,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  selectedInfo: {
    fontSize: 15,
    color: "#333",
    marginBottom: 2,
  },
  footerText: {
    marginTop: theme.spacing.medium,
    color: "#bbb",
    fontSize: theme.fontSizes.small,
    fontStyle: "italic",
    textAlign: "center",
    letterSpacing: 0.1,
  },
});

export default AnalyticsScreen;
