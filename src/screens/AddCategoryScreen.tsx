import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { theme } from "../constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  createCategory,
  createSubCategory,
  getCategories,
} from "../services/api";
import type { Category } from "../services/api";

export default function AddCategoryScreen({ navigation }: any) {
  const [categoryName, setCategoryName] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(false);

  // Fetch existing categories for subcategory selection
  useEffect(() => {
    const fetchCategories = async () => {
      setFetchingCategories(true);
      try {
        const response = await getCategories();
        setCategories(response.data.data.categories);
      } catch (error: any) {
        Alert.alert(
          "Erreur",
          error.message || "Impossible de récupérer les catégories."
        );
      } finally {
        setFetchingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert("Erreur", "Le nom de la catégorie est requis.");
      return;
    }

    setLoading(true);
    try {
      const response = await createCategory({ name: categoryName });
      const newCategory = response.data.data;
      Alert.alert("Succès", `Catégorie "${newCategory.name}" ajoutée !`);
      setCategoryName("");
      // Refresh categories list
      setCategories([...categories, newCategory]);
      if (!selectedCategoryId) {
        setSelectedCategoryId(newCategory._id);
      }
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error.message || "Erreur lors de l'ajout de la catégorie."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubCategory = async () => {
    if (!subCategoryName.trim()) {
      Alert.alert("Erreur", "Le nom de la sous-catégorie est requis.");
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert("Erreur", "Veuillez sélectionner une catégorie.");
      return;
    }

    setLoading(true);
    try {
      const response = await createSubCategory({
        name: subCategoryName,
        category: selectedCategoryId,
      });
      Alert.alert("Succès", `Sous-catégorie "${subCategoryName}" ajoutée !`);
      setSubCategoryName("");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error.message || "Erreur lors de l'ajout de la sous-catégorie."
      );
    } finally {
      setLoading(false);
    }
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

        {/* Category Input */}
        <Text style={styles.label}>Nom de la catégorie</Text>
        <TextInput
          style={styles.input}
          placeholder="Entrez la catégorie"
          value={categoryName}
          onChangeText={setCategoryName}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAddCategory}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Ajout en cours..." : "Ajouter la catégorie"}
          </Text>
        </TouchableOpacity>

        {/* Subcategory Input */}
        <Text style={[styles.label, { marginTop: 24 }]}>
          Nom de la sous-catégorie
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Entrez la sous-catégorie"
          value={subCategoryName}
          onChangeText={setSubCategoryName}
        />
        <Text style={styles.label}>Catégorie associée</Text>
        {fetchingCategories ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCategoryId}
              onValueChange={(itemValue) => setSelectedCategoryId(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Sélectionnez une catégorie" value={null} />
              {categories.map((category) => (
                <Picker.Item
                  key={category._id}
                  label={category.name}
                  value={category._id}
                />
              ))}
            </Picker>
          </View>
        )}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAddSubCategory}
          disabled={loading || fetchingCategories}
        >
          <Text style={styles.buttonText}>
            {loading ? "Ajout en cours..." : "Ajouter la sous-catégorie"}
          </Text>
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
  label: {
    fontSize: 16,
    color: theme.colors.text,
    marginTop: 16,
  },
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.medium,
    marginTop: 8,
    backgroundColor: theme.colors.inputBackground,
  },
  picker: {
    height: Platform.OS === "ios" ? 180 : 50,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: theme.colors.primary,
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
