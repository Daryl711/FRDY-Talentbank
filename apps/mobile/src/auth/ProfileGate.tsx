import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { getMyProfile, getProfileSetupSkipped, setProfileSetupSkipped, updateMyProfile } from "@/data/repo";
import { Profile } from "@/data/types";
import ProfileSetupScreen from "@/screens/ProfileSetupScreen";
import { colors } from "@/theme/colors";
import { useAuth } from "./AuthContext";

/** A profile counts as complete once About, Skills and Experience are all set. */
export function isProfileComplete(p: Profile): boolean {
  return !!p.about?.trim() && (p.skills?.length ?? 0) > 0 && (p.experience?.length ?? 0) > 0;
}

// Sits between PersonaGate and the app. After the persona quiz, a candidate is
// prompted to fill in their About, Skills and Experience — but unlike the quiz
// this step is optional: they can skip it and complete it later from their
// profile. The gate clears once the profile is complete OR the step was skipped
// (skip is remembered per-device). In demo mode the mock profile is already
// complete, so it's a no-op.
export default function ProfileGate({ children }: { children: React.ReactNode }) {
  const { authed } = useAuth();
  const [status, setStatus] = useState<"checking" | "needed" | "done">("checking");

  useEffect(() => {
    if (!authed) return;
    let alive = true;
    Promise.all([getMyProfile(), getProfileSetupSkipped()])
      .then(([p, skipped]) => alive && setStatus(isProfileComplete(p) || skipped ? "done" : "needed"))
      .catch(() => alive && setStatus("needed"));
    return () => {
      alive = false;
    };
  }, [authed]);

  const handleComplete = useCallback(async (patch: Partial<Profile>) => {
    // Persist first so a failed write keeps the user on the setup screen with the
    // error, rather than dropping them into the app with an unsaved profile.
    await updateMyProfile(patch);
    // Filling the profile supersedes any earlier skip, so clear the flag.
    await setProfileSetupSkipped(false);
    setStatus("done");
  }, []);

  const handleSkip = useCallback(async () => {
    // Remember the skip so the setup screen doesn't reappear next sign-in while
    // the profile is still empty; they can complete it later from their profile.
    await setProfileSetupSkipped(true);
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
    return <ProfileSetupScreen onComplete={handleComplete} onSkip={handleSkip} />;
  }

  return <>{children}</>;
}
