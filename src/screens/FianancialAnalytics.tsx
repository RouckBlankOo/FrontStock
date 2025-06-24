import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Example data for current month and previous months (by week)
const financeDataCurrent = {
  labels: ["S1", "S2", "S3", "S4"],
  datasets: [
    {
      data: [6500, 7200, 6900, 7400],
      color: (opacity = 1) => `rgba(7, 186, 209, ${opacity})`,
      strokeWidth: 3,
    },
  ],
  legend: ["Revenus Mensuels (par semaine)"],
};

const financeDataHistory = [
  {
    month: "Avril",
    data: [6000, 6700, 6300, 7000],
  },
  {
    month: "Mars",
    data: [5800, 6400, 6100, 6900],
  },
  {
    month: "Février",
    data: [5600, 6200, 5900, 6700],
  },
];

const FianancialAnalytics = () => {
  const navigation = useNavigation();
  const [showHistory, setShowHistory] = useState(false);

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
          <Text style={styles.title}>Analyse Financière</Text>
          <TouchableOpacity
            style={styles.historiqueButton}
            onPress={() => setShowHistory((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="time-outline"
              size={18}
              color={theme.colors.primary}
            />
            <Text style={styles.historiqueText}>
              {showHistory ? "Masquer l'historique" : "Historique"}
            </Text>
          </TouchableOpacity>
          {showHistory ? (
            <ScrollView style={{ width: "100%" }}>
              {financeDataHistory.map((monthData, idx) => (
                <View key={monthData.month} style={styles.lineChartCard}>
                  <Text style={styles.historyWeek}>{monthData.month}</Text>
                  <LineChart
                    data={{
                      labels: ["S1", "S2", "S3", "S4"],
                      datasets: [
                        {
                          data: monthData.data,
                          color: (opacity = 1) =>
                            `rgba(7, 186, 209, ${opacity})`,
                          strokeWidth: 3,
                        },
                      ],
                      legend: [monthData.month],
                    }}
                    width={SCREEN_WIDTH - 32}
                    height={220}
                    yAxisLabel="TND"
                    yAxisSuffix=""
                    yAxisInterval={1}
                    chartConfig={{
                      backgroundColor: "#fff",
                      backgroundGradientFrom: "#f7f9fa",
                      backgroundGradientTo: "#e3e8ee",
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(7, 186, 209, ${opacity})`,
                      labelColor: (opacity = 1) =>
                        `rgba(44, 62, 80, ${opacity})`,
                      style: {
                        borderRadius: 16,
                      },
                      propsForDots: {
                        r: "6",
                        strokeWidth: "2",
                        stroke: "#07BAD1",
                      },
                    }}
                    bezier
                    style={{
                      marginVertical: 8,
                      borderRadius: 16,
                    }}
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.lineChartCard}>
              <LineChart
                data={financeDataCurrent}
                width={SCREEN_WIDTH - 32}
                height={260}
                yAxisLabel="TND"
                yAxisSuffix=""
                yAxisInterval={1}
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#f7f9fa",
                  backgroundGradientTo: "#e3e8ee",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(7, 186, 209, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: "#07BAD1",
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>
          )}
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
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 18,
    color: theme.colors.primary,
    letterSpacing: 0.5,
    marginTop: 40,
    textAlign: "center",
  },
  historiqueButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 12,
    backgroundColor: "#f0f4fa",
    borderRadius: 16,
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
  historiqueText: {
    color: theme.colors.primary,
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
  },
  historyWeek: {
    fontWeight: "bold",
    color: theme.colors.primary,
    fontSize: 16,
    marginBottom: 4,
    marginLeft: 8,
  },
  lineChartCard: {
    width: "98%",
    maxWidth: 420,
    borderRadius: 18,
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 16,
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
  footerText: {
    marginTop: 24,
    color: "#bbb",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    letterSpacing: 0.1,
  },
});

export default FianancialAnalytics;
