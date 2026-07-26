import { ANIMALS } from "@/lib/persona";
import type { TraitCandidate, TraitStat } from "@/lib/types";

// Decorative swatch per trait for the donut/legend — covers every trait the
// Animal Persona quiz can produce (lib/persona.ts), not just the handful the
// static demo data happens to use.
export const TRAIT_COLOR: Record<string, string> = {
  Lion: "#d8b45a", Eagle: "#a78bfa", Wolf: "#5b8fd6", Owl: "#4ac0e0",
  Octopus: "#e0645a", Elephant: "#9a6b34", Cheetah: "#e0894a", Fox: "#f2a65a",
  Ant: "#8bc34a", Horse: "#9aa3b8", Dolphin: "#3fbf6a", Peacock: "#d67a9e",
  Bear: "#7c8291",
};

export interface TraitSource {
  id: string;
  name: string;
  initials: string;
  role: string;
  trait: string | null;
  match: number;
  animalScores: Record<string, number> | null;
}

/**
 * Turns a list of real candidates (each with a quiz trait + score breakdown)
 * into the same TraitStat[]/TraitCandidate[] shapes the Animal Traits page
 * already renders for mock data — shared by the employer and university
 * live variants of that page.
 */
export function computeTraitBreakdown(sources: TraitSource[]): {
  stats: TraitStat[];
  candidates: TraitCandidate[];
  total: number;
} {
  const profiled = sources.filter((s): s is TraitSource & { trait: string } => !!s.trait);
  const total = profiled.length;

  const counts = new Map<string, number>();
  for (const c of profiled) counts.set(c.trait, (counts.get(c.trait) ?? 0) + 1);
  const stats: TraitStat[] = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([trait, count]) => ({
      trait: trait as TraitStat["trait"],
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
      color: TRAIT_COLOR[trait] ?? "#9aa3b8",
    }));

  const candidates: TraitCandidate[] = profiled.map((c) => {
    const meta = ANIMALS[c.trait as keyof typeof ANIMALS];
    const scores = c.animalScores ?? {};
    const radar = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([axis, value]) => ({ axis, value }));
    return {
      id: c.id,
      name: c.name,
      initials: c.initials,
      role: c.role,
      trait: c.trait as TraitCandidate["trait"],
      match: c.match,
      archetype: meta?.archetype ?? c.trait,
      tags: meta?.tags ?? [],
      radar,
    };
  });

  return { stats, candidates, total };
}
