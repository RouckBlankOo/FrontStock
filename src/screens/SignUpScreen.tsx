import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { signup } from "../services/api";
import { theme } from "../constants/theme";
import { RootStackParamList } from "../types";

const { width } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SignupScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"admin" | "caissier">("caissier");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !username || !password || !confirmPassword) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.", [
        { text: "OK" },
      ]);
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas.", [
        { text: "OK" },
      ]);
      return;
    }

    const payload = { name, username, password, role };

    setIsLoading(true);
    try {
      const response = await signup(payload);
      const { token } = response.data.data;
      if (!token) throw new Error("Token non reçu du serveur.");
      await AsyncStorage.setItem("token", token);
      navigation.navigate("Home");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Échec de la création du compte. Veuillez réessayer.";
      Alert.alert("Erreur", errorMessage, [{ text: "OK" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigation.navigate("Login");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Ionicons
          name="person-add-outline"
          size={56}
          color={theme.colors.white}
          style={styles.headerIcon}
        />
        <Text style={styles.headerTitle}>Créer un compte</Text>
        <Text style={styles.headerSubtitle}>
          Rejoignez Stokÿ dès aujourd'hui
        </Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={22}
                color={theme.colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nom complet"
                placeholderTextColor={theme.colors.textSecondary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="person-circle-outline"
                size={22}
                color={theme.colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nom d'utilisateur"
                placeholderTextColor={theme.colors.textSecondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color={theme.colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor={theme.colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color={theme.colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor={theme.colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>Rôle :</Text>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === "caissier" && styles.roleButtonSelected,
                ]}
                onPress={() => setRole("caissier")}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.roleText,
                    role === "caissier" && styles.roleTextSelected,
                  ]}
                >
                  Caissier
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === "admin" && styles.roleButtonSelected,
                ]}
                onPress={() => setRole("admin")}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.roleText,
                    role === "admin" && styles.roleTextSelected,
                  ]}
                >
                  Admin
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Text style={styles.buttonText}>Créer un compte</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLoginRedirect} activeOpacity={0.8}>
              <Text style={styles.linkText}>
                Vous avez déjà un compte ? Connectez-vous
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.large,
    alignItems: "center",
    borderBottomLeftRadius: theme.borderRadius.large,
    borderBottomRightRadius: theme.borderRadius.large,
    marginBottom: theme.spacing.medium,
    ...theme.shadows.medium,
  },
  headerIcon: {
    marginBottom: theme.spacing.small,
  },
  headerTitle: {
    fontSize: theme.fontSizes.largeTitle,
    fontWeight: "800", // Replace with a valid fontWeight value
    color: theme.colors.white,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: theme.fontSizes.subtitle,
    color: theme.colors.white,
    textAlign: "center",
    opacity: 0.85,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: theme.spacing.large,
  },
  card: {
    ...theme.card,
    width: width > 400 ? 380 : "92%",
    marginTop: theme.spacing.large,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.medium,
    marginVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.medium,
    backgroundColor: theme.colors.inputBackground,
  },
  inputIcon: {
    marginRight: theme.spacing.small,
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.medium,
    fontSize: theme.fontSizes.regular,
    color: theme.colors.text,
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: theme.spacing.medium,
    justifyContent: "center",
  },
  roleLabel: {
    fontSize: theme.fontSizes.regular,
    color: theme.colors.text,
    fontWeight: "500", // Replace with a valid fontWeight value
    marginRight: theme.spacing.medium,
  },
  roleButton: {
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.large,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    marginHorizontal: theme.spacing.small,
    backgroundColor: theme.colors.inputBackground,
    ...theme.shadows.small,
  },
  roleButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  roleText: {
    color: theme.colors.text,
    fontWeight: "500", // Replace with a valid fontWeight value
    fontSize: theme.fontSizes.regular,
  },
  roleTextSelected: {
    color: theme.colors.white,
    fontWeight: "bold",
  },
  button: {
    ...theme.button,
    backgroundColor: theme.colors.primary,
    marginVertical: theme.spacing.large,
  },
  buttonDisabled: {
    opacity: theme.button.disabledOpacity,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.regular,
    fontWeight: "bold",
    textAlign: "center",
  },
  linkText: {
    fontSize: theme.fontSizes.regular,
    color: theme.colors.primary,
    textAlign: "center",
    marginTop: theme.spacing.medium,
    fontWeight: "500", // Adjusted to match a valid fontWeight value
  },
});
