"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Tag, Plus, Trash2, X, ArrowRight, Loader2 } from "lucide-react";
import { setProfileSetupSkipped, updateMyProfile, type Experience } from "@/lib/candidate";

export default function OnboardingPage() {
  const router = useRouter();
  const [about, setAbout] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [experience, setExperience] = useState<Experience[]>([
    { id: `exp-${Date.now()}`, title: "", company: "", dates: "", description: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.some((k) => k.toLowerCase() === s.toLowerCase())) setSkills([...skills, s]);
    setSkillInput("");
  }
  function removeSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill));
  }
  function addExperience() {
    setExperience([...experience, { id: `exp-${Date.now()}`, title: "", company: "", dates: "", description: "" }]);
  }
  function updateExperience(id: string, patch: Partial<Experience>) {
    setExperience(experience.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  function removeExperience(id: string) {
    setExperience(experience.filter((e) => e.id !== id));
  }

  const pendingSkill = skillInput.trim();
  const allSkills = useMemo(
    () => (pendingSkill && !skills.some((k) => k.toLowerCase() === pendingSkill.toLowerCase()) ? [...skills, pendingSkill] : skills),
    [skills, pendingSkill],
  );
  const filledExperience = experience.filter((e) => e.title.trim() || e.company.trim() || e.description.trim());
  const canSubmit = about.trim().length > 0 && allSkills.length > 0 && filledExperience.length > 0;

  async function submit() {
    if (!canSubmit || saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateMyProfile({
        about: about.trim(),
        skills: allSkills,
        experience: filledExperience.map((e) => ({
          ...e,
          title: e.title.trim(),
          company: e.company.trim(),
          dates: e.dates.trim(),
          description: e.description.trim(),
        })),
      });
      // Filling the profile supersedes any earlier skip, so clear the flag.
      setProfileSetupSkipped(false);
      router.push("/candidate");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save your profile. Please try again.");
      setSaving(false);
    }
  }

  function skip() {
    if (saving) return;
    // Remember the skip so the onboarding step doesn't reappear on every
    // navigation while the profile is still empty; they can complete it later.
    setProfileSetupSkipped(true);
    router.push("/candidate");
  }

  const input = "w-full bg-surface2 border border-line rounded-xl px-[13px] py-[11px] text-ink text-[14px] outline-none focus:border-gold/50 placeholder:text-mut";

  return (
    <div className="max-w-[620px] mx-auto">
      <div className="eyebrow !text-gold">Candidate Onboarding · Step 2 of 2 · Optional</div>
      <h1 className="font-serif text-[32px] font-bold text-ink mt-3">Complete your profile</h1>
      <p className="text-dim text-[14px] mt-3 leading-[22px]">
        Tell employers about yourself. Add an intro, your top skills and your work history — or skip for now and finish this anytime from your profile.
      </p>

      {/* About */}
      <h2 className="font-serif text-[19px] font-bold text-ink mt-7 mb-3">About</h2>
      <textarea
        value={about}
        onChange={(e) => setAbout(e.target.value)}
        placeholder="A short intro — your focus, strengths and what you're looking for…"
        className={`${input} min-h-[110px] leading-6`}
      />

      {/* Skills */}
      <h2 className="font-serif text-[19px] font-bold text-ink mt-6 mb-3">Skills</h2>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-[10px] mb-3">
          {skills.map((s) => (
            <button key={s} onClick={() => removeSkill(s)} className="flex items-center gap-2 bg-surface border border-line2 rounded-xl px-[15px] py-[10px] text-ink text-[13px]">
              {s} <X size={13} className="text-mut" />
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-surface2 border border-line rounded-xl px-[14px]">
          <Tag size={15} className="text-mut" />
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
            placeholder="Add a skill"
            className="flex-1 bg-transparent outline-none text-ink text-[14px] py-3 placeholder:text-mut"
          />
        </div>
        <button onClick={addSkill} className="bg-surface2 border border-line rounded-xl px-4 py-3 text-gold"><Plus size={18} /></button>
      </div>

      {/* Experience */}
      <h2 className="font-serif text-[19px] font-bold text-ink mt-6 mb-3">Experience</h2>
      {experience.map((e, idx) => (
        <div key={e.id} className="bg-surface border border-line rounded-xl p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] tracking-wider text-mut uppercase">Role {idx + 1}</span>
            {experience.length > 1 && (
              <button onClick={() => removeExperience(e.id)} className="flex items-center gap-1 text-danger text-[12px]"><Trash2 size={14} /> Remove</button>
            )}
          </div>
          <input value={e.title} onChange={(ev) => updateExperience(e.id, { title: ev.target.value })} placeholder="Job title" className={`${input} mb-[9px]`} />
          <input value={e.company} onChange={(ev) => updateExperience(e.id, { company: ev.target.value })} placeholder="Company" className={`${input} mb-[9px]`} />
          <input value={e.dates} onChange={(ev) => updateExperience(e.id, { dates: ev.target.value })} placeholder="Dates — e.g. 2021 — Present" className={`${input} mb-[9px]`} />
          <textarea value={e.description} onChange={(ev) => updateExperience(e.id, { description: ev.target.value })} placeholder="What you did, your impact and achievements…" className={`${input} min-h-[80px] leading-[21px]`} />
        </div>
      ))}
      <button onClick={addExperience} className="w-full flex items-center justify-center gap-2 bg-surface2 border border-dashed border-line rounded-xl py-[14px] text-gold text-[13.5px] font-medium">
        <Plus size={17} /> Add another role
      </button>

      {error && <p className="text-danger text-[13px] mt-4">{error}</p>}

      <button
        onClick={submit}
        disabled={!canSubmit || saving}
        className="mt-7 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-goldbright to-golddeep rounded-xl py-[15px] font-semibold text-[15px] disabled:opacity-50"
        style={{ color: "#2b2106" }}
      >
        {saving ? <><Loader2 size={18} className="animate-spin" /> Saving…</> : <>Finish &amp; enter Mango <ArrowRight size={18} /></>}
      </button>
      <button onClick={skip} disabled={saving} className="mt-4 w-full py-2 text-dim text-[14px] font-medium disabled:opacity-50">
        Skip for now
      </button>
      <p className="text-mut text-[12px] text-center mt-2">
        {canSubmit ? "You can update your profile anytime from your profile page." : "Add all three to finish now, or skip and complete it later from your profile."}
      </p>
    </div>
  );
}
