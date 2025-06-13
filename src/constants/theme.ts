import { productColors } from "./colors";

export const theme = {
  colors: {
    primary: "#3B82F6", // Blue for buttons and highlights
    secondary: "#60A5FA", // Lighter blue for secondary elements
    background: "#F3F4F6", // Light gray background
    text: "#1F2937", // Dark gray for text (improved contrast)
    textSecondary: "#6B7280", // Lighter gray for secondary text
    inputBackground: "#FFFFFF", // White for input fields
    inputBorder: "#D1D5DB", // Light gray for input borders
    error: "#EF4444", // Red for errors
    success: "#10B981", // Green for success
    white: "#FFFFFF",
    black: "#000000",
    modalOverlay: "rgba(0, 0, 0, 0.5)", // Semi-transparent black for modals
    cardBackground: "#FFFFFF", // White for cards
    // Integrate product colors for product selection
    productColors: productColors.reduce(
      (acc, color) => ({ ...acc, [color.name.toLowerCase()]: color.value }),
      {} as Record<string, string>
    ),
  },
  spacing: {
    xs: 4,
    small: 8,
    medium: 16,
    large: 24,
    xl: 32,
  },
  fontSizes: {
    small: 12,
    regular: 16,
    subtitle: 18,
    title: 24,
    largeTitle: 28,
  },
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
  },
  fontWeights: {
    regular: "400",
    medium: "500",
    bold: "700",
    extraBold: "800",
  },
  shadows: {
    small: {
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    medium: {
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    large: {
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    disabledOpacity: 0.6,
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
  },
  modal: {
    content: {
      backgroundColor: "#FFFFFF",
      borderRadius: 12,
      padding: 16,
      width: 320, // Replace "80%" with a numeric value (e.g., 320)
      maxHeight: 400,
    },
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
  },
  // Support for dark mode
  dark: {
    colors: {
      primary: "#3B82F6",
      secondary: "#60A5FA",
      background: "#1F2937", // Dark gray background
      text: "#F3F4F6", // Light gray for text
      textSecondary: "#9CA3AF", // Lighter gray for secondary text
      inputBackground: "#374151", // Dark gray for input fields
      inputBorder: "#4B5563", // Darker gray for input borders
      error: "#F87171",
      success: "#34D399",
      white: "#FFFFFF",
      black: "#000000",
      modalOverlay: "rgba(0, 0, 0, 0.7)",
      cardBackground: "#374151",
      productColors: productColors.reduce(
        (acc, color) => ({ ...acc, [color.name.toLowerCase()]: color.value }),
        {} as Record<string, string>
      ),
    },
  },
};