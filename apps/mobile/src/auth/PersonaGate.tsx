import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { getMyAnimalTrait, saveMyAnimalTrait } from "@/data/repo";
import { PersonaResult } from "@/data/persona";
import PersonaQuizScreen from "@/screens/PersonaQuizScreen";
import { colors } from "@/theme/colors";
import { useAuth } from "./AuthContext";

// Sits between AuthGate and the app. Once a candidate is signed in, they must
// complete the Animal Persona quiz before they can enter. Completion is
// remembered (Supabase profiles.animal_trait, or AsyncStorage in demo mode),
// so it only blocks the first sign-in after creating the account. 
export default function PersonaGate({ children }: { children: React.ReactNode }) {
  const { authed } = useAuth();
  const [status, setStatus] = useState<"checking" | "needed" | "done">("checking");

  useEffect(() => {
    if (!authed) return;
    let alive = true;
    getMyAnimalTrait()
      .then((trait) => alive && setStatus(trait ? "done" : "needed"))
      .catch(() => alive && setStatus("needed"));
    return () => {
      alive = false;
    };
  }, [authed]);

  const handleComplete = useCallback(async (result: PersonaResult) => {
    try {
      await saveMyAnimalTrait(result.trait, result.scores);
    } catch (e) {
      // Let the user in either way — their result is computed — but never hide
      // the failure: if the write doesn't land, the quiz reappears next sign-in.
      console.warn("Failed to save animal persona:", e);
    }
    setStatus("done");
  }, []);

  // AuthGate only renders us when authed, but guard just in case.
  if (!authed) return <>{children}</>;

  if (status === "checking") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (status === "needed") {
    return <PersonaQuizScreen onComplete={handleComplete} />;
  }

  return <>{children}</>;
}