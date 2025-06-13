import React, { useState, useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Animated,
  FlatList,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { v4 as uuidv4 } from "uuid";
import ModalComponent from "react-native-modal";
import { theme } from "../constants/theme";
import { RootStackParamList, Product } from "../types";
import { addProduct } from "../services/api";
import "react-native-get-random-values";
import { productColors } from "../constants/colors";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AddProductScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [category, setCategory] = useState<string>("");
  const [subCategory, setSubCategory] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [size, setSize] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [isLoading, setIsLoading] = useState(false);
  const [price, setPrice] = useState<string>("");

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [subCategoryModalVisible, setSubCategoryModalVisible] = useState(false);
  const [sizeModalVisible, setSizeModalVisible] = useState(false);

  const buttonScale = useState(new Animated.Value(1))[0];
  const colors = productColors;

  const colorScales = useMemo(
    () =>
      colors.reduce(
        (acc, c) => {
          acc[c.name] = new Animated.Value(1);
          return acc;
        },
        {} as { [key: string]: Animated.Value }
      ),
    [colors]
  );

  const categories = ["Shoes", "Shirt", "Pants", "Jacket"];
  const subCategories: { [key: string]: string[] } = {
    Shoes: ["Sneakers", "Boots", "Sandals"],
    Shirt: ["T-Shirt", "Polo", "Sweater"],
    Pants: ["Jeans", "Chinos", "Shorts"],
    Jacket: ["Blazer", "Hoodie", "Coat"],
  };

  const sizes = ["XS", "S", "M", "L", "XL"];

  const subCategoryOptions =
    category && subCategories[category] ? subCategories[category] : [];

  const handleGenerateBarcode = async () => {
    if (!category || !subCategory || !color || !size || !quantity) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    const quantityNum = Number(quantity);
    if (isNaN(quantityNum) || quantityNum < 0) {
      Alert.alert("Error", "Quantity must be a valid non-negative number.");
      return;
    }

    setIsLoading(true);
    try {
      const barcode = uuidv4().replace(/-/g, "").slice(0, 12);
      const newProduct: Product = {
        id: "",
        barcode,
        name: `${category} ${subCategory}`,
        category,
        subCategory,
        color,
        size,
        quantity: quantityNum,
        price: Number(price) || 0,
      };

      await addProduct(newProduct);

      Alert.alert("Success", `Product added with barcode: ${barcode}`, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add product.";
      console.error("Error adding product:", error);
      Alert.alert("Error", `${errorMessage} Please try again.`);
    } finally {
      setIsLoading(false);
    }
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

  const animateColorPress = (colorName: string) => {
    Animated.sequence([
      Animated.timing(colorScales[colorName], {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(colorScales[colorName], {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(colorScales[colorName], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
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
      accessibilityLabel={`Select ${item}`}
    >
      <Text style={styles.dropdownItemText}>{item}</Text>
    </TouchableOpacity>
  );

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
            accessibilityLabel="Retour"
          >
            <Ionicons
              name="arrow-back-outline"
              size={28}
              color={theme.colors.background}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Ajouter un produit</Text>
        </View>
      </LinearGradient>

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
              <Text
                style={[
                  styles.dropdownText,
                  !category && { color: theme.colors.text + "80" },
                ]}
              >
                {category || "Sélectionnez une catégorie"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={theme.colors.text}
              />
            </TouchableOpacity>
            <ModalComponent
              isVisible={categoryModalVisible}
              onBackdropPress={() => setCategoryModalVisible(false)}
              style={styles.modal}
            >
              <View style={styles.modalContent}>
                <FlatList
                  data={categories}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) =>
                    renderDropdownItem({
                      item,
                      onPress: (value) => {
                        setCategory(value);
                        setSubCategory("");
                        setCategoryModalVisible(false);
                      },
                    })
                  }
                />
              </View>
            </ModalComponent>
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
              <Text
                style={[
                  styles.dropdownText,
                  !subCategory && { color: theme.colors.text + "80" },
                ]}
              >
                {subCategory || "Sélectionnez une sous-catégorie"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={category ? theme.colors.text : theme.colors.text + "80"}
              />
            </TouchableOpacity>
            <ModalComponent
              isVisible={subCategoryModalVisible}
              onBackdropPress={() => setSubCategoryModalVisible(false)}
              style={styles.modal}
            >
              <View style={styles.modalContent}>
                <FlatList
                  data={subCategoryOptions}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) =>
                    renderDropdownItem({
                      item,
                      onPress: (value) => {
                        setSubCategory(value);
                        setSubCategoryModalVisible(false);
                      },
                    })
                  }
                />
              </View>
            </ModalComponent>
          </View>

          {/* Color Palette */}
          <View style={styles.formField}>
            <Text style={styles.label}>Couleur</Text>
            <View style={styles.colorPalette}>
              {colors.map((c) => (
                <Animated.View
                  key={c.name}
                  style={{
                    transform: [{ scale: colorScales[c.name] }],
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.colorOption,
                      { backgroundColor: c.value },
                      color === c.name && styles.colorOptionSelected,
                    ]}
                    onPress={() => {
                      setColor(c.name);
                      animateColorPress(c.name);
                    }}
                    accessibilityLabel={`Sélectionner la couleur ${c.name}`}
                  >
                    {color === c.name && (
                      <Ionicons
                        name="checkmark"
                        size={24}
                        color={
                          c.name === "White"
                            ? theme.colors.primary
                            : theme.colors.background
                        }
                        style={styles.colorCheckIcon}
                      />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
            {color && (
              <Text style={styles.selectedColorText}>
                Sélectionné : {color}
              </Text>
            )}
          </View>

          {/* Size Dropdown */}
          <View style={styles.formField}>
            <Text style={styles.label}>Taille</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setSizeModalVisible(true)}
              accessibilityLabel="Sélectionner une taille"
            >
              <Text
                style={[
                  styles.dropdownText,
                  !size && { color: theme.colors.text + "80" },
                ]}
              >
                {size || "Sélectionnez une taille"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={theme.colors.text}
              />
            </TouchableOpacity>
            <ModalComponent
              isVisible={sizeModalVisible}
              onBackdropPress={() => setSizeModalVisible(false)}
              style={styles.modal}
            >
              <View style={styles.modalContent}>
                <FlatList
                  data={sizes}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) =>
                    renderDropdownItem({
                      item,
                      onPress: (value) => {
                        setSize(value);
                        setSizeModalVisible(false);
                      },
                    })
                  }
                />
              </View>
            </ModalComponent>
          </View>

          {/* Quantity Input */}
          <View style={styles.formField}>
            <Text style={styles.label}>Quantité</Text>
            <TextInput
              style={styles.input}
              placeholder="Quantité"
              placeholderTextColor={theme.colors.text + "80"}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              accessibilityLabel="Entrer la quantité du produit"
            />
          </View>

          {/* Prix Input */}
          <View style={styles.formField}>
            <Text style={styles.label}>Prix par article</Text>
            <TextInput
              style={styles.input}
              placeholder="Prix:0 DT"
              placeholderTextColor={theme.colors.text + "80"}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              accessibilityLabel="Entrer le prix du produit"
            />
          </View>

          {/* Generate Barcode Button */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={() => {
                animateButtonPress();
                handleGenerateBarcode();
              }}
              disabled={isLoading}
              accessibilityLabel="Générer un code-barres pour le produit"
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.gradientButton}
              >
                <Ionicons
                  name="barcode-outline"
                  size={24}
                  color={theme.colors.background}
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonText}>Générer le code-barres</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background + "10",
  },
  header: {
    padding: theme.spacing.large,
    paddingTop: theme.spacing.large + 10,
    borderBottomLeftRadius: theme.borderRadius.large,
    borderBottomRightRadius: theme.borderRadius.large,
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
    left: theme.spacing.medium,
  },
  title: {
    fontSize: theme.fontSizes.title + 6,
    fontWeight: "bold",
    color: theme.colors.background,
    textAlign: "center",
  },
  scrollContainer: {
    padding: theme.spacing.large,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.large,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    marginTop: -40,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.primary + "22",
  },
  formField: {
    marginBottom: theme.spacing.large + 4,
  },
  label: {
    fontSize: theme.fontSizes.subtitle,
    fontWeight: "600",
    color: theme.colors.primary,
    marginBottom: theme.spacing.small,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.medium,
    borderWidth: 1,
    borderColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.white,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  dropdownButtonDisabled: {
    opacity: 0.5,
  },
  dropdownText: {
    fontSize: theme.fontSizes.regular,
    color: theme.colors.text,
  },
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.large,
    borderTopRightRadius: theme.borderRadius.large,
    padding: theme.spacing.large,
    maxHeight: "50%",
  },
  dropdownItem: {
    padding: theme.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.inputBackground,
  },
  dropdownItemText: {
    fontSize: theme.fontSizes.regular,
    color: theme.colors.text,
  },
  colorPalette: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    marginVertical: theme.spacing.small,
    marginBottom: theme.spacing.medium,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "transparent",
    margin: theme.spacing.small,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.13,
    shadowRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  colorOptionSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  colorCheckIcon: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    textAlign: "center",
    textAlignVertical: "center",
  },
  selectedColorText: {
    fontSize: theme.fontSizes.small,
    color: theme.colors.text,
    marginTop: theme.spacing.small,
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: theme.spacing.medium,
    borderWidth: 1,
    borderColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.white,
    fontSize: theme.fontSizes.regular,
    color: theme.colors.text,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  button: {
    marginVertical: theme.spacing.large + 4,
    borderRadius: theme.borderRadius.medium,
    overflow: "hidden",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.medium + 2,
    borderRadius: theme.borderRadius.medium,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 4,
  },
  buttonIcon: {
    marginRight: theme.spacing.small,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: theme.fontSizes.button + 2,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
