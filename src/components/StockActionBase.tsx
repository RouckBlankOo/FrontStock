import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
} from "react-native";
import BarcodeScanner from "./BarcodeScanner";

interface StockActionBaseProps {
  title: string;
  actionName: string;
  actionColor: string;
  buttonText: string;
  onSubmit: (
    productId: string,
    quantity: number,
    reason: string
  ) => Promise<void>;
  isDecrement?: boolean;
}

const StockActionBase = ({
  title,
  actionName,
  actionColor,
  buttonText,
  onSubmit,
  isDecrement = false,
}: StockActionBaseProps) => {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleBarcodeScanned = (value: string) => {
    setProductId(value);
  };

  const handleSubmit = async () => {
    if (!productId || !quantity) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const quantityNum = parseInt(quantity, 10);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError("La quantité doit être un nombre positif");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await onSubmit(productId, quantityNum, reason);
      setSuccess(true);
      // Reset form
      setProductId("");
      setQuantity("");
      setReason("");

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <BarcodeScanner onBarcodeScanned={handleBarcodeScanned} />

      <Text style={styles.label}>ID Produit</Text>
      <TextInput
        style={styles.input}
        value={productId}
        onChangeText={setProductId}
        placeholder="Entrez l'ID du produit"
      />

      <Text style={styles.label}>Quantité</Text>
      <TextInput
        style={styles.input}
        value={quantity}
        onChangeText={setQuantity}
        placeholder={`Quantité à ${isDecrement ? "retirer" : "ajouter"}`}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Raison</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={reason}
        onChangeText={setReason}
        placeholder={`Raison de ${actionName.toLowerCase()}`}
        multiline
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {success ? (
        <Text style={styles.successText}>
          {actionName} effectué avec succès!
        </Text>
      ) : null}

      <Button
        title={isLoading ? "Traitement en cours..." : buttonText}
        onPress={handleSubmit}
        disabled={isLoading}
        color={actionColor}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  errorText: {
    color: "red",
    marginBottom: 15,
  },
  successText: {
    color: "green",
    marginBottom: 15,
  },
});

export default StockActionBase;
