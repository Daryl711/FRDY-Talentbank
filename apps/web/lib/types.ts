// Employer/University portal types. Aligned with supabase/schema.sql
// (companies, roles, applications, candidates) and the mobile app's types.

export type OrgType = "employer" | "university";

export type Stage = "Applied" | "Screening" | "Interview" | "Offer" | "Hired";

export type AnimalTrait = "Lion" | "Owl" | "Eagle" | "Bear" | "Dolphin";

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
