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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { login } from "../services/api";
import { theme } from "../constants/theme";
import { RootStackParamList } from "../types";

const { width } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Get device info for login tracking
  const getDeviceName = () => {
    return Platform.OS === "ios" ? "iPhone App" : "Android App";
  };

  const handleLogin = async () => {
    // Input validation
    if (!username.trim() || !password.trim()) {
      Alert.alert("Erreur de validation", "Veuillez remplir tous les champs.", [
        { text: "OK" },
      ]);
      return;
    }

    // Additional validation
    if (username.trim().length < 3) {
      Alert.alert(
        "Erreur de validation",
        "Le nom d'utilisateur doit contenir au moins 3 caractères.",
        [{ text: "OK" }]
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Erreur de validation",
        "Le mot de passe doit contenir au moins 6 caractères.",
        [{ text: "OK" }]
      );
      return;
    }

    const payload = {
      username: username.trim(),
      password,
      deviceName: getDeviceName(),
    };

    setIsLoading(true);

    try {
      console.log("Attempting login with:", {
        username: payload.username,
        deviceName: payload.deviceName,
      });

      const response = await login(payload);

      console.log("Login response:", response.data);

      // Check if the response is successful
      if (!response.data.success) {
        throw new Error(response.data.message || "Échec de la connexion");
      }

      // Extract data from the response - adjust to match your API structure
      const responseData = response.data.data;
      const token = responseData.token;

      // Create user object from the response data
      const user = {
        _id: responseData.id,
        id: responseData.id, // Keep both for compatibility
        name: responseData.name,
        username: responseData.username,
        role: responseData.role,
      };

      // Validate received data
      if (!token) {
        throw new Error("Token non reçu du serveur");
      }

      if (!user.name || !user.username || !user.role) {
        throw new Error("Informations utilisateur incomplètes");
      }

      // Store authentication data
      await Promise.all([
        AsyncStorage.setItem("token", token),
        AsyncStorage.setItem("user", JSON.stringify(user)),
        AsyncStorage.setItem("lastLogin", new Date().toISOString()),
      ]);

      console.log("User logged in successfully:", user.name, user.role);

      // Show success message
      Alert.alert("Connexion réussie", `Bienvenue ${user.name} !`, [
        {
          text: "Continuer",
          onPress: () => {
            // Clear form
            setUsername("");
            setPassword("");

            // Navigate to home
            navigation.reset({
              index: 0,
              routes: [{ name: "Home" }],
            });
          },
        },
      ]);
    } catch (error: any) {
      console.error("Login error:", error);

      let errorMessage = "Échec de la connexion. Veuillez réessayer.";

      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;

        switch (status) {
          case 401:
            errorMessage = "Nom d'utilisateur ou mot de passe incorrect.";
            break;
          case 403:
            errorMessage = "Accès refusé. Contactez l'administrateur.";
            break;
          case 404:
            errorMessage =
              "Service non disponible. Veuillez réessayer plus tard.";
            break;
          case 429:
            errorMessage =
              "Trop de tentatives de connexion. Veuillez attendre.";
            break;
          case 500:
            errorMessage = "Erreur serveur. Veuillez réessayer plus tard.";
            break;
          default:
            errorMessage =
              data?.message || `Erreur ${status}. Veuillez réessayer.`;
        }
      } else if (error.request) {
        // Network error
        errorMessage =
          "Erreur de connexion. Vérifiez votre connexion internet.";
      } else if (error.message) {
        // Custom error message
        errorMessage = error.message;
      }

      Alert.alert("Erreur de connexion", errorMessage, [{ text: "OK" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupRedirect = () => {
    navigation.navigate("Signup");
  };

  const handleForgotPassword = () => {
    Alert.alert(
      "Mot de passe oublié",
      "Contactez votre administrateur pour réinitialiser votre mot de passe.",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.gradientHeader}
      >
        <Ionicons
          name="log-in-outline"
          size={56}
          color={theme.colors.white}
          style={styles.headerIcon}
        />
        <Text style={styles.headerTitle}>Bienvenue</Text>
        <Text style={styles.headerSubtitle}>
          Connectez-vous à votre compte Stokÿ
        </Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Connexion</Text>

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
                placeholderTextColor={theme.colors.text + "80"}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="next"
                onSubmitEditing={() => {
                  // Focus password field if available
                }}
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
                placeholderTextColor={theme.colors.text + "80"}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                returnKeyType="go"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.gradientButton}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.white}
                    />
                    <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                      Connexion...
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons
                      name="log-in-outline"
                      size={22}
                      color={theme.colors.white}
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.buttonText}>Se connecter</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSignupRedirect}
              activeOpacity={0.8}
              disabled={isLoading}
              style={[isLoading && styles.linkDisabled]}
            >
              <Text style={styles.linkText}>
                Pas de compte ? Inscrivez-vous
              </Text>
            </TouchableOpacity>
          </View>

          {/* Development info - remove in production */}
          {__DEV__ && (
            <View style={styles.devInfo}>
              <Text style={styles.devInfoText}>Mode développement</Text>
              <Text style={styles.devInfoSubtext}>
                API: {process.env.NODE_ENV || "development"}
              </Text>
            </View>
          )}
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
  gradientHeader: {
    width: "100%",
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: "center",
    borderBottomLeftRadius: theme.borderRadius.large * 2,
    borderBottomRightRadius: theme.borderRadius.large * 2,
    marginBottom: -theme.spacing.large,
  },
  headerIcon: {
    marginBottom: theme.spacing.small,
  },
  headerTitle: {
    fontSize: theme.fontSizes.title + 10,
    fontWeight: theme.fontWeights.extraBold as any,
    color: theme.colors.white,
    textAlign: "center",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: theme.fontSizes.subtitle + 2,
    color: theme.colors.white,
    textAlign: "center",
    opacity: 0.85,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: theme.spacing.large,
    paddingHorizontal: theme.spacing.medium,
  },
  card: {
    width: width > 400 ? 380 : "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: theme.fontSizes.title,
    fontWeight: theme.fontWeights.bold as any,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.large,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.medium,
    marginVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: 2,
    width: "100%",
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  passwordToggle: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: theme.spacing.small,
    padding: theme.spacing.small,
  },
  forgotPasswordText: {
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.medium as any,
  },
  button: {
    marginVertical: theme.spacing.large,
    width: "100%",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.large,
    borderRadius: theme.borderRadius.medium,
    width: "100%",
    minHeight: 50,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonIcon: {
    marginRight: theme.spacing.medium,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.regular,
    fontWeight: theme.fontWeights.bold as any,
  },
  linkText: {
    fontSize: theme.fontSizes.regular,
    color: theme.colors.primary,
    textAlign: "center",
    marginTop: theme.spacing.medium,
    fontWeight: theme.fontWeights.medium as any,
  },
  linkDisabled: {
    opacity: 0.6,
  },
  devInfo: {
    marginTop: theme.spacing.large,
    padding: theme.spacing.medium,
    backgroundColor: theme.colors.lightGrey,
    borderRadius: theme.borderRadius.small,
    alignItems: "center",
  },
  devInfoText: {
    fontSize: theme.fontSizes.small,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeights.medium as any,
  },
  devInfoSubtext: {
    fontSize: theme.fontSizes.small - 2,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
