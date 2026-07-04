export type Persona = "The Builder" | "The Strategist" | "The Explorer" | "The Connector";

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
