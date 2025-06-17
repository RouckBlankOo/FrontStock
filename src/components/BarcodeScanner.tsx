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
  CameraPermissionStatus,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import Barcode from "react-native-barcode-svg";

interface BarcodeScannerProps {
  onBarcodeScanned: (value: string) => void;
}

const BarcodeScanner = ({ onBarcodeScanned }: BarcodeScannerProps) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [barcodeValue, setBarcodeValue] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const startScan = async () => {
    // Check if we already have permission, if not request it
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Permission requise",
          "Veuillez autoriser l'accès à la caméra pour scanner les codes-barres."
        );
        return;
      }
    }

    setIsScanning(true);
    setScanned(false);
  };

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanned || !result.data) return; // Prevent multiple scans or empty data

    setScanned(true);
    setIsScanning(false);
    setBarcodeValue(result.data);
    onBarcodeScanned(result.data);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  // For simulator/emulator testing
  const handleMockScan = () => {
    const mockBarcode = "PROD" + Math.floor(Math.random() * 10000);
    setBarcodeValue(mockBarcode);
    onBarcodeScanned(mockBarcode);
  };

  if (permission === undefined) {
    return <Text>Vérification des autorisations de caméra...</Text>;
  }

  if (permission === null) {
    return <Text>Impossible d'accéder aux autorisations de caméra</Text>;
  }

  if (!permission.granted && !isScanning) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Nous avons besoin de votre permission pour utiliser la caméra
        </Text>
        <Button onPress={requestPermission} title="Autoriser la caméra" />

        {__DEV__ && (
          <Button
            title="Simuler un scan (Dev)"
            onPress={handleMockScan}
            color="#888"
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isScanning ? (
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
                Positionner le code-barres dans le cadre
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={stopScanning}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </CameraView>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <Button title="Scanner un code-barres" onPress={startScan} />

          {__DEV__ && (
            <Button
              title="Simuler un scan (Dev)"
              onPress={handleMockScan}
              color="#888"
            />
          )}
        </View>
      )}

      {barcodeValue ? (
        <View style={styles.barcodeContainer}>
          <Text style={styles.barcodeText}>Code produit: {barcodeValue}</Text>
          <Barcode
            value={barcodeValue}
            format="CODE128"
            height={80}
            width={300}
          />
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
    borderColor: "#fff",
    backgroundColor: "transparent",
    marginBottom: 10,
  },
  scanText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 14,
    marginTop: 10,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
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
  barcodeContainer: {
    marginTop: 20,
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    backgroundColor: "#f9f9f9",
  },
  barcodeText: {
    marginBottom: 10,
    fontSize: 16,
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
