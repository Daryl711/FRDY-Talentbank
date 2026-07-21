import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { getMyProfile, updateMyProfile } from "@/data/repo";
import { Profile } from "@/data/types";
import ProfileSetupScreen from "@/screens/ProfileSetupScreen";
import { colors } from "@/theme/colors";
import { useAuth } from "./AuthContext";

/** A profile counts as complete once About, Skills and Experience are all set. */
export function isProfileComplete(p: Profile): boolean {
  return !!p.about?.trim() && (p.skills?.length ?? 0) > 0 && (p.experience?.length ?? 0) > 0;
}

// Sits between PersonaGate and the app. After the persona quiz, a candidate must
// fill in their About, Skills and Experience before they can enter. Completion
// is read from the profile (Supabase), so it only blocks until the profile is
// filled — in demo mode the mock profile is already complete, so it's a no-op.
export default function ProfileGate({ children }: { children: React.ReactNode }) {
  const { authed } = useAuth();
  const [status, setStatus] = useState<"checking" | "needed" | "done">("checking");

  useEffect(() => {
    if (!authed) return;
    let alive = true;
    getMyProfile()
      .then((p) => alive && setStatus(isProfileComplete(p) ? "done" : "needed"))
      .catch(() => alive && setStatus("needed"));
    return () => {
      alive = false;
    };
  }, [authed]);

  const handleComplete = useCallback(async (patch: Partial<Profile>) => {
    // Persist first so a failed write keeps the user on the setup screen with the
    // error, rather than dropping them into the app with an unsaved profile.
    await updateMyProfile(patch);
    setStatus("done");
  }, []);

  if (!authed) return <>{children}</>;

  if (status === "checking") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (status === "needed") {
    return <ProfileSetupScreen onComplete={handleComplete} />;
  }

  return <>{children}</>;
}
