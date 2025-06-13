import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import ModalComponent from "react-native-modal";
import { theme } from "../constants/theme";
import { RootStackParamList } from "../types";
import { productColors } from "../constants/colors"; // <-- Use shared palette

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const user = {
  email: "demo@stoky.com",
  role: "admin",
};

const products = [
  {
    id: "1",
    name: "Veste",
    category: "Chemise",
    quantity: 50,
    subCategory: "Polo",
    color: "Marron",
    size: "Moyen",
  },
  {
    id: "2",
    name: "Chaussures",
    category: "Chemise",
    quantity: 20,
    subCategory: "T-Shirt",
    color: "Blanc",
    size: "Grand",
  },
  {
    id: "3",
    name: "Pantalon",
    category: "Pantalon",
    quantity: 15,
    subCategory: "Jeans",
    color: "Bleu",
    size: "Petit",
  },
];

// Use the shared color palette everywhere
const colors = productColors;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [menuVisible, setMenuVisible] = useState(false);
  const menuAnim = useState(new Animated.Value(0))[0];

  const [filterVisible, setFilterVisible] = useState(false);
  const [filter, setFilter] = useState({
    category: "",
    subCategory: "",
    color: "",
    size: "",
  });

  // Filter modal dropdown/modal states
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [subCategoryModalVisible, setSubCategoryModalVisible] = useState(false);
  const [sizeModalVisible, setSizeModalVisible] = useState(false);

  const { width } = useWindowDimensions();

  const categories = ["Chaussures", "Chemise", "Pantalon", "Veste"];
  const subCategories: { [key: string]: string[] } = {
    Chaussures: ["Baskets", "Bottes", "Sandales"],
    Chemise: ["T-Shirt", "Polo", "Pull"],
    Pantalon: ["Jeans", "Chinos", "Short"],
    Veste: ["Blazer", "Hoodie", "Manteau"],
  };
  const sizes = ["XS", "S", "M", "L", "XL", "Petit", "Moyen", "Grand"];
  const subCategoryOptions =
    filter.category && subCategories[filter.category]
      ? subCategories[filter.category]
      : [];

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
      accessibilityLabel={`Sélectionner ${item}`}
    >
      <Text style={styles.dropdownItemText}>{item}</Text>
    </TouchableOpacity>
  );

  const toggleMenu = () => {
    setMenuVisible((prev) => !prev);
    Animated.timing(menuAnim, {
      toValue: menuVisible ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const menuTranslateY = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
  });

  const navigateTo = (screen: keyof RootStackParamList) => {
    navigation.navigate(screen);
  };

  const handleLogout = () => {
    navigation.replace("Login");
  };

  // Filtering logic
  const filteredProducts = products.filter((p) => {
    return (
      (!filter.category ||
        p.category.toLowerCase().includes(filter.category.toLowerCase())) &&
      (!filter.subCategory ||
        (p.subCategory &&
          p.subCategory
            .toLowerCase()
            .includes(filter.subCategory.toLowerCase()))) &&
      (!filter.color ||
        (p.color &&
          p.color.toLowerCase().includes(filter.color.toLowerCase()))) &&
      (!filter.size ||
        (p.size && p.size.toLowerCase().includes(filter.size.toLowerCase())))
    );
  });

  // Table rendering (no name column, color as circle)
  const renderProduct = ({ item }: { item: (typeof products)[0] }) => (
    <View style={styles.tableRow}>
      <Text
        style={[styles.cell, styles.categoryCell]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {item.category}
      </Text>
      <Text
        style={[styles.cell, styles.subCategoryCell]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {item.subCategory}
      </Text>
      <View
        style={[
          styles.cell,
          styles.colorCell,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor:
              colors.find(
                (c) => c.name.toLowerCase() === item.color.toLowerCase()
              )?.value || "#ccc",
            borderWidth: 1,
            borderColor: "#ddd",
            alignSelf: "center",
          }}
        />
      </View>
      <Text
        style={[styles.cell, styles.sizeCell]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {item.size}
      </Text>
      <Text
        style={[styles.cell, styles.qtyCell]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {item.quantity}
      </Text>
    </View>
  );

  // Responsive modal width
  const modalWidth = width > 500 ? 400 : width * 0.95;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name="home-outline"
          size={Math.max(24, width * 0.08)}
          color={theme.colors.primary}
        />
        <View>
          <Text
            style={[styles.title, { fontSize: Math.max(16, width * 0.045) }]}
          >
            Bienvenue, {user.email}
          </Text>
          <Text
            style={[styles.subtitle, { fontSize: Math.max(12, width * 0.035) }]}
          >
            Rôle : {user.role}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons
            name="filter-outline"
            size={Math.max(24, width * 0.07)}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.categoryCell]}>
            Catégorie
          </Text>
          <Text style={[styles.headerCell, styles.subCategoryCell]}>
            Sous-catégorie
          </Text>
          <Text style={[styles.headerCell, styles.colorCell]}>Couleur</Text>
          <Text style={[styles.headerCell, styles.sizeCell]}>Taille</Text>
          <Text style={[styles.headerCell, styles.qtyCell]}>Qté</Text>
        </View>
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            filteredProducts.length === 0 ? styles.emptyList : undefined
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="cube-outline"
                size={Math.max(48, width * 0.13)}
                color={theme.colors.text + "80"}
              />
              <Text style={styles.emptyText}>Aucun produit trouvé</Text>
              <Text style={styles.emptySubText}>
                Ajoutez des produits pour les voir listés ici
              </Text>
            </View>
          }
        />
      </View>

      {/* Floating Menu Button */}
      <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
        <Ionicons name="menu" size={32} color={theme.colors.white} />
      </TouchableOpacity>

      {/* Animated Floating Menu */}
      {menuVisible && (
        <Animated.View
          style={[
            styles.menuContainer,
            {
              transform: [{ translateY: menuTranslateY }],
              width: width > 400 ? 320 : width * 0.85,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              toggleMenu();
              navigateTo("AddProduct");
            }}
          >
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.menuText}>Ajouter un produit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              toggleMenu();
              navigateTo("BarcodeScanner");
            }}
          >
            <Ionicons
              name="barcode-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.menuText}>Scanner un code-barres</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              toggleMenu();
              navigateTo("DeleteArticle");
            }}
          >
            <Ionicons
              name="trash-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.menuText}>Supprimer un article</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              toggleMenu();
              navigateTo("AnalyticsScreen");
            }}
          >
            <Ionicons name="analytics" size={24} color={theme.colors.primary} />
            <Text style={styles.menuText}>Voix les analyse de stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              toggleMenu();
              navigateTo("FianancialAnalytics");
            }}
          >
            <Ionicons
              name="stats-chart"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.menuText}>Analyse Financière</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              toggleMenu();
              navigateTo("AddCategory");
            }}
          >
            <Ionicons
              name="folder-open-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.menuText}>Ajouter une catégorie</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              toggleMenu();
              handleLogout();
            }}
          >
            <Ionicons
              name="log-out-outline"
              size={24}
              color={theme.colors.error}
            />
            <Text style={[styles.menuText, { color: theme.colors.error }]}>
              Déconnexion
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Filter Modal */}
      {filterVisible && (
        <View style={styles.filterModalOverlay}>
          <View style={[styles.filterModal, { width: modalWidth }]}>
            <Text style={styles.filterTitle}>Filtrer les produits</Text>

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
                    !filter.category && { color: theme.colors.text + "80" },
                  ]}
                >
                  {filter.category || "Sélectionnez une catégorie"}
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
                          setFilter((f) => ({
                            ...f,
                            category: value,
                            subCategory: "",
                          }));
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
                  !filter.category && styles.dropdownButtonDisabled,
                ]}
                onPress={() =>
                  filter.category && setSubCategoryModalVisible(true)
                }
                disabled={!filter.category}
                accessibilityLabel="Sélectionner une sous-catégorie"
              >
                <Text
                  style={[
                    styles.dropdownText,
                    !filter.subCategory && { color: theme.colors.text + "80" },
                  ]}
                >
                  {filter.subCategory || "Sélectionnez une sous-catégorie"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={
                    filter.category
                      ? theme.colors.text
                      : theme.colors.text + "80"
                  }
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
                          setFilter((f) => ({
                            ...f,
                            subCategory: value,
                          }));
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
                        filter.color === c.name && styles.colorOptionSelected,
                      ]}
                      onPress={() => {
                        setFilter((f) => ({ ...f, color: c.name }));
                        animateColorPress(c.name);
                      }}
                      accessibilityLabel={`Sélectionner la couleur ${c.name}`}
                    >
                      {filter.color === c.name && (
                        <Ionicons
                          name="checkmark"
                          size={24}
                          color={
                            c.name === "Blanc"
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
              {filter.color && (
                <Text style={styles.selectedColorText}>
                  Sélectionné : {filter.color}
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
                    !filter.size && { color: theme.colors.text + "80" },
                  ]}
                >
                  {filter.size || "Sélectionnez une taille"}
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
                          setFilter((f) => ({
                            ...f,
                            size: value,
                          }));
                          setSizeModalVisible(false);
                        },
                      })
                    }
                  />
                </View>
              </ModalComponent>
            </View>

            {/* Buttons */}
            <View style={styles.filterButtonsRow}>
              <TouchableOpacity
                style={[styles.filterButtonModal, { marginRight: 8 }]}
                onPress={() => setFilterVisible(false)}
              >
                <Text
                  style={{ color: theme.colors.white, textAlign: "center" }}
                >
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButtonModal, { marginLeft: 8 }]}
                onPress={() => setFilterVisible(false)}
              >
                <Text
                  style={{ color: theme.colors.white, textAlign: "center" }}
                >
                  Appliquer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    elevation: 2,
    position: "relative",
  },
  filterButton: {
    position: "absolute",
    right: 16,
    top: Platform.OS === "ios" ? 16 : 18,
    zIndex: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.primary,
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 12,
  },
  inventoryTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 16,
    marginTop: 8,
  },
  tableContainer: {
    flex: 1,
    marginTop: 8,
    paddingHorizontal: 8,
    alignSelf: "center",
    width: "100%",
    maxWidth: 500,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: theme.colors.white,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary + "40",
    borderRadius: 8,
    marginBottom: 4,
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderRadius: 8,
    marginVertical: 2,
    paddingVertical: 8,
  },
  headerCell: {
    flex: 1,
    fontWeight: "700",
    fontSize: 13,
    color: theme.colors.primary,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  cell: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  nameCell: { flex: 1.5, minWidth: 80, maxWidth: 120 },
  categoryCell: { flex: 1, minWidth: 70, maxWidth: 100 },
  subCategoryCell: { flex: 1, minWidth: 70, maxWidth: 100 },
  colorCell: { flex: 1, minWidth: 50, maxWidth: 70 },
  sizeCell: { flex: 1, minWidth: 40, maxWidth: 60 },
  qtyCell: { flex: 0.7, minWidth: 35, maxWidth: 50 },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.text + "DD",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 12,
    color: theme.colors.text + "99",
    marginTop: 8,
    textAlign: "center",
  },
  menuButton: {
    position: "absolute",
    right: 20,
    bottom: 70,
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 50,
    elevation: 6,
    zIndex: 101,
  },
  menuContainer: {
    position: "absolute",
    right: 20,
    bottom: 140,
    backgroundColor: theme.colors.white,
    padding: 16,
    borderRadius: 16,
    elevation: 10,
    zIndex: 101,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  menuText: {
    fontSize: 15,
    marginLeft: 12,
    color: theme.colors.text,
  },
  filterModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },
  filterModal: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 24,
    elevation: 10,
    maxWidth: 500,
    minWidth: 240,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: 16,
    textAlign: "center",
  },
  formField: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: "600",
    marginBottom: 6,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
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
    fontSize: 13,
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
    padding: 18,
    maxHeight: "50%",
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.inputBackground,
  },
  dropdownItemText: {
    fontSize: 13,
    color: theme.colors.text,
  },
  colorPalette: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    marginVertical: 6,
    marginBottom: 12,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "transparent",
    margin: 6,
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
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    textAlign: "center",
    textAlignVertical: "center",
  },
  selectedColorText: {
    fontSize: 11,
    color: theme.colors.text,
    marginTop: 4,
    textAlign: "center",
  },
  filterButtonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  filterButtonModal: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
  },
});
