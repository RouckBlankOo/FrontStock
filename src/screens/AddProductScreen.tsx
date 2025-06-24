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
  ActivityIndicator,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { RootStackParamList } from "../types";
import { productColors } from "../constants/colors";
import {
  getCategories,
  getSubCategories,
  createProduct,
  Category,
  SubCategory,
} from "../services/api";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AddProductScreen() {
  console.log("AddProductScreen - Component initialized");

  const navigation = useNavigation<NavigationProp>();
  const [productName, setProductName] = useState<string>("");
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
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] =
    useState<string>("");

  console.log("AddProductScreen - Current state:", {
    productName,
    category,
    subCategory,
    color,
    size,
    quantity,
    price,
    description: description.length,
    categoriesCount: categories.length,
    subCategoriesCount: subCategories.length,
    selectedCategoryId,
    selectedSubCategoryId,
  });

  useEffect(() => {
    console.log("AddProductScreen - useEffect - Fetching categories");
    fetchCategories();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    console.log("AddProductScreen - useEffect - Category changed:", category);
    fetchSubCategories();
  }, [category, categories]);

  const fetchCategories = async () => {
    console.log("AddProductScreen - fetchCategories - Starting");
    setLoadingCategories(true);

    try {
      const response = await getCategories();
      console.log(
        "AddProductScreen - fetchCategories - Response:",
        response.data
      );

      if (response.data.success) {
        const categoriesData = response.data.data.categories || [];
        console.log(
          "AddProductScreen - fetchCategories - Categories loaded:",
          categoriesData.length
        );
        setCategories(categoriesData);
      } else {
        console.log(
          "AddProductScreen - fetchCategories - API returned failure"
        );
        throw new Error(
          response.data.message || "Échec du chargement des catégories"
        );
      }
    } catch (error: any) {
      console.error("AddProductScreen - fetchCategories - Error:", error);
      console.error(
        "AddProductScreen - fetchCategories - Error response:",
        error.response?.data
      );
      setCategories([]);
      Alert.alert(
        "Erreur",
        "Impossible de charger les catégories. Vérifiez votre connexion."
      );
    } finally {
      console.log("AddProductScreen - fetchCategories - Completed");
      setLoadingCategories(false);
    }
  };

  const fetchSubCategories = async () => {
    if (!category) {
      console.log(
        "AddProductScreen - fetchSubCategories - No category selected, clearing subcategories"
      );
      setSubCategories([]);
      setSubCategory("");
      setSelectedSubCategoryId("");
      return;
    }

    console.log(
      "AddProductScreen - fetchSubCategories - Fetching for category:",
      category
    );
    setLoadingSubCategories(true);

    try {
      const selectedCategory = categories.find((c) => c.name === category);
      console.log(
        "AddProductScreen - fetchSubCategories - Selected category:",
        selectedCategory
      );

      if (selectedCategory) {
        const response = await getSubCategories({
          category: selectedCategory._id,
        });
        console.log(
          "AddProductScreen - fetchSubCategories - Response:",
          response.data
        );

        if (response.data.success) {
          const subCategoriesData = response.data.data.subCategories || [];
          console.log(
            "AddProductScreen - fetchSubCategories - Subcategories loaded:",
            subCategoriesData.length
          );
          setSubCategories(subCategoriesData);
        } else {
          console.log(
            "AddProductScreen - fetchSubCategories - API returned failure"
          );
          setSubCategories([]);
        }
      } else {
        console.log(
          "AddProductScreen - fetchSubCategories - Category not found in list"
        );
        setSubCategories([]);
      }
    } catch (error: any) {
      console.error("AddProductScreen - fetchSubCategories - Error:", error);
      console.error(
        "AddProductScreen - fetchSubCategories - Error response:",
        error.response?.data
      );
      setSubCategories([]);
    } finally {
      console.log("AddProductScreen - fetchSubCategories - Completed");
      setLoadingSubCategories(false);
    }
  };

  const handleAddProduct = async () => {
    console.log("AddProductScreen - handleAddProduct - Starting validation");
    console.log("AddProductScreen - handleAddProduct - Form data:", {
      productName,
      category,
      subCategory,
      color,
      size,
      quantity,
      price,
      description: description.length,
    });

    // Validation
    if (!productName.trim()) {
      console.log("AddProductScreen - handleAddProduct - Product name missing");
      Alert.alert("Erreur", "Veuillez entrer un nom de produit.");
      return;
    }

    if (!category || !subCategory || !color || !size || !quantity || !price) {
      console.log(
        "AddProductScreen - handleAddProduct - Required fields missing"
      );
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const quantityNum = Number(quantity);
    const priceNum = Number(price);

    console.log("AddProductScreen - handleAddProduct - Parsed numbers:", {
      quantityNum,
      priceNum,
    });

    if (isNaN(quantityNum) || quantityNum < 0) {
      console.log(
        "AddProductScreen - handleAddProduct - Invalid quantity:",
        quantityNum
      );
      Alert.alert("Erreur", "La quantité doit être un nombre valide (≥ 0).");
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      console.log(
        "AddProductScreen - handleAddProduct - Invalid price:",
        priceNum
      );
      Alert.alert("Erreur", "Le prix doit être un nombre positif.");
      return;
    }

    // Get IDs
    const categoryId = categories.find((c) => c.name === category)?._id;
    const subCategoryId = subCategories.find(
      (sc) => sc.name === subCategory
    )?._id;

    console.log("AddProductScreen - handleAddProduct - IDs:", {
      categoryId,
      subCategoryId,
    });

    if (!categoryId || !subCategoryId) {
      console.log(
        "AddProductScreen - handleAddProduct - Invalid category or subcategory IDs"
      );
      Alert.alert("Erreur", "Catégorie ou sous-catégorie invalide.");
      return;
    }

    console.log(
      "AddProductScreen - handleAddProduct - Starting product creation"
    );
    setIsLoading(true);

    try {
      const newProduct = {
        name: productName.trim(),
        category: categoryId,
        subCategory: subCategoryId,
        description: description.trim() || undefined,
        price: priceNum,
        stocks: [
          {
            color: color.toLowerCase(),
            size: size.toUpperCase(),
            quantity: quantityNum,
          },
        ],
      };

      console.log(
        "AddProductScreen - handleAddProduct - Product data to send:",
        newProduct
      );

      const response = await createProduct(newProduct);
      console.log(
        "AddProductScreen - handleAddProduct - API Response:",
        response.data
      );

      if (response.data.success) {
        console.log(
          "AddProductScreen - handleAddProduct - Product created successfully"
        );
        Alert.alert("Succès", `Produit "${productName}" ajouté avec succès !`, [
          {
            text: "OK",
            onPress: () => {
              console.log(
                "AddProductScreen - handleAddProduct - Navigating back after success"
              );
              resetForm();
              navigation.goBack();
            },
          },
        ]);
      } else {
        console.log(
          "AddProductScreen - handleAddProduct - API returned failure:",
          response.data.message
        );
        throw new Error(response.data.message || "Échec de l'ajout du produit");
      }
    } catch (error: any) {
      console.error("AddProductScreen - handleAddProduct - Error:", error);
      console.error(
        "AddProductScreen - handleAddProduct - Error response:",
        error.response?.data
      );

      let errorMessage = "Échec de l'ajout du produit.";

      if (error.response?.status === 400) {
        errorMessage = error.response.data.message || "Données invalides.";
      } else if (error.response?.status === 409) {
        errorMessage = "Un produit avec ces caractéristiques existe déjà.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.log(
        "AddProductScreen - handleAddProduct - Final error message:",
        errorMessage
      );
      Alert.alert("Erreur", errorMessage);
    } finally {
      console.log("AddProductScreen - handleAddProduct - Completed");
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    console.log("AddProductScreen - resetForm - Resetting all form fields");
    setProductName("");
    setCategory("");
    setSubCategory("");
    setColor("");
    setSize("");
    setQuantity("1");
    setPrice("");
    setDescription("");
    setSelectedCategoryId("");
    setSelectedSubCategoryId("");
  };

  const handleCategorySelect = (categoryName: string, categoryId: string) => {
    console.log("AddProductScreen - handleCategorySelect:", {
      categoryName,
      categoryId,
    });
    setCategory(categoryName);
    setSelectedCategoryId(categoryId);
    setSubCategory(""); // Reset subcategory when category changes
    setSelectedSubCategoryId("");
    setCategoryModalVisible(false);
  };

  const handleSubCategorySelect = (
    subCategoryName: string,
    subCategoryId: string
  ) => {
    console.log("AddProductScreen - handleSubCategorySelect:", {
      subCategoryName,
      subCategoryId,
    });
    setSubCategory(subCategoryName);
    setSelectedSubCategoryId(subCategoryId);
    setSubCategoryModalVisible(false);
  };

  const handleColorSelect = (colorName: string) => {
    console.log("AddProductScreen - handleColorSelect:", colorName);
    setColor(colorName);
    setColorModalVisible(false);
  };

  const renderDropdownItem = ({
    item,
    onPress,
    identifier,
  }: {
    item: any;
    onPress: (name: string, id?: string) => void;
    identifier: string;
  }) => {
    const displayName = typeof item === "string" ? item : item.name;
    const itemId = typeof item === "string" ? undefined : item._id;

    return (
      <TouchableOpacity
        style={styles.dropdownItem}
        onPress={() => {
          console.log(`AddProductScreen - ${identifier} item selected:`, {
            displayName,
            itemId,
          });
          onPress(displayName, itemId);
        }}
        activeOpacity={0.7}
        accessibilityLabel={`Sélectionner ${displayName}`}
      >
        <Text style={styles.dropdownItemText}>{displayName}</Text>
      </TouchableOpacity>
    );
  };

  // Get available colors from productColors constant
  const availableColors = productColors.map((color) => ({
    name: color.name.charAt(0).toUpperCase() + color.name.slice(1),
    value: color.value,
  }));

  console.log("AddProductScreen - Available colors:", availableColors.length);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            console.log("AddProductScreen - Back button pressed");
            navigation.goBack();
          }}
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
          {/* Product Name Input */}
          <View style={styles.formField}>
            <Text style={styles.label}>Nom du produit *</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez le nom du produit"
              value={productName}
              onChangeText={(text) => {
                console.log("AddProductScreen - Product name changed:", text);
                setProductName(text);
              }}
              autoCapitalize="words"
              accessibilityLabel="Entrer le nom du produit"
            />
          </View>

          {/* Category Dropdown */}
          <View style={styles.formField}>
            <Text style={styles.label}>Catégorie *</Text>
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                loadingCategories && styles.dropdownButtonDisabled,
              ]}
              onPress={() => {
                console.log("AddProductScreen - Category dropdown pressed");
                if (!loadingCategories) {
                  setCategoryModalVisible(true);
                }
              }}
              disabled={loadingCategories}
              accessibilityLabel="Sélectionner une catégorie"
            >
              <Text style={styles.dropdownText}>
                {loadingCategories
                  ? "Chargement des catégories..."
                  : category || "Sélectionner une catégorie"}
              </Text>
              {loadingCategories ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={theme.colors.text}
                />
              )}
            </TouchableOpacity>

            <Modal
              visible={categoryModalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => {
                console.log("AddProductScreen - Category modal closed");
                setCategoryModalVisible(false);
              }}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>
                    Sélectionner une catégorie
                  </Text>
                  <FlatList
                    data={categories}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) =>
                      renderDropdownItem({
                        item,
                        onPress: (name, id) => handleCategorySelect(name, id!),
                        identifier: "category",
                      })
                    }
                    ListEmptyComponent={
                      <Text style={styles.emptyText}>
                        {loadingCategories
                          ? "Chargement..."
                          : "Aucune catégorie disponible"}
                      </Text>
                    }
                  />
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      console.log(
                        "AddProductScreen - Category modal close button pressed"
                      );
                      setCategoryModalVisible(false);
                    }}
                  >
                    <Text style={styles.closeButtonText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>

          {/* SubCategory Dropdown */}
          <View style={styles.formField}>
            <Text style={styles.label}>Sous-catégorie *</Text>
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                (!category || loadingSubCategories) &&
                  styles.dropdownButtonDisabled,
              ]}
              onPress={() => {
                console.log("AddProductScreen - SubCategory dropdown pressed");
                if (category && !loadingSubCategories) {
                  setSubCategoryModalVisible(true);
                }
              }}
              disabled={!category || loadingSubCategories}
              accessibilityLabel="Sélectionner une sous-catégorie"
            >
              <Text style={styles.dropdownText}>
                {loadingSubCategories
                  ? "Chargement des sous-catégories..."
                  : subCategory || "Sélectionner une sous-catégorie"}
              </Text>
              {loadingSubCategories ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={
                    category ? theme.colors.text : theme.colors.textSecondary
                  }
                />
              )}
            </TouchableOpacity>

            <Modal
              visible={subCategoryModalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => {
                console.log("AddProductScreen - SubCategory modal closed");
                setSubCategoryModalVisible(false);
              }}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>
                    Sélectionner une sous-catégorie
                  </Text>
                  <FlatList
                    data={subCategories}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) =>
                      renderDropdownItem({
                        item,
                        onPress: (name, id) =>
                          handleSubCategorySelect(name, id!),
                        identifier: "subcategory",
                      })
                    }
                    ListEmptyComponent={
                      <Text style={styles.emptyText}>
                        {loadingSubCategories
                          ? "Chargement..."
                          : category
                          ? "Aucune sous-catégorie disponible pour cette catégorie"
                          : "Veuillez d'abord sélectionner une catégorie"}
                      </Text>
                    }
                  />
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      console.log(
                        "AddProductScreen - SubCategory modal close button pressed"
                      );
                      setSubCategoryModalVisible(false);
                    }}
                  >
                    <Text style={styles.closeButtonText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>

          {/* Color Dropdown */}
          <View style={styles.formField}>
            <Text style={styles.label}>Couleur *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => {
                console.log("AddProductScreen - Color dropdown pressed");
                setColorModalVisible(true);
              }}
              accessibilityLabel="Sélectionner une couleur"
            >
              <View style={styles.colorDropdownContent}>
                <Text style={styles.dropdownText}>
                  {color || "Sélectionner une couleur"}
                </Text>
                {color && (
                  <View
                    style={[
                      styles.colorPreview,
                      {
                        backgroundColor:
                          availableColors.find((c) => c.name === color)
                            ?.value || "#ccc",
                      },
                    ]}
                  />
                )}
              </View>
              <Ionicons
                name="chevron-down"
                size={20}
                color={theme.colors.text}
              />
            </TouchableOpacity>

            <Modal
              visible={colorModalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => {
                console.log("AddProductScreen - Color modal closed");
                setColorModalVisible(false);
              }}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>
                    Sélectionner une couleur
                  </Text>
                  <FlatList
                    data={availableColors}
                    keyExtractor={(item) => item.name}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.colorDropdownItem}
                        onPress={() => {
                          console.log(
                            "AddProductScreen - Color selected:",
                            item.name
                          );
                          handleColorSelect(item.name);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.colorItemContent}>
                          <View
                            style={[
                              styles.colorCircle,
                              { backgroundColor: item.value },
                            ]}
                          />
                          <Text style={styles.dropdownItemText}>
                            {item.name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      console.log(
                        "AddProductScreen - Color modal close button pressed"
                      );
                      setColorModalVisible(false);
                    }}
                  >
                    <Text style={styles.closeButtonText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>

          {/* Size Input */}
          <View style={styles.formField}>
            <Text style={styles.label}>Taille *</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez la taille (ex: S, M, L, XL)"
              value={size}
              onChangeText={(text) => {
                console.log("AddProductScreen - Size changed:", text);
                setSize(text);
              }}
              autoCapitalize="characters"
              accessibilityLabel="Entrer la taille"
            />
          </View>

          {/* Quantity Input */}
          <View style={styles.formField}>
            <Text style={styles.label}>Quantité *</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez la quantité"
              value={quantity}
              onChangeText={(text) => {
                console.log("AddProductScreen - Quantity changed:", text);
                setQuantity(text);
              }}
              keyboardType="numeric"
              accessibilityLabel="Entrer la quantité"
            />
          </View>

          {/* Price Input */}
          <View style={styles.formField}>
            <Text style={styles.label}>Prix () *</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez le prix"
              value={price}
              onChangeText={(text) => {
                console.log("AddProductScreen - Price changed:", text);
                setPrice(text);
              }}
              keyboardType="decimal-pad"
              accessibilityLabel="Entrer le prix"
            />
          </View>

          {/* Description Input */}
          <View style={styles.formField}>
            <Text style={styles.label}>Description (facultatif)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Entrez une description du produit"
              value={description}
              onChangeText={(text) => {
                console.log(
                  "AddProductScreen - Description changed, length:",
                  text.length
                );
                setDescription(text);
              }}
              multiline
              numberOfLines={4}
              accessibilityLabel="Entrer la description"
            />
          </View>

          {/* Add Product Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={() => {
              console.log("AddProductScreen - Add product button pressed");
              handleAddProduct();
            }}
            disabled={isLoading}
            accessibilityLabel="Ajouter le produit"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <Text style={styles.buttonText}>Ajouter le produit</Text>
            )}
          </TouchableOpacity>

          {/* Reset Button */}
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              console.log("AddProductScreen - Reset button pressed");
              resetForm();
            }}
            disabled={isLoading}
            accessibilityLabel="Réinitialiser le formulaire"
          >
            <Text style={styles.resetButtonText}>Réinitialiser</Text>
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
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backIcon: {
    position: "absolute",
    left: 16,
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.white,
    textAlign: "center",
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  formCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  formField: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.text,
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.white,
    minHeight: 48,
  },
  dropdownButtonDisabled: {
    opacity: 0.6,
    backgroundColor: theme.colors.lightGrey,
  },
  dropdownText: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  colorDropdownContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  colorPreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: 16,
    textAlign: "center",
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  colorDropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  colorItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dropdownItemText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  closeButton: {
    padding: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.white,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 48,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    minHeight: 52,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  resetButton: {
    backgroundColor: theme.colors.lightGrey,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  resetButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginVertical: 20,
    fontStyle: "italic",
  },
});
