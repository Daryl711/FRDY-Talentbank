import CandidateGuard from "@/components/candidate/CandidateGuard";
import OnboardingGate from "@/components/candidate/OnboardingGate";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <CandidateGuard>
      <OnboardingGate>{children}</OnboardingGate>
    </CandidateGuard>
  );
}
