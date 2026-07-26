import UniversitySidebar from "@/components/university/UniversitySidebar";

export default function UniversityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <UniversitySidebar />
      <main className="flex-1 min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">{children}</main>
    </div>
  );
}
