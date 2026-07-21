"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Upload, FileText, Eye, Edit2, MoreHorizontal, Clock, X, Target, Briefcase, CheckCircle, Zap, Loader2 } from "lucide-react";
import { createResume, getResumes, uploadResume, type Resume } from "@/lib/candidate";

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getResumes().then(setResumes);
  }, []);

  const avgAts = useMemo(
    () => (resumes.length ? Math.round(resumes.reduce((s, r) => s + r.atsScore, 0) / resumes.length) : 0),
    [resumes],
  );

  const aiResumes = resumes.filter((r) => r.kind === "ai");
  const uploaded = resumes.filter((r) => r.kind === "uploaded");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function handleGenerate(input: { targetRole: string; targetCompany: string }) {
    setGenerating(true);
    const resume = await createResume(input);
    setResumes((prev) => [resume, ...prev]);
    setGenerating(false);
    setModalOpen(false);
    showToast(`Generated "${resume.title}" · ATS ${resume.atsScore}`);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setUploading(true);
    try {
      const resume = await uploadResume(file);
      setResumes((prev) => [resume, ...prev]);
      showToast(`Uploaded "${resume.title}"`);
    } catch (err) {
      showToast(err instanceof Error ? `Upload failed: ${err.message}` : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-[900px] mx-auto">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-[32px] font-bold text-ink">My Resumes</h1>
          <p className="eyebrow mt-2">{resumes.length} Documents Saved</p>
        </div>
        <div className="text-right">
          <div className="eyebrow">Avg. ATS Score</div>
          <div className="font-serif text-[28px] font-bold text-gold mt-1">{avgAts}%</div>
        </div>
      </header>

      {/* actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => setModalOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-goldbright to-golddeep rounded-2xl py-4 font-semibold text-[14px]"
          style={{ color: "#3a2d08" }}
        >
          <Sparkles size={17} /> Create with AI
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex-1 flex items-center justify-center gap-2 bg-surface2 border border-line rounded-2xl py-4 font-medium text-[14px] text-dim hover:text-ink disabled:opacity-60"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? "Uploading…" : "Upload Resume"}
        </button>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={handleFile} />
      </div>

      {aiResumes.length > 0 && (
        <>
          <h2 className="eyebrow mt-9 mb-3">AI-Generated</h2>
          <div className="flex flex-col gap-3">
            {aiResumes.map((r) => <ResumeCard key={r.id} resume={r} onAction={showToast} />)}
          </div>
        </>
      )}

      {uploaded.length > 0 && (
        <>
          <h2 className="eyebrow mt-7 mb-3">Uploaded</h2>
          <div className="flex flex-col gap-3">
            {uploaded.map((r) => <ResumeCard key={r.id} resume={r} onAction={showToast} />)}
          </div>
        </>
      )}

      {modalOpen && <CreateResumeModal onClose={() => setModalOpen(false)} onGenerate={handleGenerate} generating={generating} />}

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-8 bg-surface3 border border-line2 rounded-xl px-5 py-3 text-ink text-[13px] shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function AtsRing({ score }: { score: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const tone = score >= 90 ? "#3fbf6a" : score >= 80 ? "#d8b45a" : "#e0a94a";
  return (
    <div className="relative w-[52px] h-[52px]">
      <svg width="52" height="52" className="-rotate-90">
        <circle cx="26" cy="26" r={r} stroke="#1b2742" strokeWidth="4" fill="none" />
        <circle cx="26" cy="26" r={r} stroke={tone} strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (score / 100) * c} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-mono text-[12px] font-bold" style={{ color: tone }}>{score}</div>
    </div>
  );
}

function ResumeCard({ resume, onAction }: { resume: Resume; onAction: (msg: string) => void }) {
  const isAi = resume.kind === "ai";
  return (
    <div className="bg-surface border border-line rounded-2xl p-[18px]">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-surface2 shrink-0" style={{ border: `1px solid ${isAi ? "rgba(216,180,90,0.3)" : "#222e48"}` }}>
          {isAi ? <Sparkles size={20} className="text-gold" /> : <FileText size={20} className="text-dim" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[16px] text-ink truncate">{resume.title}</span>
            {isAi && <span className="font-mono text-[8.5px] tracking-wider text-goldbright bg-gold/[0.12] border border-gold/30 rounded px-[6px] py-[2px]">AI</span>}
          </div>
          {resume.forCompany && <div className="text-dim text-[13px] mt-[3px]">For {resume.forCompany}</div>}
          <div className="flex items-center gap-2 mt-[7px] text-mut text-[12px]">
            <Clock size={12} /> {resume.date} <span>· {resume.sizeKb} KB</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <AtsRing score={resume.atsScore} />
          <button onClick={() => onAction(`${resume.title} · options`)} className="text-mut hover:text-ink"><MoreHorizontal size={18} /></button>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button onClick={() => onAction(`Preview "${resume.title}"`)} className="flex-1 flex items-center justify-center gap-2 bg-surface2 border border-line rounded-xl py-[11px] text-dim text-[13.5px] font-medium hover:text-ink">
          <Eye size={15} /> Preview
        </button>
        <button onClick={() => onAction(`Edit "${resume.title}"`)} className="flex-1 flex items-center justify-center gap-2 bg-surface2 border border-line rounded-xl py-[11px] text-gold text-[13.5px] font-medium">
          <Edit2 size={15} /> Edit
        </button>
      </div>
    </div>
  );
}

const INCLUDES = ["Keyword-matched experience bullets", "Quantified achievements", "Role-specific summary", "ATS-optimized formatting"];

function CreateResumeModal({
  onClose, onGenerate, generating,
}: {
  onClose: () => void;
  onGenerate: (input: { targetRole: string; targetCompany: string }) => void;
  generating: boolean;
}) {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");

  function submit() {
    if (!role.trim()) return;
    onGenerate({ targetRole: role.trim(), targetCompany: company.trim() });
  }

  const field = "w-full bg-surface2 border border-line rounded-xl px-4 py-[13px] text-ink text-[15px] outline-none focus:border-gold/50 placeholder:text-mut";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-[480px] bg-bgtop border border-line rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface2 border border-gold/30 flex items-center justify-center"><Sparkles size={18} className="text-gold" /></div>
            <h3 className="font-serif text-[21px] font-semibold text-ink">Create Specific Resume</h3>
          </div>
          <button onClick={onClose} className="text-mut hover:text-ink"><X size={22} /></button>
        </div>

        <label className="eyebrow">Target Role *</label>
        <div className="relative mt-2 mb-5">
          <Target size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-mut" />
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Senior Product Manager" className={`${field} pl-11`} />
        </div>

        <label className="eyebrow">Target Company (optional)</label>
        <div className="relative mt-2">
          <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-mut" />
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Meridian Capital" className={`${field} pl-11`} />
        </div>

        <div className="bg-surface2 border border-line rounded-xl p-4 mt-6">
          <div className="eyebrow !text-gold mb-3">AI will include</div>
          <div className="flex flex-col gap-[10px]">
            {INCLUDES.map((item) => (
              <div key={item} className="flex items-center gap-[10px] text-dim text-[13.5px]">
                <CheckCircle size={15} className="text-gold" /> {item}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!role.trim() || generating}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-goldbright to-golddeep rounded-xl py-[14px] font-semibold text-[15px] disabled:opacity-50"
          style={{ color: "#2b2106" }}
        >
          {generating ? <><Loader2 size={18} className="animate-spin" /> Generating…</> : <><Zap size={18} /> Generate Resume</>}
        </button>
      </div>
    </div>
  );
}
