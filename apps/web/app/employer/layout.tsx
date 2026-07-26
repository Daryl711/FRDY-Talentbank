import Sidebar from "@/components/employer/EmployerSidebar";
import EmployerGuard from "@/components/employer/EmployerGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode}) {
    return (
        <EmployerGuard>
            <div className="flex min-h-screen bg-bg">
                <Sidebar/>
                <main className="flex-1 min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">{children}</main>
            </div>
        </EmployerGuard>
    );
}