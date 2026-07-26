import { ArrowRight } from "lucide-react";
import { applicants as mockApplicants, traitEmoji } from "@/lib/mock";

const STAGE_STYLES: Record<string, string> = {
  Applied: "text-dim border-line2 bg-surface2",
  Screening: "text-gold border-gold/30 bg-gold/10",
  Shortlisted: "text-[#5ec9c9] border-[#5ec9c9]/30 bg-[#5ec9c9]/10",
  Interview: "text-info border-info/30 bg-info/10",
  "Final Round": "text-[#a78bfa] border-[#a78bfa]/30 bg-[#a78bfa]/10",
  Offer: "text-ok border-ok/30 bg-ok/10",
  Hired: "text-ok border-ok/40 bg-ok/15",
  Rejected: "text-danger border-danger/30 bg-danger/10",
};

export interface RecentApplicantRow {
  id: string;
  initials: string;
  name: string;
  role: string;
  trait: string | null;
  match: number;
  stage: string;
}

/** Defaults to the demo mock list; the live employer Dashboard passes real matched candidates instead. */
export default function RecentApplicants({ applicants = mockApplicants }: { applicants?: RecentApplicantRow[] }) {
  return (
    <section className="bg-surface border border-line rounded-2xl p-6 mt-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-[22px] font-bold text-ink">Recent Applicants</h2>
        <a className="text-gold text-[13px] flex items-center gap-1 hover:text-goldbright cursor-pointer">
          View all <ArrowRight size={14} />
        </a>
      </div>

      <div className="overflow-x-auto">
      <table className="w-full mt-5 border-collapse min-w-[640px]">
        <thead>
          <tr className="eyebrow text-left">
            <th className="font-normal pb-3">Candidate</th>
            <th className="font-normal pb-3">Role</th>
            <th className="font-normal pb-3">Animal Trait</th>
            <th className="font-normal pb-3">Match Score</th>
            <th className="font-normal pb-3">Stage</th>
            <th className="font-normal pb-3" />
          </tr>
        </thead>
        <tbody>
          {applicants.map((a) => (
            <tr key={a.id} className="border-t border-line/70">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-info/20 text-info flex items-center justify-center text-[12px] font-bold">
                    {a.initials}
                  </div>
                  <span className="text-ink text-[14px] font-medium">{a.name}</span>
                </div>
              </td>
              <td className="py-4 text-dim text-[14px]">{a.role}</td>
              <td className="py-4 text-dim text-[14px]">
                {a.trait ? (
                  <>
                    <span className="mr-2">{traitEmoji[a.trait as keyof typeof traitEmoji]}</span>
                    {a.trait}
                  </>
                ) : (
                  "—"
                )}
              </td>
              <td className="py-4">
                <span className={`text-[14px] font-semibold ${a.match >= 90 ? "text-ok" : "text-gold"}`}>{a.match}%</span>
              </td>
              <td className="py-4">
                <span className={`font-mono text-[10px] uppercase tracking-wide px-3 py-[5px] rounded-full border ${STAGE_STYLES[a.stage] ?? "text-dim border-line2 bg-surface2"}`}>
                  {a.stage}
                </span>
              </td>
              <td className="py-4 text-right">
                <a className="text-dim text-[13px] flex items-center justify-end gap-1 hover:text-gold cursor-pointer">
                  View <ArrowRight size={13} />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </section>
  );
}
