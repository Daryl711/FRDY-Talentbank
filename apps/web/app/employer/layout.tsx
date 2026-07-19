import Sidebar from "@/components/employer/EmployerSidebar";
import EmployerGuard from "@/components/employer/EmployerGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode}) {
    return (
        <EmployerGuard>
            <div className="flex min-h-screen bg-bg">
                <Sidebar/>
                <main className="flex-1 min-w-0 px-8 py-7">{children}</main>
            </div>
        </EmployerGuard>
    );
}