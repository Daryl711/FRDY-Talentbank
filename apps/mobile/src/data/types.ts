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

export interface Education {
  id: string;
  /** University / institution name. */
  school: string;
  /** Degree and field of study, e.g. "BSc Computer Science". */
  degree: string;
  /** Grade / CGPA / classification, e.g. "First Class · 3.8". */
  grade: string;
  dates: string;
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
  education: Education[];
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
/** Ordered stages an application moves through, earliest first. */
export type ApplicationStage = "applied" | "review" | "interview" | "offer";

export const APPLICATION_STAGES: { key: ApplicationStage; label: string }[] = [
  { key: "applied", label: "Applied" },
  { key: "review", label: "Under Review" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
];

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
  /** How far the application has progressed through the hiring pipeline. */
  stage: ApplicationStage;
  /** Date the application was submitted, pre-formatted for display. */
  date: string;
}

export interface Connection {
  /** The other candidate's profile id. */
  id: string;
  initials: string;
  color: string;
  name: string;
  role: string;
  mutual: string;
  online: boolean;
  kind: "network" | "requests" | "discover";
  /** Connection row status when one exists ('pending' | 'accepted' | 'declined'). */
  status?: string;
  /** The connections row id — needed to accept a request or open a chat. */
  connection_id?: string | null;
  /** True when I sent this pending request (so Discover shows "Requested"). */
  outgoing?: boolean;
}

export interface ChatMessage {
  id: string;
  who: "ai" | "me";
  text: string;
  time: string;
}

/** A candidate-to-candidate direct message tied to a connection. */
export interface DirectMessage {
  id: string;
  connection_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  /** True when the signed-in user sent this message. */
  mine: boolean;
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
