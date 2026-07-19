"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

/**
 * Gates the employer portal: while the session is resolving it shows a spinner,
 * and it bounces signed-out users back to the sign-in page. When Supabase isn't
 * configured, `authed` is true (demo passthrough) so the dashboard still runs on
 * mock data.
 */
export default function EmployerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authed, loading } = useAuth();

  useEffect(() => {
    if (!loading && !authed) router.replace("/");
  }, [loading, authed, router]);

  if (loading || !authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Loader2 size={22} className="animate-spin text-gold" />
      </div>
    );
  }

  return <>{children}</>;
}
