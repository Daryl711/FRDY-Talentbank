"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { QUESTIONS, DIMENSIONS, computePersona, ANIMALS, type PersonaResult } from "@/lib/persona";
import { saveMyAnimalTrait } from "@/lib/candidate";

export default function QuizPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<(number | null)[]>(() => QUESTIONS.map(() => null));
  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<PersonaResult | null>(null);

  const q = QUESTIONS[current];
  const total = QUESTIONS.length;
  const progress = Math.round(((current + (answers[current] != null ? 1 : 0)) / total) * 100);

  async function choose(optIdx: number) {
    const next = [...answers];
    next[current] = optIdx;
    setAnswers(next);

    if (current < total - 1) {
      setTimeout(() => setCurrent((c) => c + 1), 160);
      return;
    }
    // last question — compute + persist
    const res = computePersona(next);
    setResult(res);
    setSaving(true);
    try {
      await saveMyAnimalTrait(res.trait, res.scores);
    } catch {
      /* keep the result on screen even if the save fails (demo mode) */
    } finally {
      setSaving(false);
    }
  }

  if (result) {
    const meta = ANIMALS[result.trait];
    return (
      <div className="max-w-[520px] mx-auto flex flex-col items-center text-center pt-10">
        <div className="text-[72px] leading-none">{meta.emoji}</div>
        <div className="eyebrow mt-4">Your Animal Persona</div>
        <h1 className="font-serif text-[34px] font-bold text-ink mt-1">{result.trait}</h1>
        <div className="text-gold text-[15px] font-semibold mt-1">{meta.archetype}</div>
        <div className="flex flex-wrap gap-2 justify-center mt-5">
          {meta.tags.map((t) => (
            <span key={t} className="bg-surface2 border border-line2 rounded-lg px-[13px] py-2 text-ink text-[12.5px]">{t}</span>
          ))}
        </div>
        <p className="text-dim text-[14px] leading-[23px] mt-6">{meta.description}</p>
        <button
          onClick={() => router.push("/candidate/profile")}
          disabled={saving}
          className="mt-8 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-goldbright to-golddeep rounded-xl py-[14px] font-semibold text-[15px] disabled:opacity-60"
          style={{ color: "#2b2106" }}
        >
          {saving ? <><Loader2 size={18} className="animate-spin" /> Saving…</> : "View my profile"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[620px] mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => (current > 0 ? setCurrent((c) => c - 1) : router.push("/candidate/profile"))}
          className="w-10 h-10 rounded-full bg-surface2 border border-line flex items-center justify-center text-dim hover:text-ink"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="eyebrow">{DIMENSIONS[q.dimension]}</span>
            <span className="font-mono text-[11px] text-mut">{current + 1} / {total}</span>
          </div>
          <div className="h-[6px] bg-surface3 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-goldbright to-golddeep transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <h1 className="font-serif text-[26px] font-bold text-ink mt-8 leading-tight">{q.text}</h1>

      <div className="flex flex-col gap-3 mt-6">
        {q.options.map((opt, i) => {
          const on = answers[current] === i;
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              className={`text-left rounded-2xl px-5 py-4 border transition-colors text-[15px] ${
                on ? "border-gold bg-gold/[0.08] text-ink" : "border-line bg-surface text-dim hover:border-line2 hover:text-ink"
              }`}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
