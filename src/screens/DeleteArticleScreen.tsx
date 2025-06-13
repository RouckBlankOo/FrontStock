import React, { useState, useRef, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";

export default function DeleteArticleScreen() {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const buttonScale = useState(new Animated.Value(1))[0];

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
    if (isProcessing || scannedBarcode) return;
    setIsProcessing(true);
    setScannedBarcode(data);
    setIsProcessing(false);
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    // TODO: Replace with your delete logic
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert("Suppression", "Article supprimé avec succès !");
      setScannedBarcode(null);
    }, 1200);
  };

  const handleRecapture = () => {
    setScannedBarcode(null);
    setIsProcessing(false);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
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
          accessibilityLabel="Go back"
        >
          <Text style={styles.backButtonText}>Revenir</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backIcon}
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="arrow-back-outline"
              size={28}
              color={theme.colors.background}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Supprimer un article</Text>
        </View>
      </LinearGradient>

      <View style={styles.cameraContainer}>
        {!scannedBarcode ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              ref={cameraRef}
              facing="back"
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: [
                  "ean13",
                  "ean8",
                  "upc_a",
                  "upc_e",
                  "code128",
                  "code39",
                  "code93",
                  "codabar",
                  "qr",
                ],
              }}
            />
            <View style={styles.overlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanMessage}>
                {isProcessing
                  ? "Traitement en cours..."
                  : "Scannez le code-barres de l'article à supprimer"}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.capturedContainer}>
            <Text style={styles.capturedMessage}>
              Code-barres scanné : {scannedBarcode}
            </Text>
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[
                  styles.button,
                  isProcessing && styles.buttonDisabled,
                  { marginBottom: theme.spacing.medium },
                ]}
                onPress={() => {
                  animateButtonPress();
                  handleDelete();
                }}
                disabled={isProcessing}
                accessibilityLabel="Supprimer l'article"
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  style={styles.gradientButton}
                >
                  <Ionicons
                    name="trash-outline"
                    size={24}
                    color={theme.colors.background}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Supprimer</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleRecapture}
              disabled={isProcessing}
              accessibilityLabel="Reprendre"
            >
              <Text style={styles.secondaryButtonText}>Reprendre</Text>
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
    padding: theme.spacing.large,
    paddingTop: theme.spacing.large + 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    position: "absolute",
    left: 0,
  },
  title: {
    fontSize: theme.fontSizes.title + 6,
    fontWeight: "bold",
    color: theme.colors.background,
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
    borderRadius: 18,
    backgroundColor: "transparent",
    marginBottom: 24,
  },
  scanMessage: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 12,
    textShadowColor: "#000",
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
    fontSize: theme.fontSizes.regular,
    color: theme.colors.text,
    marginBottom: theme.spacing.large,
    textAlign: "center",
  },
  button: {
    marginVertical: theme.spacing.large,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonIcon: {
    marginRight: theme.spacing.small,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: theme.fontSizes.button,
    fontWeight: "bold",
  },
  secondaryButton: {
    marginTop: theme.spacing.medium,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 18,
    backgroundColor: "#eee",
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontWeight: "bold",
    fontSize: theme.fontSizes.button,
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
  },
  backButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.button,
    fontWeight: "bold",
    textAlign: "center",
  },
});
