import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import SignInScreen from "@/screens/SignInScreen";
import SignUpScreen from "@/screens/SignUpScreen";
import { colors } from "@/theme/colors";
import { useAuth } from "./AuthContext";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { authed, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (authed) return <>{children}</>;

  return mode === "signin" ? (
    <SignInScreen onSwitch={() => setMode("signup")} />
  ) : (
    <SignUpScreen onSwitch={() => setMode("signin")} />
  );
}
