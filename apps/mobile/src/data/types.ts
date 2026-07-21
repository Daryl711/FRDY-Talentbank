import type { AnimalTrait, PersonaScores } from "./persona";

// Persona is the taker's animal trait from the quiz (see persona.ts).
export type Persona = AnimalTrait;

export interface Experience {
  id: string;
  title: string;
  company: string;
  dates: string;
  description: string;
}

export interface Profile {
  id: string;
  name: string;
  headline: string;
  location: string;
  years_exp: number;
  persona: Persona;
  about: string;
  skills: string[];
  experience: Experience[];
  initials: string;
  profile_score: number;
  views: number;
  matches: number;
  // Animal Persona quiz result (onboarding). Present once the quiz is completed.
  animal_trait?: AnimalTrait | null;
  animal_scores?: PersonaScores | null;
}

export interface Role {
  id: string;
  company: string;
  initials: string;
  title: string;
  location: string;
  salary_min: number;
  salary_max: number;
  type: "Full-time" | "Hybrid" | "Remote";
  match: number;
  color: string;
  posted: string;
}

export interface SwipeCompany {
  id: string;
  initials: string;
  name: string;
  role: string;
  location: string;
  employees: string;
  match: number;
  tags: string[];
  package: string;
  perks: string[];
}

/** A job the candidate has applied to (swiped right on). */
export interface SubmittedJob {
  id: string;
  initials: string;
  name: string;
  role: string;
  location: string;
  employees: string;
  match: number;
  /** True once the company swiped right back (a mutual match). */
  matched: boolean;
  /** Date the application was submitted, pre-formatted for display. */
  date: string;
}

export interface Connection {
  id: string;
  initials: string;
  color: string;
  name: string;
  role: string;
  mutual: string;
  online: boolean;
  kind: "network" | "requests" | "discover";
}

export interface ChatMessage {
  id: string;
  who: "ai" | "me";
  text: string;
  time: string;
}

export type SwipeDirection = "left" | "right" | "save";

export interface Resume {
  id: string;
  title: string;
  kind: "ai" | "uploaded";
  /** Target company an AI resume was tailored for; null for general/uploaded. */
  forCompany?: string | null;
  date: string;
  sizeKb: number;
  /** Applicant Tracking System match score, 0–100. */
  atsScore: number;
}
