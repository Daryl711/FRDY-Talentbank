// Drafts a real, tailored resume for the signed-in candidate using Claude, then
// stores it as a text file in the same `resumes` Storage bucket uploaded resumes
// use — so AI and uploaded resumes are both viewable/downloadable the same way.
//
// Called from the app via `supabase.functions.invoke("generate-resume", { body })`.
// Requires the ANTHROPIC_API_KEY secret: `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`

import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";
import { corsHeaders } from "../_shared/cors.ts";

interface RequestBody {
  targetRole: string;
  targetCompany?: string | null;
}

interface ResumeContent {
  headline: string;
  summary: string;
  skills: string[];
  experience: { title: string; company: string; dates: string; bullets: string[] }[];
  education: { school: string; degree: string; dates: string }[];
}

const RESUME_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string", description: "A one-line professional headline tailored to the target role." },
    summary: { type: "string", description: "A 2-4 sentence professional summary tailored to the target role." },
    skills: { type: "array", items: { type: "string" }, description: "Skills drawn from the candidate's profile, reordered/prioritized for relevance to the target role. Do not invent skills." },
    experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          company: { type: "string" },
          dates: { type: "string" },
          bullets: { type: "array", items: { type: "string" }, description: "Rewritten, achievement-oriented bullet points based only on the candidate's original description." },
        },
        required: ["title", "company", "dates", "bullets"],
        additionalProperties: false,
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: { school: { type: "string" }, degree: { type: "string" }, dates: { type: "string" } },
        required: ["school", "degree", "dates"],
        additionalProperties: false,
      },
    },
  },
  required: ["headline", "summary", "skills", "experience", "education"],
  additionalProperties: false,
};

function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[a-z][a-z0-9+#.]*/g) ?? []).filter((w) => w.length > 2);
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "have", "will", "are",
  "was", "were", "been", "into", "your", "our", "you", "all", "who", "how", "not",
]);

// A real (if simple) ATS heuristic: how much of the target role/company's
// vocabulary shows up in the generated resume and the candidate's own skills.
// Deliberately NOT model-reported — an LLM asked to self-score its own resume
// has every incentive to say "95".
function computeAtsScore(resumeText: string, targetRole: string, targetCompany: string | null, skills: string[]): number {
  const roleTokens = new Set(tokenize(`${targetRole} ${targetCompany ?? ""}`).filter((w) => !STOPWORDS.has(w)));
  if (roleTokens.size === 0) return 75;
  const resumeTokens = new Set(tokenize(resumeText));
  const skillTokens = new Set(skills.flatMap(tokenize));
  let matched = 0;
  for (const t of roleTokens) {
    if (resumeTokens.has(t) || skillTokens.has(t)) matched++;
  }
  const coverage = matched / roleTokens.size;
  return Math.min(96, Math.max(55, Math.round(62 + coverage * 34)));
}

function renderResumeText(input: {
  name: string;
  location: string;
  targetRole: string;
  targetCompany: string | null;
  content: ResumeContent;
}): string {
  const lines: string[] = [];
  lines.push(input.name.toUpperCase());
  lines.push(input.content.headline);
  if (input.location) lines.push(input.location);
  lines.push("");
  lines.push("SUMMARY");
  lines.push(input.content.summary);
  lines.push("");
  lines.push("SKILLS");
  lines.push(input.content.skills.join(" · "));
  lines.push("");
  lines.push("EXPERIENCE");
  for (const e of input.content.experience) {
    lines.push(`${e.title} — ${e.company} (${e.dates})`);
    for (const b of e.bullets) lines.push(`  • ${b}`);
    lines.push("");
  }
  if (input.content.education.length) {
    lines.push("EDUCATION");
    for (const ed of input.content.education) {
      lines.push(`${ed.school} — ${ed.degree} (${ed.dates})`);
    }
    lines.push("");
  }
  lines.push(`Tailored for: ${input.targetRole}${input.targetCompany ? " at " + input.targetCompany : ""}`);
  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not signed in." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as RequestBody;
    const targetRole = body.targetRole?.trim();
    const targetCompany = body.targetCompany?.trim() || null;
    if (!targetRole) {
      return new Response(JSON.stringify({ error: "targetRole is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("name, headline, location, years_exp, about, skills, experience, education")
      .eq("id", user.id)
      .single();
    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Couldn't load your profile." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

    const response = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 4096,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: RESUME_SCHEMA },
      },
      system:
        "You are an expert resume writer. Draft a tailored resume for the candidate below, targeting the given role (and company, if named). " +
        "Ground every fact in the candidate's provided profile — do not invent employers, dates, titles, metrics, or skills that aren't already present. " +
        "You may rephrase, reorder, and prioritize what's given to better match the target role, and you may quantify vague statements only if a concrete " +
        "number is already implied by the candidate's own description. When the profile is thin (e.g. no experience or education), reflect that honestly " +
        "rather than padding with fabricated content.",
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            targetRole,
            targetCompany,
            candidate: {
              name: profile.name,
              headline: profile.headline,
              location: profile.location,
              years_exp: profile.years_exp,
              about: profile.about,
              skills: profile.skills,
              experience: profile.experience,
              education: profile.education,
            },
          }),
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return new Response(JSON.stringify({ error: "Couldn't generate a resume for that request." }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    if (!textBlock) {
      return new Response(JSON.stringify({ error: "No content generated." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const content = JSON.parse(textBlock.text) as ResumeContent;

    const resumeText = renderResumeText({
      name: profile.name,
      location: profile.location ?? "",
      targetRole,
      targetCompany,
      content,
    });
    const atsScore = computeAtsScore(resumeText, targetRole, targetCompany, profile.skills ?? []);
    const sizeKb = Math.max(1, Math.round(new TextEncoder().encode(resumeText).length / 1024));

    const storagePath = `${user.id}/${Date.now()}_${targetRole.replace(/[^a-z0-9]+/gi, "_")}.txt`;
    const { error: uploadError } = await supabaseClient.storage
      .from("resumes")
      .upload(storagePath, new TextEncoder().encode(resumeText), { contentType: "text/plain", upsert: false });
    if (uploadError) throw uploadError;

    const { data: row, error: insertError } = await supabaseClient
      .from("resumes")
      .insert({
        user_id: user.id,
        title: targetRole,
        label: targetRole,
        kind: "ai",
        for_company: targetCompany,
        storage_path: storagePath,
        size_kb: sizeKb,
        ats_score: atsScore,
      })
      .select()
      .single();
    if (insertError) throw insertError;

    return new Response(JSON.stringify({ resume: row }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-resume failed:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Resume generation failed." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
