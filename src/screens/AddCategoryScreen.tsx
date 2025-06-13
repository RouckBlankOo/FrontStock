import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function AddCategoryScreen({ navigation }: any) {
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");

  const handleAdd = () => {
    if (!category.trim() || !subCategory.trim()) {
      Alert.alert("Veuillez saisir la catégorie et la sous-catégorie.");
      return;
    }
    // Here you would send to your backend or update state
    Alert.alert(
      "Succès",
      `Catégorie "${category}" avec la sous-catégorie "${subCategory}" ajoutée !`
    );
    setCategory("");
    setSubCategory("");
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityLabel="Retour"
        >
          <Ionicons name="arrow-back" size={26} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Ajouter une catégorie</Text>
        <Text style={styles.label}>Nom de la catégorie</Text>
        <TextInput
          style={styles.input}
          placeholder="Entrez la catégorie"
          value={category}
          onChangeText={setCategory}
        />
        <Text style={styles.label}>Nom de la sous-catégorie</Text>
        <TextInput
          style={styles.input}
          placeholder="Entrez la sous-catégorie"
          value={subCategory}
          onChangeText={setSubCategory}
        />
        <TouchableOpacity style={styles.button} onPress={handleAdd}>
          <Text style={styles.buttonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    borderRadius: 20,
    margin: 8,
    backgroundColor: theme.colors.white,
    shadowRadius: 4,
    position: "absolute",
    top: Platform.select({ ios: 10, android: 10 }),
    left: 0,
    padding: 8,
    zIndex: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: 24,
    textAlign: "center",
    marginTop: 8,
  },
  label: { fontSize: 16, color: theme.colors.text, marginTop: 16 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.medium,
    padding: 12,
    marginTop: 8,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.text,
    fontSize: 16,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 32,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
