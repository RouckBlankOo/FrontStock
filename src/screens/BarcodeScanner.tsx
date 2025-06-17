import React, { useState } from "react";
import { View, StyleSheet, Button, Text } from "react-native";
import Barcode from "react-native-barcode-svg";

interface BarcodeScannerProps {
  onBarcodeScanned: (value: string) => void;
}

const BarcodeScanner = ({ onBarcodeScanned }: BarcodeScannerProps) => {
  const [barcodeValue, setBarcodeValue] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  // This is a mock function - in a real app, you would use the device camera
  // and a barcode scanning library like react-native-camera or expo-barcode-scanner
  const startScan = () => {
    setIsScanning(true);
    // Simulate a scan after 2 seconds
    setTimeout(() => {
      const mockBarcode = "PROD" + Math.floor(Math.random() * 10000);
      setBarcodeValue(mockBarcode);
      onBarcodeScanned(mockBarcode);
      setIsScanning(false);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <Button title="Scanner un code-barres" onPress={startScan} />

      {isScanning && <Text style={styles.scanningText}>Scan en cours...</Text>}

      {barcodeValue ? (
        <View style={styles.barcodeContainer}>
          <Text style={styles.barcodeText}>Code produit: {barcodeValue}</Text>
          <Barcode value={barcodeValue} format="CODE128" height={80} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    alignItems: "center",
  },
  scanningText: {
    marginTop: 10,
    fontSize: 16,
  },
  barcodeContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  barcodeText: {
    marginBottom: 10,
    fontSize: 16,
  },
});

export default BarcodeScanner;
