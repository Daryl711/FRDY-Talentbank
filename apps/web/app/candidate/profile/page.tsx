"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit2, LogOut, MapPin, Briefcase, TrendingUp, Eye, Trophy, X, Check, Plus, Trash2, Tag, ChevronRight, GraduationCap } from "lucide-react";
import { getMyProfile, updateMyProfile, type CandidateProfile, type Experience, type Education } from "@/lib/candidate";
import { ANIMALS, type AnimalTrait, type PersonaScores } from "@/lib/persona";
import { useAuth } from "@/lib/auth";
import Avatar from "@/components/candidate/Avatar";

const expColors = ["#2563c4", "#6d49d6", "#2f8f5b", "#b8553f", "#7c4dab", "#4a6d8c", "#9a6b34", "#3a6ea5"];
function expColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return expColors[h % expColors.length];
}
function expInitials(company: string) {
  const words = company.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "•";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [tab, setTab] = useState<"profile" | "settings">("profile");
  const [me, setMe] = useState<CandidateProfile | null>(null);
  const [personaOpen, setPersonaOpen] = useState(false);

  const [editing, setEditing] = useState(false);
  const [about, setAbout] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [experience, setExperience] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyProfile().then(setMe);
  }, []);

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  if (!me) {
    return <div className="eyebrow">Loading…</div>;
  }

  function startEdit() {
    setAbout(me!.about ?? "");
    setSkills(me!.skills ?? []);
    setSkillInput("");
    setExperience((me!.experience ?? []).map((e) => ({ ...e })));
    setEducation((me!.education ?? []).map((e) => ({ ...e })));
    setError(null);
    setEditing(true);
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

  function addEducation() {
    setEducation([...education, { id: `edu-${Date.now()}`, school: "", degree: "", grade: "", dates: "" }]);
  }
  function updateEducation(id: string, patch: Partial<Education>) {
    setEducation(education.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  function removeEducation(id: string) {
    setEducation(education.filter((e) => e.id !== id));
  }
  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.some((k) => k.toLowerCase() === s.toLowerCase())) setSkills([...skills, s]);
    setSkillInput("");
  }
  function removeSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill));
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    const pending = skillInput.trim();
    const finalSkills = pending && !skills.some((k) => k.toLowerCase() === pending.toLowerCase()) ? [...skills, pending] : skills;
    const finalExperience = experience
      .map((e) => ({ ...e, title: e.title.trim(), company: e.company.trim(), dates: e.dates.trim(), description: e.description.trim() }))
      .filter((e) => e.title || e.company || e.description);
    const finalEducation = education
      .map((e) => ({ ...e, school: e.school.trim(), degree: e.degree.trim(), grade: e.grade.trim(), dates: e.dates.trim() }))
      .filter((e) => e.school || e.degree || e.grade);
    const patch = { about: about.trim(), skills: finalSkills, experience: finalExperience, education: finalEducation };
    try {
      const updated = await updateMyProfile(patch);
      setMe(updated ?? { ...me!, ...patch });
      setSkillInput("");
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const input = "w-full bg-surface2 border border-line rounded-xl px-[13px] py-[11px] text-ink text-[14px] outline-none focus:border-gold/50 placeholder:text-mut";

  return (
    <div className="max-w-[820px] mx-auto">
      {/* top actions */}
      <div className="flex justify-end gap-3">
        {editing ? (
          <>
            <button onClick={() => setEditing(false)} disabled={saving} className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-4 py-[9px] text-mut text-[13px] font-medium">
              <X size={14} /> Cancel
            </button>
            <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl px-4 py-[9px] text-[13px] font-semibold disabled:opacity-60" style={{ backgroundColor: "#d8b45a", color: "#3a2d08" }}>
              <Check size={14} /> {saving ? "Saving…" : "Save"}
            </button>
          </>
        ) : (
          <>
            <button onClick={startEdit} className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-4 py-[9px] text-gold text-[13px] font-medium">
              <Edit2 size={14} /> Edit
            </button>
            <button onClick={handleSignOut} className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-4 py-[9px] text-danger text-[13px] font-medium">
              <LogOut size={14} /> Log Out
            </button>
          </>
        )}
      </div>

      {/* identity */}
      <div className="flex items-center gap-3 mt-2">
        <Avatar size={80} online />
        <span className="font-mono text-[10px] tracking-wide text-goldbright bg-gold/[0.13] border border-gold/30 rounded-lg px-[11px] py-[5px]">EXECUTIVE PRO</span>
      </div>

      <h1 className="font-serif text-[28px] font-bold text-ink mt-4">{me.name}</h1>
      <p className="text-dim text-[15px] mt-1">{me.headline}</p>
      <div className="flex gap-5 mt-3 text-mut text-[13px]">
        <span className="flex items-center gap-[6px]"><MapPin size={14} /> {me.location}</span>
        <span className="flex items-center gap-[6px]"><Briefcase size={14} /> {me.years_exp} yrs exp.</span>
      </div>

      {/* stats */}
      <div className="grid grid-cols-3 gap-3 mt-5">
        <PStat icon={<TrendingUp size={16} className="text-gold" />} value={`${me.profile_score}%`} label="Profile Score" />
        <PStat icon={<Eye size={16} className="text-gold" />} value={`${me.views}`} label="Views" />
        <PStat icon={<Trophy size={16} className="text-gold" />} value={`${me.matches}`} label="Matches" />
      </div>

      {/* tabs */}
      <div className="flex gap-1 bg-surface2 border border-line rounded-xl p-[5px] mt-5">
        {(["profile", "settings"] as const).map((t) => {
          const on = tab === t;
          return (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-[11px] rounded-lg font-mono text-[11px] tracking-wider uppercase ${on ? "font-bold" : "text-dim"}`} style={on ? { backgroundColor: "#d8b45a", color: "#3a2d08" } : undefined}>
              {t}
            </button>
          );
        })}
      </div>

      {tab === "profile" ? (
        <>
          {error && <p className="text-danger text-[13px] mt-6">{error}</p>}

          {/* persona */}
          {me.animal_trait && ANIMALS[me.animal_trait as AnimalTrait] && (
            <button onClick={() => setPersonaOpen(true)} className="w-full flex items-center gap-4 bg-surface border border-line rounded-2xl p-4 mt-6 text-left hover:border-line2">
              <div className="w-[52px] h-[52px] rounded-xl flex items-center justify-center bg-gold/[0.12] border border-gold/30 text-[30px]">
                {ANIMALS[me.animal_trait as AnimalTrait].emoji}
              </div>
              <div className="flex-1">
                <div className="eyebrow mb-1">Animal Persona</div>
                <div className="font-serif text-[19px] text-ink">{me.animal_trait}</div>
                <div className="text-gold text-[12.5px] font-semibold">{ANIMALS[me.animal_trait as AnimalTrait].archetype}</div>
              </div>
              <div className="flex items-center gap-1 text-mut"><span className="font-mono text-[9.5px] uppercase">Stats</span><ChevronRight size={18} /></div>
            </button>
          )}

          {/* about */}
          <h2 className="font-serif text-[20px] font-bold text-ink mt-6 mb-3">About</h2>
          {editing ? (
            <textarea value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Write something about yourself…" className={`${input} min-h-[120px] leading-6`} />
          ) : (
            <p className="text-dim text-[14px] leading-[23px]">{me.about?.trim() ? me.about : "No about yet. Tap Edit to introduce yourself."}</p>
          )}

          {/* skills */}
          <h2 className="font-serif text-[20px] font-bold text-ink mt-6 mb-3">Skills</h2>
          {!editing && me.skills.length === 0 ? (
            <p className="text-dim text-[14px]">No skill yet. Tap Edit to add your skills.</p>
          ) : (
            <div className="flex flex-wrap gap-[10px]">
              {(editing ? skills : me.skills).map((s) => (
                <button key={s} onClick={editing ? () => removeSkill(s) : undefined} className="flex items-center gap-2 bg-surface border border-line2 rounded-xl px-[15px] py-[10px] text-ink text-[13px]">
                  {s} {editing && <X size={13} className="text-mut" />}
                </button>
              ))}
            </div>
          )}
          {editing && (
            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1 flex items-center gap-2 bg-surface2 border border-line rounded-xl px-[14px]">
                <Tag size={15} className="text-mut" />
                <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSkill()} placeholder="Add a skill" className="flex-1 bg-transparent outline-none text-ink text-[14px] py-3 placeholder:text-mut" />
              </div>
              <button onClick={addSkill} className="bg-surface2 border border-line rounded-xl px-4 py-3 text-gold"><Plus size={18} /></button>
            </div>
          )}

          {/* experience */}
          <h2 className="font-serif text-[20px] font-bold text-ink mt-6 mb-3">Experience</h2>
          {editing ? (
            <>
              {experience.map((e, idx) => (
                <div key={e.id} className="bg-surface border border-line rounded-xl p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] tracking-wider text-mut uppercase">Role {idx + 1}</span>
                    <button onClick={() => removeExperience(e.id)} className="flex items-center gap-1 text-danger text-[12px]"><Trash2 size={14} /> Remove</button>
                  </div>
                  <input value={e.title} onChange={(ev) => updateExperience(e.id, { title: ev.target.value })} placeholder="Job title" className={`${input} mb-[9px]`} />
                  <input value={e.company} onChange={(ev) => updateExperience(e.id, { company: ev.target.value })} placeholder="Company" className={`${input} mb-[9px]`} />
                  <input value={e.dates} onChange={(ev) => updateExperience(e.id, { dates: ev.target.value })} placeholder="Dates — e.g. 2021 — Present" className={`${input} mb-[9px]`} />
                  <textarea value={e.description} onChange={(ev) => updateExperience(e.id, { description: ev.target.value })} placeholder="Description — what you did, your impact and achievements…" className={`${input} min-h-[84px] leading-[21px]`} />
                </div>
              ))}
              <button onClick={addExperience} className="w-full flex items-center justify-center gap-2 bg-surface2 border border-dashed border-line rounded-xl py-[14px] text-gold text-[13.5px] font-medium">
                <Plus size={17} /> Add experience
              </button>
            </>
          ) : (me.experience ?? []).length === 0 ? (
            <p className="text-dim text-[14px]">No experience yet. Tap Edit to add your work history.</p>
          ) : (
            (me.experience ?? []).map((e) => (
              <div key={e.id} className="flex gap-3 bg-surface border border-line rounded-xl p-4 mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-[13px] shrink-0" style={{ backgroundColor: expColor(e.company) }}>
                  {expInitials(e.company)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[14.5px] text-ink">{e.title}</div>
                  <div className="text-dim text-[12.5px] mt-[2px]">{e.company}</div>
                  {e.dates && <div className="font-mono text-[10.5px] text-mut mt-[5px]">{e.dates}</div>}
                  {e.description && <p className="text-dim text-[13px] leading-5 mt-2">{e.description}</p>}
                </div>
              </div>
            ))
          )}

          {/* education */}
          <h2 className="font-serif text-[20px] font-bold text-ink mt-6 mb-3">Education</h2>
          {editing ? (
            <>
              {education.map((e, idx) => (
                <div key={e.id} className="bg-surface border border-line rounded-xl p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] tracking-wider text-mut uppercase">School {idx + 1}</span>
                    <button onClick={() => removeEducation(e.id)} className="flex items-center gap-1 text-danger text-[12px]"><Trash2 size={14} /> Remove</button>
                  </div>
                  <input value={e.school} onChange={(ev) => updateEducation(e.id, { school: ev.target.value })} placeholder="University / institution" className={`${input} mb-[9px]`} />
                  <input value={e.degree} onChange={(ev) => updateEducation(e.id, { degree: ev.target.value })} placeholder="Degree & field — e.g. BSc Computer Science" className={`${input} mb-[9px]`} />
                  <input value={e.grade} onChange={(ev) => updateEducation(e.id, { grade: ev.target.value })} placeholder="Grade — e.g. First Class · CGPA 3.8" className={`${input} mb-[9px]`} />
                  <input value={e.dates} onChange={(ev) => updateEducation(e.id, { dates: ev.target.value })} placeholder="Dates — e.g. 2016 — 2020" className={input} />
                </div>
              ))}
              <button onClick={addEducation} className="w-full flex items-center justify-center gap-2 bg-surface2 border border-dashed border-line rounded-xl py-[14px] text-gold text-[13.5px] font-medium">
                <Plus size={17} /> Add education
              </button>
            </>
          ) : (me.education ?? []).length === 0 ? (
            <p className="text-dim text-[14px]">No education yet. Tap Edit to add your universities and grades.</p>
          ) : (
            (me.education ?? []).map((e) => (
              <div key={e.id} className="flex gap-3 bg-surface border border-line rounded-xl p-4 mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gold/[0.12] border border-gold/30 text-goldbright shrink-0">
                  <GraduationCap size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[14.5px] text-ink">{e.school}</div>
                  {e.degree && <div className="text-dim text-[12.5px] mt-[2px]">{e.degree}</div>}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-[5px]">
                    {e.grade && <span className="text-gold text-[12px] font-medium">{e.grade}</span>}
                    {e.dates && <span className="font-mono text-[10.5px] text-mut">{e.dates}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      ) : (
        <div className="flex flex-col gap-3 mt-6">
          <Link href="/candidate/quiz" className="flex items-center justify-between bg-surface border border-line rounded-xl px-4 py-4 text-ink text-[14.5px] hover:border-line2">
            Persona Assessment <ChevronRight size={18} className="text-mut" />
          </Link>
          {["Account & Security", "Notifications", "Privacy & Visibility", "Resume Manager"].map((row) => (
            <div key={row} className="flex items-center justify-between bg-surface border border-line rounded-xl px-4 py-4 text-ink text-[14.5px]">
              {row} <ChevronRight size={18} className="text-mut" />
            </div>
          ))}
          <button onClick={handleSignOut} className="flex items-center justify-between bg-surface border border-line rounded-xl px-4 py-4 text-danger text-[14.5px]">
            Sign Out <LogOut size={18} />
          </button>
        </div>
      )}

      {me.animal_trait && ANIMALS[me.animal_trait as AnimalTrait] && personaOpen && (
        <PersonaStatsModal trait={me.animal_trait as AnimalTrait} scores={me.animal_scores} onClose={() => setPersonaOpen(false)} />
      )}
    </div>
  );
}

function PStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center bg-surface border border-line rounded-xl py-4">
      <div className="mb-[6px]">{icon}</div>
      <div className="font-serif text-[21px] font-bold text-gold">{value}</div>
      <div className="eyebrow mt-1">{label}</div>
    </div>
  );
}

function PersonaStatsModal({ trait, scores, onClose }: { trait: AnimalTrait; scores?: PersonaScores | null; onClose: () => void }) {
  const meta = ANIMALS[trait];
  const ranked = scores ? (Object.keys(scores) as AnimalTrait[]).sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0)) : [];
  const top = ranked.filter((a) => (scores?.[a] ?? 0) > 0).slice(0, 5);
  const max = top.length ? scores?.[top[0]] ?? 1 : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-[480px] max-h-[85vh] overflow-y-auto bg-bgtop border border-line rounded-2xl px-6 py-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center">
          <div className="text-[60px] leading-none">{meta.emoji}</div>
          <h3 className="font-serif text-[28px] font-bold text-ink mt-2">{trait}</h3>
          <div className="text-gold text-[14px] font-semibold mt-1">{meta.archetype}</div>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {meta.tags.map((t) => (
              <span key={t} className="bg-surface2 border border-line2 rounded-lg px-[13px] py-2 text-ink text-[12.5px]">{t}</span>
            ))}
          </div>
        </div>

        <p className="text-dim text-[14px] leading-[23px] mt-5">{meta.description}</p>

        {top.length > 0 && (
          <div className="mt-7">
            <div className="eyebrow mb-4">Your top matches</div>
            {top.map((a, i) => {
              const pct = Math.round(((scores?.[a] ?? 0) / max) * 100);
              return (
                <div key={a} className="flex items-center gap-3 mb-3">
                  <span className="text-[18px] w-6 text-center">{ANIMALS[a].emoji}</span>
                  <span className="text-dim text-[13px] w-[74px]">{a}</span>
                  <div className="flex-1 h-2 bg-surface3 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: i === 0 ? "linear-gradient(90deg,#2f9c53,#3fbf6a)" : "linear-gradient(90deg,#b8923d,#e8c873)" }} />
                  </div>
                  <span className="font-mono text-[11px] text-dim w-6 text-right">{scores?.[a] ?? 0}</span>
                </div>
              );
            })}
          </div>
        )}

        <button onClick={onClose} className="mt-7 w-full bg-surface2 border border-line rounded-xl py-[14px] text-ink text-[14px] font-medium">Close</button>
      </div>
    </div>
  );
}
