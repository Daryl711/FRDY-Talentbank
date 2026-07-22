"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, GraduationCap, User, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { OrgType } from "@/lib/types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { signInWithEmail, signUpWithEmail } from "@/lib/candidate";

const PORTALS: Record<OrgType, string> = {
  candidate: "/candidate",
  employer: "/employer",
  university: "/university",
};

// Prefilled demo logins per portal. The employer portal uses the fixed
// CelcomDigi credentials seeded in supabase/schema.sql — that account owns the
// CelcomDigi company, so signing in lands on a live Hiring board wired to the
// candidates who matched CelcomDigi's role.
const DEMO_CREDS: Record<"employer" | "university", { email: string; password: string }> = {
  employer: { email: "employer@celcomdigi.com", password: "CelcomDigi123!" },
  university: { email: "hiring@gmail.com", password: "password" },
};

export default function SignInPage() {
  const [org, setOrg] = useState<OrgType>("candidate");

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-[440px]">
        <h1 className="font-serif text-4xl font-bold text-ink">Sign in to your portal</h1>
        <p className="text-dim text-[15px] mt-3">Select your account type to continue</p>

        {/* account type cards */}
        <div className="grid grid-cols-3 gap-3 mt-8">
          <OrgCard active={org === "candidate"} onClick={() => setOrg("candidate")} icon={<User size={20} />} title="Candidate" sub="Find roles & matches" />
          <OrgCard active={org === "employer"} onClick={() => setOrg("employer")} icon={<Building2 size={20} />} title="Employer" sub="Hiring & analytics" />
          <OrgCard active={org === "university"} onClick={() => setOrg("university")} icon={<GraduationCap size={20} />} title="University" sub="Graduate outcomes" />
        </div>

        {org === "candidate" ? (
          <CandidateAuth />
        ) : (
          <DemoAuth portal={PORTALS[org]} defaults={DEMO_CREDS[org]} />
        )}

        <p className="text-center eyebrow mt-12">Elevate Enterprise v2.4 · Terms · Privacy</p>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------- candidate auth */
// Real Supabase email/password auth, matching the mobile app: candidates sign in
// or create an account against live data (no demo passthrough).
function CandidateAuth() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isSignup = mode === "signup";
  const canSubmit =
    email.includes("@") && password.length >= 6 && (!isSignup || name.trim().length >= 2);

  async function submit() {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (isSignup) {
        const res = await signUpWithEmail(email, password, name);
        if (res.needsConfirmation) {
          setNotice("Account created. Check your email to confirm, then sign in.");
          setMode("signin");
          return;
        }
      } else {
        await signInWithEmail(email, password);
      }
      router.push("/candidate");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8">
      {isSignup && (
        <div className="mb-5">
          <label className="eyebrow">Full Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Candidate"
            className="mt-2 w-full bg-surface2 border border-line rounded-xl px-4 py-[14px] text-ink text-[15px] outline-none focus:border-gold/50 transition-colors placeholder:text-mut"
          />
        </div>
      )}

      <div>
        <label className="eyebrow">Email Address</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="you@example.com"
          className="mt-2 w-full bg-surface2 border border-line rounded-xl px-4 py-[14px] text-ink text-[15px] outline-none focus:border-gold/50 transition-colors placeholder:text-mut"
        />
      </div>

      <div className="mt-5">
        <label className="eyebrow">Password</label>
        <div className="mt-2 relative">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            type={show ? "text" : "password"}
            placeholder={isSignup ? "At least 6 characters" : "••••••••"}
            className="w-full bg-surface2 border border-line rounded-xl px-4 py-[14px] pr-12 text-ink text-[15px] outline-none focus:border-gold/50 transition-colors placeholder:text-mut"
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

      {error && <p className="mt-5 text-[13px] text-danger bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">{error}</p>}
      {notice && <p className="mt-5 text-[13px] text-ok bg-ok/10 border border-ok/30 rounded-xl px-4 py-3">{notice}</p>}

      <button
        onClick={submit}
        disabled={busy || !canSubmit}
        className="mt-6 w-full bg-gradient-to-r from-goldbright to-golddeep rounded-xl py-[15px] flex items-center justify-center gap-2 font-semibold text-[15px] transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ color: "#2b2106" }}
      >
        {busy ? (
          <><Loader2 size={18} className="animate-spin" /> {isSignup ? "Creating account…" : "Signing in…"}</>
        ) : (
          <>{isSignup ? "Create Account" : "Sign In"} <ArrowRight size={18} /></>
        )}
      </button>

      <p className="text-center text-dim text-[13px] mt-6">
        {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          onClick={() => { setMode(isSignup ? "signin" : "signup"); setError(null); setNotice(null); }}
          className="text-gold hover:text-goldbright font-semibold"
        >
          {isSignup ? "Sign in" : "Create one"}
        </button>
      </p>
    </div>
  );
}

/* ------------------------------------------------------- employer / university demo */
// The employer and university dashboards run on curated demo data, so their
// sign-in keeps the prototype passthrough (and prefilled demo credentials).
function DemoAuth({ portal, defaults }: { portal: string; defaults: { email: string; password: string } }) {
  const router = useRouter();
  const [email, setEmail] = useState(defaults.email);
  const [password, setPassword] = useState(defaults.password);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setError(null);
    if (!isSupabaseConfigured) {
      router.push(portal);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(portal);
  }

  return (
    <div className="mt-8">
      <div>
        <label className="eyebrow">Email Address</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          className="mt-2 w-full bg-surface2 border border-line rounded-xl px-4 py-[14px] text-ink text-[15px] outline-none focus:border-gold/50 transition-colors"
        />
      </div>

      <div className="mt-5">
        <label className="eyebrow">Password</label>
        <div className="mt-2 relative">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && signIn()}
            type={show ? "text" : "password"}
            className="w-full bg-surface2 border border-line rounded-xl px-4 py-[14px] pr-12 text-ink text-[15px] outline-none focus:border-gold/50 transition-colors"
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

      <div className="flex justify-end mt-3">
        <a className="text-gold text-[13px] hover:text-goldbright cursor-pointer">Forgot password?</a>
      </div>

      {error && <p className="mt-5 text-[13px] text-danger bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">{error}</p>}

      <button
        onClick={signIn}
        disabled={loading}
        className="mt-6 w-full bg-gradient-to-r from-goldbright to-golddeep rounded-xl py-[15px] flex items-center justify-center gap-2 font-semibold text-[15px] transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ color: "#2b2106" }}
      >
        {loading ? (
          <><Loader2 size={18} className="animate-spin" /> Signing in…</>
        ) : (
          <>Sign In <ArrowRight size={18} /></>
        )}
      </button>
    </div>
  );
}

function OrgCard({
  active, onClick, icon, title, sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl p-4 border transition-colors ${
        active ? "border-gold bg-gold/[0.06]" : "border-line bg-surface hover:border-line2"
      }`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${active ? "bg-gold/15 text-gold" : "bg-surface2 text-mut"}`}>
        {icon}
      </div>
      <div className={`font-semibold mt-3 text-[14px] ${active ? "text-ink" : "text-dim"}`}>{title}</div>
      <div className="text-mut text-[11.5px] mt-1">{sub}</div>
    </button>
  );
}
