"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

/**
 * Landing page for the link sent by resetPasswordForEmail (see app/page.tsx).
 * Supabase's client (detectSessionInUrl: true) exchanges the recovery token in
 * the URL for a temporary session automatically and fires a PASSWORD_RECOVERY
 * auth event — we wait for that (or an already-established session) before
 * showing the form, so a stale/invalid link fails clearly instead of silently.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  // isSupabaseConfigured is a static constant, so this lazy initializer covers
  // the not-configured case without the effect needing a synchronous setState.
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">(() =>
    isSupabaseConfigured ? "checking" : "invalid",
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatus("ready");
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus((s) => (s === "checking" ? "ready" : s));
    });
    // The recovery event can take a moment to fire after the redirect lands;
    // give it a few seconds before treating the link as invalid/expired.
    const timeout = setTimeout(() => {
      setStatus((s) => (s === "checking" ? "invalid" : s));
    }, 4000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const canSubmit = password.length >= 6 && password === confirm;

  async function submit() {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't update your password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full bg-surface2 border border-line rounded-xl px-4 py-[14px] pr-12 text-ink text-[15px] outline-none focus:border-gold/50 transition-colors placeholder:text-mut";

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-[440px]">
        <h1 className="font-serif text-4xl font-bold text-ink">Reset your password</h1>

        {status === "checking" && (
          <div className="flex items-center gap-2 text-dim text-[14px] mt-6">
            <Loader2 size={18} className="animate-spin text-gold" /> Verifying your reset link…
          </div>
        )}

        {status === "invalid" && (
          <>
            <p className="text-dim text-[15px] mt-3">
              This reset link is invalid or has expired. Head back to sign in and request a new one.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 w-full bg-gradient-to-r from-goldbright to-golddeep rounded-xl py-[15px] flex items-center justify-center gap-2 font-semibold text-[15px] hover:opacity-90"
              style={{ color: "#2b2106" }}
            >
              Back to sign in <ArrowRight size={18} />
            </button>
          </>
        )}

        {status === "ready" && done && (
          <>
            <div className="flex items-center gap-2 text-ok text-[15px] mt-3">
              <CheckCircle2 size={20} /> Password updated.
            </div>
            <p className="text-dim text-[14px] mt-2">Sign in with your new password.</p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 w-full bg-gradient-to-r from-goldbright to-golddeep rounded-xl py-[15px] flex items-center justify-center gap-2 font-semibold text-[15px] hover:opacity-90"
              style={{ color: "#2b2106" }}
            >
              Back to sign in <ArrowRight size={18} />
            </button>
          </>
        )}

        {status === "ready" && !done && (
          <>
            <p className="text-dim text-[15px] mt-3">Choose a new password for your account.</p>

            <div className="mt-8">
              <label className="eyebrow">New Password</label>
              <div className="mt-2 relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={show ? "text" : "password"}
                  placeholder="At least 6 characters"
                  className={field}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mut hover:text-dim"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="mt-5">
              <label className="eyebrow">Confirm Password</label>
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                type={show ? "text" : "password"}
                placeholder="Re-enter your new password"
                className="mt-2 w-full bg-surface2 border border-line rounded-xl px-4 py-[14px] text-ink text-[15px] outline-none focus:border-gold/50 transition-colors placeholder:text-mut"
              />
              {confirm.length > 0 && password !== confirm && (
                <p className="text-danger text-[12.5px] mt-2">Passwords don&apos;t match.</p>
              )}
            </div>

            {error && <p className="mt-5 text-[13px] text-danger bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">{error}</p>}

            <button
              onClick={submit}
              disabled={busy || !canSubmit}
              className="mt-6 w-full bg-gradient-to-r from-goldbright to-golddeep rounded-xl py-[15px] flex items-center justify-center gap-2 font-semibold text-[15px] transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ color: "#2b2106" }}
            >
              {busy ? (
                <><Loader2 size={18} className="animate-spin" /> Updating…</>
              ) : (
                <>Update Password <ArrowRight size={18} /></>
              )}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
