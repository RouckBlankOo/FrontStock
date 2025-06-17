import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { RootStackParamList } from "../types";
import { scanBarcode } from "../services/api";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function BarcodeScannerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<any | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    (async () => {
      if (permission) {
        setHasPermission(permission.granted);
      } else {
        const newPermission = await requestPermission();
        setHasPermission(newPermission.granted);
      }
    })();
  }, [permission, requestPermission]);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (isProcessing || scannedProduct) return;
    setIsProcessing(true);

    try {
      const response = await scanBarcode(data);
      setScannedProduct(response.data.data);
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error.message || "Échec de la récupération du produit."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleRecapture = () => {
    setScannedProduct(null);
    setIsProcessing(false);
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Demande d'autorisation de caméra...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>
          Accès interdit à la caméra. Veuillez autoriser l'accès.
        </Text>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          accessibilityLabel="Revenir"
        >
          <Text style={styles.backButtonText}>Revenir</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backIcon}
          accessibilityLabel="Revenir"
        >
          <Ionicons
            name="arrow-back-outline"
            size={28}
            color={theme.colors.white}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Scanner le produit</Text>
      </View>
      <View style={styles.cameraContainer}>
        {!scannedProduct ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              ref={cameraRef}
              facing="back"
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["code128", "code39", "code93", "codabar", "qr"],
              }}
            />
            <View style={styles.overlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanMessage}>
                {isProcessing
                  ? "Traitement en cours..."
                  : "Placez le code-barres dans le cadre"}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.capturedContainer}>
            <Text style={styles.capturedMessage}>Produit trouvé :</Text>
            <Text style={styles.productDetail}>
              Nom : {scannedProduct.name}
            </Text>
            <Text style={styles.productDetail}>
              Prix : {scannedProduct.price} €
            </Text>
            <Text style={styles.productDetail}>
              Stock :{" "}
              {scannedProduct.stocks.reduce(
                (sum: number, stock: any) => sum + stock.quantity,
                0
              )}
            </Text>
            <TouchableOpacity
              style={[styles.button, isProcessing && styles.buttonDisabled]}
              onPress={handleRecapture}
              disabled={isProcessing}
              accessibilityLabel="Reprendre"
            >
              <Text style={styles.buttonText}>Reprendre</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
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
  cameraContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: "transparent",
    marginBottom: theme.spacing.large,
  },
  scanMessage: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.subtitle,
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: theme.colors.black,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  capturedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.large,
  },
  capturedMessage: {
    fontSize: theme.fontSizes.subtitle,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.large,
    textAlign: "center",
  },
  productDetail: {
    fontSize: theme.fontSizes.regular,
    color: theme.colors.text,
    marginBottom: theme.spacing.small,
    textAlign: "center",
  },
  button: {
    ...theme.button,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    marginVertical: theme.spacing.large,
  },
  buttonDisabled: {
    opacity: theme.button.disabledOpacity,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.regular,
    fontWeight: "bold",
  },
  message: {
    fontSize: theme.fontSizes.regular,
    color: theme.colors.text,
    textAlign: "center",
    marginTop: theme.spacing.large,
  },
  backButton: {
    marginTop: theme.spacing.large,
    padding: theme.spacing.medium,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.small,
  },
  backButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.regular,
    fontWeight: "bold",
    textAlign: "center",
  },
});
