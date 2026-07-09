import Sidebar from "@/components/employer/EmployerSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode}) {
    return (
        <div className="flex min-h-screen bg-bg">
            <Sidebar/>
            <main className="flex-1 min-w-0 px-8 py-7">{children}</main>
        </div>
    );
}