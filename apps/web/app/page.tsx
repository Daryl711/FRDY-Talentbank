"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, GraduationCap, ArrowRight, Eye, EyeOff } from "lucide-react";
import { OrgType } from "@/lib/types";

export default function SignInPage() {
  const router = useRouter();
  const [org, setOrg] = useState<OrgType>("employer");
  const [email, setEmail] = useState("hiring@gmail.com");
  const [password, setPassword] = useState("password");
  const [show, setShow] = useState(false);

  function signIn() {
    // Prototype: route straight into the portal. Wire to supabase.auth here later when we the web app is ready to connect to the backend.
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-[440px]">
        <h1 className="font-serif text-4xl font-bold text-ink">Sign in to your portal</h1>
        <p className="text-dim text-[15px] mt-3">Select your organisation type to continue</p>

        {/* org type cards */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <OrgCard
            active={org === "employer"}
            onClick={() => setOrg("employer")}
            icon={<Building2 size={20} />}
            title="Employer"
            sub="Hiring & talent analytics"
          />
          <OrgCard
            active={org === "university"}
            onClick={() => setOrg("university")}
            icon={<GraduationCap size={20} />}
            title="University"
            sub="Graduate outcomes"
          />
        </div>

        {/* email */}
        <div className="mt-8">
          <label className="eyebrow">Email Address</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="mt-2 w-full bg-surface2 border border-line rounded-xl px-4 py-[14px] text-ink text-[15px] outline-none focus:border-gold/50 transition-colors"
          />
        </div>

        {/* password */}
        <div className="mt-5">
          <label className="eyebrow">Password</label>
          <div className="mt-2 relative">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        {/* submit */}
        <button
          onClick={signIn}
          className="mt-6 w-full bg-gradient-to-r from-goldbright to-golddeep rounded-xl py-[15px] flex items-center justify-center gap-2 font-semibold text-[15px] transition-opacity hover:opacity-90"
          style={{ color: "#2b2106" }}
        >
          Sign In <ArrowRight size={18} />
        </button>

        <p className="text-center text-dim text-[13px] mt-6">
          Don&apos;t have an account?{" "}
          <a className="text-gold hover:text-goldbright cursor-pointer">Request access</a>
        </p>

        <p className="text-center eyebrow mt-12">Elevate Enterprise v2.4 · Terms · Privacy</p>
      </div>
    </main>
  );
}

function OrgCard({
  active, 
  onClick,
  icon,
  title,
  sub,
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
      className={`text-left rounded-2xl p-5 border transition-colors ${
        active ? "border-gold bg-gold/[0.06]" : "border-line bg-surface hover:border-line2"
      }`}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center ${
          active ? "bg-gold/15 text-gold" : "bg-surface2 text-mut"
        }`}
      >
        {icon}
      </div>
      <div className={`font-semibold mt-4 ${active ? "text-ink" : "text-dim"}`}>{title}</div>
      <div className="text-mut text-[12.5px] mt-1">{sub}</div>
    </button>
  );
}

