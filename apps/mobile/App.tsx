import "./global.css";
import "react-native-gesture-handler";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts as usePlayfair, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from "@expo-google-fonts/playfair-display";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { SpaceMono_400Regular } from "@expo-google-fonts/space-mono";
import { AuthProvider } from "@/auth/AuthContext";
import AuthGate from "@/auth/AuthGate";
import PersonaGate from "@/auth/PersonaGate";
import ProfileGate from "@/auth/ProfileGate";
import BottomTabs from "@/navigation/BottomTabs";
import { colors } from "@/theme/colors";

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, border: colors.line, text: colors.ink, primary: colors.gold },
};

export default function App() {
  const [loaded] = usePlayfair({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceMono_400Regular,
  });

  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer theme={navTheme}>
          <AuthProvider>
            <AuthGate>
              <PersonaGate>
                <ProfileGate>
                  <BottomTabs />
                </ProfileGate>
              </PersonaGate>
            </AuthGate>
          </AuthProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
