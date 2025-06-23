import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Button,
  Text,
  Alert,
  TouchableOpacity,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";

interface BarcodeScannerProps {
  onBarcodeScanned: (value: string) => void;
}

const BarcodeScanner = ({ onBarcodeScanned }: BarcodeScannerProps) => {
  console.log("BarcodeScanner - Component initialized");
  console.log("BarcodeScanner - Props:", {
    onBarcodeScanned: typeof onBarcodeScanned,
  });

  const [permission, requestPermission] = useCameraPermissions();
  const [barcodeValue, setBarcodeValue] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Use refs to track scanning state and prevent multiple scans
  const scanningRef = useRef(false);
  const lastScannedRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  console.log("BarcodeScanner - Current state:", {
    hasPermission: permission?.granted,
    isScanning,
    scanned,
    barcodeValue,
    isProcessing,
  });

  const startScan = async () => {
    console.log("BarcodeScanner - Starting scan");
    console.log("BarcodeScanner - Current permission:", permission);

    // Reset all scanning states
    resetScanningState();

    // Check if we already have permission, if not request it
    if (!permission?.granted) {
      console.log("BarcodeScanner - Permission not granted, requesting...");
      const result = await requestPermission();
      console.log("BarcodeScanner - Permission request result:", result);

      if (!result.granted) {
        console.log("BarcodeScanner - Permission denied by user");
        Alert.alert(
          "Permission requise",
          "Veuillez autoriser l'accès à la caméra pour scanner les codes-barres."
        );
        return;
      }
    }

    console.log("BarcodeScanner - Permission granted, starting camera");
    setIsScanning(true);
    setScanned(false);
    setIsProcessing(false);
    scanningRef.current = true;
    setBarcodeValue(""); // Clear previous value
  };

  const resetScanningState = () => {
    console.log("BarcodeScanner - Resetting scanning state");
    scanningRef.current = false;
    lastScannedRef.current = "";
    lastScanTimeRef.current = 0;
    setIsProcessing(false);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastScanTimeRef.current;

    console.log("BarcodeScanner - Barcode scan detected");
    console.log("BarcodeScanner - Scan result:", {
      data: result.data,
      type: result.type,
      timeSinceLastScan: timeDiff,
      isProcessing,
      scanned,
      scanningActive: scanningRef.current,
    });

    // Prevent multiple scans with multiple conditions
    if (
      !scanningRef.current ||
      scanned ||
      isProcessing ||
      !result.data ||
      result.data === lastScannedRef.current ||
      timeDiff < 2000
    ) {
      // 2 second cooldown between scans

      console.log("BarcodeScanner - Ignoring scan:", {
        scanningActive: scanningRef.current,
        alreadyScanned: scanned,
        processing: isProcessing,
        hasData: !!result.data,
        sameAsLast: result.data === lastScannedRef.current,
        tooSoon: timeDiff < 2000,
      });
      return;
    }

    console.log("BarcodeScanner - Processing valid scan");

    // Immediately set processing state to prevent additional scans
    setIsProcessing(true);
    setScanned(true);
    setIsScanning(false);
    scanningRef.current = false;

    // Store scan data and time
    lastScannedRef.current = result.data;
    lastScanTimeRef.current = currentTime;
    setBarcodeValue(result.data);

    console.log(
      "BarcodeScanner - Calling onBarcodeScanned callback with:",
      result.data
    );

    // Add a small delay to ensure state updates are processed
    setTimeout(() => {
      onBarcodeScanned(result.data);
    }, 100);
  };

  const stopScanning = () => {
    console.log("BarcodeScanner - Stopping scan");
    setIsScanning(false);
    setScanned(false);
    setIsProcessing(false);
    resetScanningState();
  };

  // For simulator/emulator testing - generate realistic stock IDs
  const handleMockScan = () => {
    if (isProcessing || scanned) {
      console.log("BarcodeScanner - Mock scan ignored (already processing)");
      return;
    }

    // Generate a realistic MongoDB ObjectId format for testing
    const mockStockId =
      "68" +
      Math.random().toString(16).substring(2, 8) +
      "bc07fba0f3206" +
      Math.random().toString(16).substring(2, 5);
    console.log("BarcodeScanner - Mock scan with stock ID:", mockStockId);

    setIsProcessing(true);
    setScanned(true);
    setIsScanning(false);
    setBarcodeValue(mockStockId);

    // Simulate the same delay as real scanning
    setTimeout(() => {
      onBarcodeScanned(mockStockId);
    }, 100);
  };

  // Auto-start scanning when component mounts
  useEffect(() => {
    console.log("BarcodeScanner - useEffect triggered, auto-starting scan");
    startScan();

    // Cleanup on unmount
    return () => {
      console.log("BarcodeScanner - Component unmounting, cleaning up");
      resetScanningState();
    };
  }, []);

  // Reset scanning state when permission changes
  useEffect(() => {
    if (permission?.granted && !isScanning && !scanned && !isProcessing) {
      console.log("BarcodeScanner - Permission granted, auto-starting scan");
      startScan();
    }
  }, [permission?.granted]);

  if (permission === undefined) {
    console.log("BarcodeScanner - Permission undefined");
    return <Text>Vérification des autorisations de caméra...</Text>;
  }

  if (permission === null) {
    console.log("BarcodeScanner - Permission null");
    return <Text>Impossible d'accéder aux autorisations de caméra</Text>;
  }

  if (!permission.granted && !isScanning) {
    console.log(
      "BarcodeScanner - Permission not granted, showing permission UI"
    );
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Nous avons besoin de votre permission pour utiliser la caméra
        </Text>
        <Button
          onPress={() => {
            console.log("BarcodeScanner - Permission button pressed");
            requestPermission();
          }}
          title="Autoriser la caméra"
        />

        {__DEV__ && (
          <View style={styles.devButtonContainer}>
            <Button
              title="Simuler un scan de stock (Dev)"
              onPress={() => {
                console.log("BarcodeScanner - Mock scan button pressed");
                handleMockScan();
              }}
              color="#888"
            />
          </View>
        )}
      </View>
    );
  }

  console.log("BarcodeScanner - Rendering main scanner UI");

  return (
    <View style={styles.container}>
      {isScanning && !scanned && !isProcessing ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: [
                "qr",
                "ean13",
                "ean8",
                "code128",
                "code39",
                "upc_e",
              ],
            }}
            onBarcodeScanned={handleBarCodeScanned}
          >
            <View style={styles.overlay}>
              <View style={styles.scanArea} />
              <Text style={styles.scanText}>
                Positionner le code-barres du stock dans le cadre
              </Text>
              <Text style={styles.instructionText}>
                Maintenez le téléphone stable et attendez le scan
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                console.log("BarcodeScanner - Close button pressed");
                stopScanning();
              }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </CameraView>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          {scanned || isProcessing ? (
            <View style={styles.scannedContainer}>
              <Text style={styles.scannedText}>
                {isProcessing
                  ? "Traitement en cours..."
                  : "Code scanné avec succès!"}
              </Text>
              {barcodeValue && (
                <Text style={styles.scannedCode}>Code: {barcodeValue}</Text>
              )}
            </View>
          ) : (
            <>
              <Button
                title="Scanner un code-barres stock"
                onPress={() => {
                  console.log("BarcodeScanner - Start scan button pressed");
                  startScan();
                }}
              />

              {__DEV__ && (
                <View style={styles.devButtonContainer}>
                  <Button
                    title="Simuler un scan de stock (Dev)"
                    onPress={() => {
                      console.log(
                        "BarcodeScanner - Mock scan button pressed (dev mode)"
                      );
                      handleMockScan();
                    }}
                    color="#888"
                  />
                </View>
              )}
            </>
          )}
        </View>
      )}

      {barcodeValue && (scanned || isProcessing) ? (
        <View style={styles.barcodeContainer}>
          <Text style={styles.barcodeText}>
            Dernier code scanné: {barcodeValue}
          </Text>
          <Text style={styles.barcodeInfo}>
            {barcodeValue.length === 24
              ? "Format ID Stock détecté"
              : "Format personnalisé"}
          </Text>
          <Text style={styles.statusText}>
            {isProcessing ? "🔄 Traitement..." : "✅ Scanné"}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    alignItems: "center",
    width: "100%",
  },
  cameraContainer: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  scanArea: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: "#00ff00",
    backgroundColor: "transparent",
    marginBottom: 20,
    borderStyle: "dashed",
  },
  scanText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  instructionText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 12,
    opacity: 0.8,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  scannedContainer: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f0f8f0",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  scannedText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 5,
  },
  scannedCode: {
    fontSize: 12,
    color: "#555",
    fontFamily: "monospace",
  },
  devButtonContainer: {
    marginTop: 10,
    width: "100%",
  },
  barcodeContainer: {
    marginTop: 20,
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderRadius: 10,
    backgroundColor: "#f0f8f0",
  },
  barcodeText: {
    marginBottom: 5,
    fontSize: 14,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  barcodeInfo: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  permissionContainer: {
    marginVertical: 20,
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  permissionText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 15,
    color: "#555",
  },
});

export default BarcodeScanner;
