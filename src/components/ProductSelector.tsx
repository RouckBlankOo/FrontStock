import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { getProducts, Product } from "../services/api";

interface ProductSelectorProps {
  selectedProductId: string;
  onProductSelected: (productId: string) => void;
}

const ProductSelector = ({
  selectedProductId,
  onProductSelected,
}: ProductSelectorProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const LIMIT = 20; // Items per page

  useEffect(() => {
    if (isDropdownOpen) {
      fetchProducts();
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    if (selectedProductId && products.length > 0) {
      const product = products.find((p) => p._id === selectedProductId);
      if (product) {
        setSelectedProduct(product);
      } else {
        // If product not in current list, fetch it individually
        fetchProductById(selectedProductId);
      }
    }
  }, [selectedProductId, products]);

  useEffect(() => {
    // Reset and fetch products when search query changes
    if (isDropdownOpen) {
      setPage(1);
      setProducts([]);
      setHasMore(true);
      fetchProducts(true);
    }
  }, [searchQuery]);

  const fetchProductById = async (id: string) => {
    try {
      const response = await getProducts({ page: 1, limit: 1, name: id });

      if (response.data.success && response.data.data.products.length > 0) {
        setSelectedProduct(response.data.data.products[0]);
      }
    } catch (err) {
      console.error("Error fetching individual product:", err);
    }
  };

  const fetchProducts = async (isNewSearch = false) => {
    if (isNewSearch) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentPage = isNewSearch ? 1 : page;
      const params = {
        name: searchQuery,
        page: currentPage,
        limit: LIMIT,
        sortBy: "name",
        order: "asc" as const,
      };

      const response = await getProducts(params);

      if (response.data.success && response.data.data) {
        const { products: fetchedProducts, totalPages } = response.data.data;

        if (isNewSearch) {
          setProducts(fetchedProducts);
        } else {
          setProducts((prev) => [...prev, ...fetchedProducts]);
        }

        setHasMore(currentPage < totalPages);
        setPage(currentPage + 1);
        setError("");
      } else {
        setError("Format de réponse invalide");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Impossible de charger les produits. Veuillez réessayer.");
    } finally {
      if (isNewSearch) {
        setLoading(false);
      }
      setLoadingMore(false);
    }
  };

  // Calculate total stock quantity from stocks array
  const getTotalStock = (product: Product): number => {
    if (!product.stocks || product.stocks.length === 0) return 0;
    return product.stocks.reduce(
      (sum, stock) => sum + (stock.quantity || 0),
      0
    );
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    onProductSelected(product._id);
    setIsDropdownOpen(false);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchProducts();
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#0000ff" />
        <Text style={styles.loadingMoreText}>Chargement...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Produit</Text>

      <TouchableOpacity
        style={styles.selectedProductContainer}
        onPress={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un produit..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setIsDropdownOpen(true)}
        />
        <Text style={styles.dropdownIcon}>{isDropdownOpen ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {selectedProduct && !isDropdownOpen && (
        <View style={styles.selectedProduct}>
          <Text style={styles.selectedProductText}>
            {selectedProduct.name}{" "}
            {selectedProduct.sku ? `(${selectedProduct.sku})` : ""}
          </Text>
          <Text style={styles.stockInfo}>
            En stock:{" "}
            <Text style={styles.stockQuantity}>
              {getTotalStock(selectedProduct)}
            </Text>
          </Text>
        </View>
      )}

      {isDropdownOpen && (
        <View style={styles.dropdown}>
          {loading && products.length === 0 ? (
            <ActivityIndicator
              size="small"
              color="#0000ff"
              style={styles.loader}
            />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : products.length === 0 ? (
            <Text style={styles.noResultsText}>Aucun produit trouvé</Text>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item, index) => item._id || `product-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.productItem,
                    selectedProductId === item._id &&
                      styles.selectedProductItem,
                  ]}
                  onPress={() => handleSelectProduct(item)}
                >
                  <Text style={styles.productName}>{item.name}</Text>
                  {item.sku && (
                    <Text style={styles.productSku}>SKU: {item.sku}</Text>
                  )}

                  <Text style={styles.productStock}>
                    Stock:{" "}
                    <Text
                      style={
                        getTotalStock(item) > 0
                          ? styles.inStock
                          : styles.outOfStock
                      }
                    >
                      {getTotalStock(item)}
                    </Text>
                  </Text>

                  {item.category && (
                    <Text style={styles.productCategory}>
                      {typeof item.category === "string"
                        ? item.category
                        : (item.category as any).name || item.category}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              style={styles.productList}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    position: "relative",
    zIndex: 100,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  selectedProductContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
  },
  searchInput: {
    flex: 1,
  },
  dropdownIcon: {
    fontSize: 16,
    marginLeft: 10,
  },
  dropdown: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    maxHeight: 300,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  productList: {
    maxHeight: 300,
  },
  productItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedProductItem: {
    backgroundColor: "#f0f0f0",
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  productSku: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  productStock: {
    fontSize: 14,
    marginTop: 2,
  },
  productCategory: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
    fontStyle: "italic",
  },
  inStock: {
    color: "green",
  },
  outOfStock: {
    color: "red",
  },
  errorText: {
    color: "red",
    padding: 15,
    textAlign: "center",
  },
  noResultsText: {
    padding: 15,
    textAlign: "center",
    color: "#666",
  },
  selectedProduct: {
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
    marginTop: 5,
  },
  selectedProductText: {
    fontSize: 16,
  },
  loadingFooter: {
    padding: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  loadingMoreText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
  },
  loader: {
    padding: 15,
  },
  stockInfo: {
    fontSize: 14,
    marginTop: 4,
  },
  stockQuantity: {
    fontWeight: "bold",
  },
});

export default ProductSelector;
