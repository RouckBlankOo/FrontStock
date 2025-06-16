import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { RootStackParamList } from "../types";
import {
  getCategories,
  getSubCategories,
  addProduct,
  Category,
  SubCategory,
} from "../services/api";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AddProductScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [category, setCategory] = useState<string>("");
  const [subCategory, setSubCategory] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [size, setSize] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [price, setPrice] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [subCategoryModalVisible, setSubCategoryModalVisible] = useState(false);
  const [colorModalVisible, setColorModalVisible] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response.data.data.categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!category) {
        setSubCategories([]);
        return;
      }

      try {
        const selectedCategory = categories.find((c) => c.name === category);
        if (selectedCategory) {
          const response = await getSubCategories(selectedCategory._id);
          setSubCategories(response.data.data.subCategories ?? []);
        }
      } catch (error) {
        console.error("Error fetching subcategories:", error);
        setSubCategories([]);
      }
    };

    fetchSubCategories();
  }, [category, categories]);

  const handleAddProduct = async () => {
    if (!category || !subCategory || !color || !size || !quantity || !price) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires.");
      return;
    }
    const quantityNum = Number(quantity);
    const priceNum = Number(price);
    if (isNaN(quantityNum) || quantityNum < 0) {
      Alert.alert("Erreur", "La quantité doit être un nombre valide.");
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Erreur", "Le prix doit être un nombre positif.");
      return;
    }

    setIsLoading(true);
    try {
      const categoryId = categories.find((c) => c.name === category)?._id;
      const subCategoryId = subCategories.find(
        (sc) => sc.name === subCategory
      )?._id;
      if (!categoryId || !subCategoryId) {
        throw new Error("Catégorie ou sous-catégorie invalide.");
      }

      const newProduct = {
        name: `${category} ${subCategory}`,
        category: categoryId,
        subCategory: subCategoryId,
        description: description.trim() || undefined,
        price: priceNum,
        stocks: [{ color, size, quantity: quantityNum }],
      };

      await addProduct(newProduct);

      Alert.alert("Succès", "Produit ajouté avec succès !", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
      setCategory("");
      setSubCategory("");
      setColor("");
      setSize("");
      setQuantity("1");
      setPrice("");
      setDescription("");
    } catch (error: any) {
      const errorMessage = error.message || "Échec de l'ajout du produit.";
      Alert.alert("Erreur", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderDropdownItem = ({
    item,
    onPress,
  }: {
    item: string;
    onPress: (value: string) => void;
  }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
      accessibilityLabel={`Sélectionner ${item}`}
    >
      <Text style={styles.dropdownItemText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backIcon}
          accessibilityLabel="Retour"
        >
          <Ionicons
            name="arrow-back-outline"
            size={28}
            color={theme.colors.white}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Ajouter un produit</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formCard}>
          {/* Category Dropdown */}
          <View style={styles.formField}>
            <Text style={styles.label}>Catégorie</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setCategoryModalVisible(true)}
              accessibilityLabel="Sélectionner une catégorie"
            >
              <Text style={styles.dropdownText}>
                {category || "Sélectionner une catégorie"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={theme.colors.text}
              />
            </TouchableOpacity>
            <Modal
              visible={categoryModalVisible}
              transparent
              animationType="fade"
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <FlatList
                    data={categories}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) =>
                      renderDropdownItem({
                        item: item.name,
                        onPress: (value) => {
                          setCategory(value);
                          setSubCategory(""); // Reset subcategory when category changes
                          setCategoryModalVisible(false);
                        },
                      })
                    }
                    ListEmptyComponent={
                      <Text style={styles.emptyText}>
                        Aucune catégorie disponible
                      </Text>
                    }
                  />
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setCategoryModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>

          {/* SubCategory Dropdown */}
          <View style={styles.formField}>
            <Text style={styles.label}>Sous-catégorie</Text>
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                !category && styles.dropdownButtonDisabled,
              ]}
              onPress={() => category && setSubCategoryModalVisible(true)}
              disabled={!category}
              accessibilityLabel="Sélectionner une sous-catégorie"
            >
              <Text style={styles.dropdownText}>
                {subCategory || "Sélectionner une sous-catégorie"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={
                  category ? theme.colors.text : theme.colors.textSecondary
                }
              />
            </TouchableOpacity>
            <Modal
              visible={subCategoryModalVisible}
              transparent
              animationType="fade"
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <FlatList
                    data={subCategories}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) =>
                      renderDropdownItem({
                        item: item.name,
                        onPress: (value) => {
                          setSubCategory(value);
                          setSubCategoryModalVisible(false);
                        },
                      })
                    }
                    ListEmptyComponent={
                      <Text style={styles.emptyText}>
                        {category
                          ? "Aucune sous-catégorie disponible pour cette catégorie"
                          : "Veuillez d'abord sélectionner une catégorie"}
                      </Text>
                    }
                  />
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setSubCategoryModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>

          {/* Color Dropdown */}
          <View style={styles.formField}>
            <Text style={styles.label}>Couleur</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setColorModalVisible(true)}
              accessibilityLabel="Sélectionner une couleur"
            >
              <Text style={styles.dropdownText}>
                {color || "Sélectionner une couleur"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={theme.colors.text}
              />
            </TouchableOpacity>
            <Modal visible={colorModalVisible} transparent animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <FlatList
                    data={Object.keys(theme.colors.productColors).map(
                      (key) => key.charAt(0).toUpperCase() + key.slice(1)
                    )}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) =>
                      renderDropdownItem({
                        item,
                        onPress: (value) => {
                          setColor(value);
                          setColorModalVisible(false);
                        },
                      })
                    }
                  />
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setColorModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>

          {/* Size Input */}
          <View style={styles.formField}>
            <Text style={styles.label}>Taille</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez la taille"
              value={size}
              onChangeText={setSize}
              autoCapitalize="characters"
              accessibilityLabel="Entrer la taille"
            />
          </View>

          {/* Quantity Input */}
          <View style={styles.formField}>
            <Text style={styles.label}>Quantité</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez la quantité"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              accessibilityLabel="Entrer la quantité"
            />
          </View>

          {/* Price Input */}
          <View style={styles.formField}>
            <Text style={styles.label}>Prix</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez le prix"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              accessibilityLabel="Entrer le prix"
            />
          </View>

          {/* Description Input */}
          <View style={styles.formField}>
            <Text style={styles.label}>Description (facultatif)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Entrez une description"
              value={description}
              onChangeText={setDescription}
              multiline
              accessibilityLabel="Entrer la description"
            />
          </View>

          {/* Add Product Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleAddProduct}
            disabled={isLoading}
            accessibilityLabel="Ajouter le produit"
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Ajout en cours..." : "Ajouter le produit"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  scrollContainer: {
    padding: theme.spacing.large,
    paddingBottom: theme.spacing.xl,
  },
  formCard: {
    ...theme.card,
    padding: theme.spacing.large,
    marginTop: theme.spacing.medium,
  },
  formField: {
    marginBottom: theme.spacing.large,
  },
  label: {
    fontSize: theme.fontSizes.regular,
    fontWeight: "500",
    color: theme.colors.text,
    marginBottom: theme.spacing.small,
  },
  dropdownButton: {
    ...theme.input,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderColor: theme.colors.inputBorder,
    backgroundColor: theme.colors.inputBackground,
    marginBottom: theme.spacing.medium,
  },
  dropdownButtonDisabled: {
    opacity: theme.button.disabledOpacity,
  },
  dropdownText: {
    fontSize: theme.fontSizes.regular,
    color: theme.colors.text,
  },
  modalOverlay: {
    ...theme.modal.overlay,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    ...theme.modal.content,
  },
  dropdownItem: {
    padding: theme.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.inputBorder,
  },
  dropdownItemText: {
    fontSize: theme.fontSizes.regular,
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.medium,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: theme.colors.inputBorder,
  },
  closeButtonText: {
    fontSize: theme.fontSizes.regular,
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  input: {
    ...theme.input,
    borderColor: theme.colors.inputBorder,
    backgroundColor: theme.colors.inputBackground,
    marginBottom: theme.spacing.medium,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  button: {
    ...theme.button,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    marginTop: theme.spacing.medium,
  },
  buttonDisabled: {
    opacity: theme.button.disabledOpacity,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.regular,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.regular,
    marginVertical: theme.spacing.medium,
  },
});
