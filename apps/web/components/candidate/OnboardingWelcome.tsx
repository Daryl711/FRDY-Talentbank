"use client";

import { useState } from "react";
import { Award, Check, ArrowRight } from "lucide-react";

const STEPS = [
  {
    n: "1",
    t: "Animal Persona quiz",
    s: "40 quick questions (~5 min) that reveal your work style. Required — it's what feeds your ML-driven career trajectory prediction, so it can't be skipped.",
    required: true,
  },
  {
    n: "2",
    t: "Your profile",
    s: "Add your About, Skills and Experience. Optional — you can finish this anytime later.",
    required: false,
  },
];

/**
 * One-time acknowledgement shown at the very start of candidate onboarding —
 * before the persona quiz and profile setup — so the candidate knows the two
 * steps ahead and why they matter. "Get Started" enables only once ticked.
 */
export default function OnboardingWelcome({ onAcknowledge }: { onAcknowledge: () => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70">
      <div className="w-full max-w-[460px] bg-bgtop border border-line rounded-2xl p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-[58px] h-[58px] rounded-full flex items-center justify-center bg-gold/[0.12] border border-gold/40">
            <Award size={26} className="text-gold" />
          </div>
          <h2 className="font-serif text-[24px] font-bold text-ink mt-4">Let&apos;s set you up for better matches</h2>
          <p className="text-dim text-[14px] mt-3 leading-[22px]">
            To help employers find you and match you with the right roles, we&apos;ll guide you through two quick steps first.
            The Animal Persona quiz is <span className="text-gold font-semibold">required</span> — it&apos;s what powers your
            ML-driven career trajectory prediction.
          </p>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          {STEPS.map((step) => (
            <div key={step.n} className="flex items-start gap-[13px] bg-surface2 border border-line rounded-xl p-4">
              <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#d8b45a" }}>
                <span className="font-mono text-[12px] font-bold" style={{ color: "#3a2d08" }}>{step.n}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-ink text-[14.5px] font-semibold">{step.t}</div>
                  {step.required ? (
                    <span className="font-mono text-[9px] tracking-wide uppercase px-[7px] py-[2px] rounded bg-gold/[0.16] border border-gold/40 text-gold">
                      Required
                    </span>
                  ) : (
                    <span className="font-mono text-[9px] tracking-wide uppercase px-[7px] py-[2px] rounded bg-surface3 border border-line2 text-mut">
                      Optional
                    </span>
                  )}
                </div>
                <div className="text-dim text-[12.5px] mt-[3px] leading-[18px]">{step.s}</div>
              </div>
            </div>
          ))}
        </div>

        {/* acknowledgement */}
        <button onClick={() => setChecked((c) => !c)} className="flex items-center gap-[11px] mt-5 text-left w-full">
          <span
            className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center border shrink-0"
            style={checked ? { backgroundColor: "#d8b45a", borderColor: "#d8b45a" } : { backgroundColor: "var(--color-surface2)", borderColor: "var(--color-line2)" }}
          >
            {checked && <Check size={14} style={{ color: "#2b2106" }} />}
          </span>
          <span className="flex-1 text-dim text-[13px] leading-[18px]">
            I understand the Animal Persona quiz is required to unlock my ML career trajectory prediction, and my profile is optional and can be completed later.
          </span>
        </button>

        <button
          onClick={onAcknowledge}
          disabled={!checked}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl py-[15px] font-semibold text-[14px] disabled:opacity-50"
          style={{ backgroundColor: "#d8b45a", color: "#3a2d08" }}
        >
          Get Started <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
