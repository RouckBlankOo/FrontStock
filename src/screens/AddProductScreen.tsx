import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getCategories, Category } from "../services/api";

export default function AddCategoryScreen({ navigation }: any) {
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  useEffect(() => {
    getCategories()
      .then((res) => {
        // Use the correct path to categories array from your backend
        setCategories(res.data.categories || []);
      })
      .catch(() => setCategories([]));
  }, []);

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

  const renderDropdownItem = ({
    item,
    onPress,
  }: {
    item: string;
    onPress: (value: string) => void;
  }) => (
    <TouchableOpacity style={styles.dropdownItem} onPress={() => onPress(item)}>
      <Text style={styles.dropdownItemText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Category Picker */}
        <TouchableOpacity
          style={styles.input}
          onPress={() => setCategoryModalVisible(true)}
        >
          <Text style={{ color: category ? "#222" : "#aaa" }}>
            {category || "Sélectionner une catégorie"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#888" />
        </TouchableOpacity>

        {/* SubCategory Input */}
        <View style={styles.input}>
          <Text style={{ color: "#222" }}>Sous-catégorie:</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Nom de la sous-catégorie"
            value={subCategory}
            onChangeText={setSubCategory}
          />
        </View>

        {/* Add Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>

        {/* Category Modal */}
        <Modal
          visible={categoryModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setCategoryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choisir une catégorie</Text>
              <FlatList
                data={categories}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) =>
                  renderDropdownItem({
                    item: item.name,
                    onPress: (value) => {
                      setCategory(value);
                      setSubCategory("");
                      setCategoryModalVisible(false);
                    },
                  })
                }
              />
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setCategoryModalVisible(false)}
              >
                <Text style={{ color: theme.colors.primary }}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

import { TextInput } from "react-native";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f9fa",
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#f7f9fa",
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 18,
    justifyContent: "space-between",
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#222",
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    maxHeight: "70%",
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 18,
    color: theme.colors.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#222",
  },
  closeModalButton: {
    marginTop: 12,
    alignSelf: "center",
    padding: 8,
  },
});
