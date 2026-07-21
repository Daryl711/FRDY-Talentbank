"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getMyAnimalTrait, getMyProfile, type CandidateProfile } from "@/lib/candidate";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

const QUIZ = "/candidate/quiz";
const ONBOARDING = "/candidate/onboarding";

/** A profile counts as complete once About, Skills and Experience are all set. */
export function isProfileComplete(p: CandidateProfile): boolean {
  return !!p.about?.trim() && (p.skills?.length ?? 0) > 0 && (p.experience?.length ?? 0) > 0;
}

/**
 * Enforces candidate onboarding: after signing in, a candidate must complete the
 * Animal Persona quiz, then fill in their About/Skills/Experience, before the
 * main app (sidebar + pages) is shown. The quiz and onboarding routes render
 * full-screen (no sidebar) so the flow mirrors the mobile gates.
 */
export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const onboardingRoute = pathname === QUIZ || pathname === ONBOARDING;
  const [phase, setPhase] = useState<"checking" | "ready">(onboardingRoute ? "ready" : "checking");

  useEffect(() => {
    if (onboardingRoute) {
      setPhase("ready");
      return;
    }
    let alive = true;
    setPhase("checking");
    (async () => {
      const trait = await getMyAnimalTrait();
      if (!alive) return;
      if (!trait) {
        router.replace(QUIZ);
        return;
      }
      const profile = await getMyProfile();
      if (!alive) return;
      if (!isProfileComplete(profile)) {
        router.replace(ONBOARDING);
        return;
      }
      setPhase("ready");
    })();
    return () => {
      alive = false;
    };
  }, [pathname, onboardingRoute, router]);

  // Onboarding steps take over the whole screen (no sidebar chrome).
  if (onboardingRoute) {
    return <main className="min-h-screen px-6 py-10">{children}</main>;
  }

  if (phase === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Loader2 size={22} className="animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <CandidateSidebar />
      <main className="flex-1 min-w-0 px-8 py-7">{children}</main>
    </div>
  );
}
