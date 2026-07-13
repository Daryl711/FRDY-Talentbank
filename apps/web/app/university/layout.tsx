import UniversitySidebar from "@/components/university/UniversitySidebar";

export default function UniversityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <UniversitySidebar />
      <main className="flex-1 min-w-0 px-8 py-7">{children}</main>
    </div>
  );
}
