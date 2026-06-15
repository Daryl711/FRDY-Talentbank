// AI Career Advisor.
//
// For the prototype this returns profile-aware canned responses so the screen
// works with no backend. In production, route through a Supabase Edge Function
// that calls the Anthropic Claude API (keep the API key server-side, never in
// the app bundle). The function shape would be:
//
//   const { data } = await supabase.functions.invoke("advisor", {
//     body: { question, profileId },
//   });
//   return data.reply;

const CANNED: Record<string, string> = {
  "What roles suit me best?":
    "Based on your 8 years in B2B SaaS and fintech, you're an exceptional fit for Senior PM and Director of Product roles at growth-stage fintechs. Meridian Capital (94% fit) and Luminary Group both align tightly with your roadmap and stakeholder strengths.",
  "My ideal salary range":
    "For Senior PM roles in fintech with your profile, the market range is $185K–$235K base in NY. Your interview rate (62%) gives you strong leverage — I'd anchor negotiations near $220K+.",
  "Best industries for me":
    "Your strongest signals point to Fintech, Investment tech, and B2B SaaS. Investment Banking platforms are trending (412 open roles) and reward your data-analytics and OKR experience.",
  "Remote vs on-site preference":
    "Your profile is set to Hybrid, which matches 3 of your top 5 company matches. If flexibility matters most, Stratos Ventures and Apex Partners both offer flexible arrangements.",
};

export async function askAdvisor(question: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 550));
  return (
    CANNED[question] ??
    "Looking at your profile and live matches, prioritize roles above 88% fit — they convert best for candidates with your interview rate."
  );
}

export const suggestedQuestions = [
  "What roles suit me best?",
  "My ideal salary range",
  "Best industries for me",
  "Remote vs on-site preference",
];
