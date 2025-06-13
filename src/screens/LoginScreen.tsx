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
  const STATIC_USERNAME = "admin";
  const STATIC_PASSWORD = "123456";
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.", [
        { text: "OK" },
      ]);
      return;
    }

    // STATIC LOGIN CHECK
    if (username === "admin" && password === "123456") {
      try {
        await AsyncStorage.setItem("token", "STATIC_TOKEN");
        navigation.navigate("Home");
      } catch (err) {
        Alert.alert("Erreur", "Échec du stockage local.", [{ text: "OK" }]);
      }
      return;
    }

    const payload = { username, password, deviceName: "MobileApp" };

    setIsLoading(true);
    try {
      const response = await login(payload);
      const { token } = response.data.data;
      if (!token) throw new Error("Token non reçu du serveur.");
      await AsyncStorage.setItem("token", token);
      navigation.navigate("Home");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Échec de la connexion. Veuillez réessayer.";
      Alert.alert("Erreur", errorMessage, [{ text: "OK" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupRedirect = () => {
    navigation.navigate("Signup");
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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
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
                secureTextEntry
              />
            </View>

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
                  <ActivityIndicator size="small" color={theme.colors.white} />
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
            >
              <Text style={styles.linkText}>
                Pas de compte ? Inscrivez-vous
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
  },
  card: {
    width: width > 400 ? 380 : "92%",
    backgroundColor: "#FFFFFF", // white
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
});
