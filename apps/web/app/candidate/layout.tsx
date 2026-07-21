import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import CandidateGuard from "@/components/candidate/CandidateGuard";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <CandidateGuard>
      <div className="flex min-h-screen bg-bg">
        <CandidateSidebar />
        <main className="flex-1 min-w-0 px-8 py-7">{children}</main>
      </div>
    </CandidateGuard>
  );
}
