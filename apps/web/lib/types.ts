// Employer/University portal types. Aligned with supabase/schema.sql
// (companies, roles, applications, candidates) and the mobile app's types.

export type OrgType = "employer" | "university";

export type Stage = "Applied" | "Screening" | "Interview" | "Offer" | "Hired";

export type AnimalTrait = 
  | "Lion" | "Eagle" | "Wolf" | "Owl" | "Octopus" | "Elephant"
  | "Cheetah" | "Fox" | "Ant" | "Horse" | "Dolphin" | "Peacock";

export interface StatCard {
  label: string;
  value: string;
  delta: string;
  deltaTone: "up" | "down" | "flat";
  icon: "briefcase" | "users" | "trending" | "clock";
}

export interface Applicant {
  id: string;
  name: string;
  initials: string;
  role: string;
  trait: AnimalTrait;
  match: number;
  stage: Stage;
}

export interface PipelineStage {
  stage: Stage;
  count: number;
}

export interface MonthPoint {
  month: string;
  applications: number;
  hired: number;
}

// Animal Traits page types
export interface TraitStat {
  trait: AnimalTrait;
  pct: number;
  count: number;
  color: string;
}

export interface RadarAxis {
  axis: string;
  value: number;
}

export interface TraitCandidate {
  id: string;
  name: string;
  initials: string;
  role: string;
  trait: AnimalTrait;
  match: number;
  archetype: string;
  tags: string[];
  radar: RadarAxis[];
}

// Trajectory page
export interface TrajPoint {
  label: string;
  value: number;
}

export interface NextRole {
  role: string;
  context: string;
  pct: number;
} 

export interface SkillGap {
  name: string;
  current: number;
  required: number;
}

export interface TrajProfile {
  id: string;
  name: string;
  initials: string;
  role: string;
  currentSalary: string;
  arrowTarget: string;
  score: number;
  targetRole: string;
  targetSalary: string;
  confidence: number;
  horizonMonths: number;
  trajectory: TrajPoint[];
  nextRoles: NextRole[];
  skills: SkillGap[];
}