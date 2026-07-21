// Employer/University portal types. Aligned with supabase/schema.sql
// (companies, roles, applications, candidates) and the mobile app's types.

export type OrgType = "candidate" | "employer" | "university";

export type Stage = "Applied" | "Screening" | "Interview" | "Offer" | "Hired";

// Full set of hiring stages an employer can move a matched candidate through
// (matches the mobile/pipeline board columns plus the two terminal states).
export type HireStage =
  | "Applied" | "Screening" | "Interview" | "Final Round" | "Offer" | "Hired" | "Rejected";

// A candidate the employer has matched with, as shown on the Hiring board.
export interface MatchedCandidate {
  matchId: string;
  candidateId: string;
  name: string;
  initials: string;
  trait: AnimalTrait | null;
  score: number;
  stage: HireStage;
  headline: string | null;
}

export type AnimalTrait = 
  | "Lion" | "Eagle" | "Wolf" | "Owl" | "Octopus" | "Elephant"
  | "Cheetah" | "Fox" | "Ant" | "Horse" | "Dolphin" | "Peacock" | "Bear";

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

export interface PipelineCandidate {
  name: string;
  trait: AnimalTrait;
  match: number;
}

export interface JobPipelineStage {
  stage: Stage | "Final Round";
  candidates: PipelineCandidate[];
}

export interface JobRole {
  id: string;
  title: string;
  dept: string;
  status: "Active" | "Draft" | "Closed";
  applicants: number;
  daysOpen: number;
  location: string;
  type: string;
  pipeline: JobPipelineStage[];
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
  trait: AnimalTrait;
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