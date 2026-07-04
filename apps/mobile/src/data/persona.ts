// Animal Persona quiz - data + scoring.
// Ported from the internal reference doc: 40 questions across 5 dimensions,
// each answer maps to one or two of 12 animal personas (+1 each). Highest
// total wins. Animal tags are internal only and never shown to the taker.

export type AnimalTrait = 
    | "Lion" | "Eagle" | "Wolf" | "Owl" | "Octopus" | "Elephant"
    | "Cheetah" | "Fox" | "Ant" | "Horse" | "Dolphin" | "Peacock";

export interface AnimalMeta {
    emoji: string;
    archetype: string;
    description: string;
    tags: string[];
}

export const ANIMALS: Record<AnimalTrait, AnimalMeta> = {
    Lion: { emoji: "🦁", archetype: "The Commander", description: "You lead from the front. Decisive, confident, and comfortable making the final call, you set direction and expect others to follow. Pressure sharpens you, and you'd rather earn respect than be liked.", tags: ["Leadership", "Decisive", "Bold"] },
    Eagle: { emoji: "🦅", archetype: "The Visionary", description: "You see further than most. A big-picture strategist, you're energised by building what doesn't exist yet and thinking in long-term outcomes. You follow the mission, not the person.", tags: ["Vision", "Strategy", "Innovation"] },
    Wolf: { emoji: "🐺", archetype: "The Team Leader", description: "You lead through the pack. Loyal and strategic, you position people for collective wins and always have your team's back. You win as a group or not at all.", tags: ["Loyalty", "Strategy", "Teamwork"] },
    Owl: { emoji: "🦉", archetype: "The Expert", description: "You go deep. A careful, analytical thinker, you master the detail and become the go-to authority. You'd rather let the work speak than chase the spotlight.", tags: ["Expertise", "Analysis", "Depth"] },
    Octopus: { emoji: "🐙", archetype: "The Builder", description: "You make things real. Adaptive and hands-on, you juggle many threads at once and thrive in ambiguity, shipping fast and iterating as you go.", tags: ["Adaptable", "Creative", "Hands-on"] },
    Elephant: { emoji: "🐘", archetype: "The Mentor", description: "You grow the people around you. Wise, patient, and empathetic, you lead by coaching and measure success by how much others develop because of you.", tags: ["Mentorship", "Empathy", "Wisdom"] },
    Cheetah: { emoji: "🐆", archetype: "The Sprinter", description: "You move fast. High-energy and execution-driven, you thrive under tight deadlines and deliver results faster than anyone expects.", tags: ["Speed", "Execution", "Drive"] },
    Fox: { emoji: "🦊", archetype: "The Strategist", description: "You find the smartest route. Clever and resourceful, you take calculated risks, weigh trade-offs, and solve problems others get stuck on.", tags: ["Strategy", "Resourceful", "Clever"] },
    Ant: { emoji: "🐜", archetype: "The Operator", description: "You make systems airtight. Disciplined and meticulous, you plan ahead, respect good process, and deliver with quiet, dependable precision.", tags: ["Discipline", "Process", "Reliability"] },
    Horse: { emoji: "🐴", archetype: "The Steady Force", description: "You hold everything together. Consistent and dependable, you work through challenges with endurance and keep the team steady when things get rough.", tags: ["Consistency", "Reliability", "Endurance"] },
    Dolphin: { emoji: "🐬", archetype: "The Connector", description: "You're the glue. Warm, collaborative, and people-first, you make sure everyone is heard and keep teams working in harmony. Relationships outlast any job.", tags: ["Collaboration", "Empathy", "Communication"] },
    Peacock: { emoji: "🦚", archetype: "The Energiser", description: "You light up the room. Charismatic and expressive, you inspire through energy, storytelling, and presence, and you want people to feel what you're saying.", tags: ["Charisma", "Influence", "Communication"] },
}

export const DIMENSIONS = [
    "Drive & Motivation",
    "People& Relationships",
    "Thinking Style",
    "Work Style",
    "Values & Environment",
];

export interface QuizOption {
    text: string;
    animals: AnimalTrait[];
}

export interface QuizQuestion {
    dimension: number;  // index into DIMENSIONS
    text: string;
    options: QuizOption[];
}

export const QUESTIONS: QuizQuestion[] = [
    // Dimension 1 - Drive & motivation
    { dimension: 0, text: "What motivates you most at work?", options: [
        { text: "Being in charge and making the final call", animals: ["Lion"] },
        { text: "Seeing the big picture and building something new", animals: ["Eagle"] },
        { text: "Winning as a team and bringing people together", animals: ["Wolf"] },
        { text: "Mastering my craft and being the go-to expert", animals: ["Owl"] }
    ]},
    { dimension: 0, text: "What does success look like to you?", options: [
        { text: "People look to me for direction and trust my decisions", animals: ["Lion"] },
        { text: "I have created something that did not exist before", animals: ["Eagle", "Octopus"] },
        { text: "The people around me grew because of me", animals: ["Elephant"] },
        { text: "I hit my target faster than anyone expected", animals: ["Cheetah"] }] 
    },
    { dimension: 0, text: "When you start a new project, what is your first instinct?", options: [
        { text: "Take charge and assign roles immediately", animals: ["Lion", "Wolf"] },
        { text: "Zoom out and think about the end goal first", animals: ["Eagle"] },
        { text: "Research everything before making a move", animals: ["Owl", "Fox"] },
        { text: "Just start and figure it out along the way", animals: ["Cheetah", "Octopus"] }] 
    },
    { dimension: 0, text: "Which of these would frustrate you most?", options: [
        { text: "Being micromanaged", animals: ["Lion", "Eagle"] },
        { text: "Working alone with no one to collaborate with", animals: ["Dolphin", "Wolf"] },
        { text: "Unclear goals and no structure", animals: ["Ant", "Horse"] },
        { text: "Doing the same repetitive task every day", animals: ["Fox", "Octopus"] }] 
    },
    { dimension: 0, text: "You just achieved something big. What matters most about it?", options: [
        { text: "I led the team to get there", animals: ["Lion"] },
        { text: "It was something nobody had done before", animals: ["Eagle"] },
        { text: "Everyone on the team shared the win", animals: ["Dolphin", "Wolf"] },
        { text: "I executed it perfectly and on time", animals: ["Ant", "Cheetah"] }] 
    },
    { dimension: 0, text: "Imagine your ideal workday. Which feels most like you?", options: [
        { text: "Back-to-back decisions and leading discussions", animals: ["Lion", "Wolf"] },
        { text: "Deep focus time to think, plan, and create", animals: ["Eagle", "Owl"] },
        { text: "Connecting with people — meetings, calls, relationships", animals: ["Dolphin", "Peacock"] },
        { text: "Ticking off a solid checklist of tasks", animals: ["Ant", "Horse"] }] 
    },
    { dimension: 0, text: "What kind of work gives you the most energy?", options: [
        { text: "Challenges that require bold decisions under pressure", animals: ["Lion", "Cheetah"] },
        { text: "Problems nobody has solved before", animals: ["Eagle", "Owl"] },
        { text: "Helping someone grow or figure something out", animals: ["Elephant", "Dolphin"] },
        { text: "Building something tangible from scratch", animals: ["Octopus", "Ant"] }] 
    },
    { dimension: 0, text: "Which statement sounds most like you?", options: [
        { text: "I set the direction — others follow", animals: ["Lion"] },
        { text: "I see what others miss", animals: ["Eagle", "Owl"] },
        { text: "I make everyone around me better", animals: ["Elephant", "Dolphin"] },
        { text: "I get it done — no excuses", animals: ["Cheetah", "Ant"] },
        { text: "I find the smartest route to the goal", animals: ["Fox"] },
        { text: "I hold everything together so others can shine", animals: ["Horse", "Peacock"] }] 
    },
    // Dimension 2 — People & relationships
    { dimension: 1, text: "In a team, which role do you naturally fall into?", options: [
        { text: "The one who sets direction and keeps everyone accountable", animals: ["Lion", "Wolf"] },
        { text: "The one who spots opportunities and inspires the team", animals: ["Eagle"] },
        { text: "The one who makes sure everyone is heard", animals: ["Dolphin", "Elephant"] },
        { text: "The one who quietly gets the most work done", animals: ["Ant", "Horse"] }] 
    },
    { dimension: 1, text: "How do you handle conflict in a team?", options: [
        { text: "Address it head on and make a call", animals: ["Lion"] },
        { text: "Step back, analyse, then propose a solution", animals: ["Owl", "Fox"] },
        { text: "Mediate and make sure both sides feel understood", animals: ["Dolphin", "Elephant"] },
        { text: "Stay focused on the goal and push through it", animals: ["Cheetah", "Horse"] }] 
    },
    { dimension: 1, text: "How would your closest colleagues describe you?", options: [
        { text: "Decisive and confident — someone who leads the charge", animals: ["Lion"] },
        { text: "The big thinker — always one step ahead", animals: ["Eagle"] },
        { text: "The glue — keeps the team connected", animals: ["Dolphin", "Horse"] },
        { text: "The go-to expert — reliable and knowledgeable", animals: ["Owl", "Elephant"] },
        { text: "The energiser — lights up the room", animals: ["Peacock"] },
        { text: "The fixer — solves problems before anyone notices", animals: ["Fox", "Octopus"] }] 
    },
    { dimension: 1, text: "When someone on your team is struggling, what do you do?", options: [
        { text: "Step in, take over, and get things back on track", animals: ["Lion"] },
        { text: "Sit with them and coach them through it", animals: ["Elephant"] },
        { text: "Connect them with the right person who can help", animals: ["Dolphin"] },
        { text: "Give them space but check in quietly", animals: ["Horse", "Owl"] }] 
    },
    { dimension: 1, text: "How do you prefer to communicate at work?", options: [
        { text: "Direct and to the point — no time to waste", animals: ["Lion", "Cheetah"] },
        { text: "Thoughtful and structured — I present ideas clearly", animals: ["Owl", "Fox"] },
        { text: "Warm and conversational — relationships matter", animals: ["Dolphin", "Elephant"] },
        { text: "Energetic and expressive — I want people to feel it", animals: ["Peacock"] }] 
    },
    { dimension: 1, text: "You're at a networking event full of strangers. What do you do?", options: [
        { text: "Work the room — I leave with 10 new contacts", animals: ["Peacock", "Dolphin"] },
        { text: "Find one or two people and have a deep conversation", animals: ["Owl", "Wolf"] },
        { text: "Observe first, then approach relevant people", animals: ["Fox", "Eagle"] },
        { text: "Stick to who I know — depth over breadth", animals: ["Horse", "Elephant"] }] 
    },
    { dimension: 1, text: "What kind of leader do you naturally become?", options: [
        { text: "Clear hierarchy and expectations — I run a tight ship", animals: ["Lion"] },
        { text: "I paint the vision and the team figures out the how", animals: ["Eagle"] },
        { text: "I remove obstacles and support my team", animals: ["Elephant", "Horse"] },
        { text: "I position people strategically for impact", animals: ["Wolf", "Fox"] },
        { text: "I lead through energy and storytelling", animals: ["Peacock"] },
        { text: "I prefer being the expert, not the leader", animals: ["Owl", "Ant"] }] 
    },
    { dimension: 1, text: "How important is it for you to be liked at work?", options: [
        { text: "Not important — respect matters more", animals: ["Lion", "Wolf"] },
        { text: "Somewhat — I want trust, not validation", animals: ["Owl", "Fox"] },
        { text: "Very — positive relationships make everything work", animals: ["Dolphin", "Elephant"] },
        { text: "I want people energised by me, not just to like me", animals: ["Peacock", "Eagle"] }] 
    },
    // Dimension 3 — Thinking style
    { dimension: 2, text: "When facing a complex problem, what is your natural approach?", options: [
        { text: "Trust my gut and act decisively", animals: ["Lion", "Cheetah"] },
        { text: "Map out every angle before making a move", animals: ["Owl", "Fox"] },
        { text: "Talk it through with people I trust", animals: ["Dolphin", "Wolf"] },
        { text: "Break it into steps and tackle each systematically", animals: ["Ant", "Horse"] }] 
    },
    { dimension: 2, text: "Given total freedom on a new project, what excites you most?", options: [
        { text: "Designing the strategy and long-term direction", animals: ["Eagle", "Fox"] },
        { text: "Diving deep into the research and data", animals: ["Owl"] },
        { text: "Building and shipping something fast", animals: ["Cheetah", "Octopus"] },
        { text: "Making sure the process is airtight first", animals: ["Ant"] }] 
    },
    { dimension: 2, text: "How do you make important decisions?", options: [
        { text: "Quickly — I back myself and course-correct", animals: ["Lion", "Cheetah"] },
        { text: "After thorough research and data analysis", animals: ["Owl", "Ant"] },
        { text: "By consulting the people it affects most", animals: ["Dolphin", "Elephant"] },
        { text: "By weighing the strategic trade-offs carefully", animals: ["Fox", "Eagle"] }] 
    },
    { dimension: 2, text: "A project suddenly changes direction. How do you react?", options: [
        { text: "I adapt immediately and keep the team moving", animals: ["Cheetah", "Octopus"] },
        { text: "I need to understand why before I move forward", animals: ["Owl", "Fox"] },
        { text: "I check in with the team to make sure they're okay", animals: ["Dolphin", "Elephant"] },
        { text: "I update the plan and redistribute tasks", animals: ["Ant", "Wolf"] }] 
    },
    { dimension: 2, text: "Which best describes your thinking style?", options: [
        { text: "Big picture — I think in systems and outcomes", animals: ["Eagle", "Fox"] },
        { text: "Detail-oriented — I catch what others miss", animals: ["Owl", "Ant"] },
        { text: "People-first — I think about how it affects everyone", animals: ["Dolphin", "Elephant"] },
        { text: "Instinct-driven — I act on feel and iterate fast", animals: ["Cheetah", "Octopus"] }] 
    },
    { dimension: 2, text: "You disagree with your team's plan. What do you do?", options: [
        { text: "Override it — I'm confident in my judgment", animals: ["Lion"] },
        { text: "Present the data and make a case for my approach", animals: ["Owl", "Fox"] },
        { text: "Raise my concerns but ultimately support the group", animals: ["Dolphin", "Horse"] },
        { text: "Let it play out — I'll adapt either way", animals: ["Octopus", "Cheetah"] }] 
    },
    { dimension: 2, text: "Which kind of challenge excites you most?", options: [
        { text: "A leadership crisis — someone needs to step up", animals: ["Lion", "Wolf"] },
        { text: "A blank slate — build something from nothing", animals: ["Eagle", "Octopus"] },
        { text: "A broken process — fix what isn't working", animals: ["Ant", "Fox"] },
        { text: "A tight deadline — perform under pressure", animals: ["Cheetah", "Horse"] }] 
    },
    { dimension: 2, text: "When you learn something new, what is your style?", options: [
        { text: "I dive deep — I want to understand it fully", animals: ["Owl"] },
        { text: "I learn by doing — hands on from day one", animals: ["Cheetah", "Octopus"] },
        { text: "I learn from people — I ask and absorb from others", animals: ["Dolphin", "Elephant"] },
        { text: "I map it out first — I need structure to absorb", animals: ["Ant", "Fox"] }] 
    },
    // Dimension 4 — Work style
    { dimension: 3, text: "How do you manage your workload?", options: [
        { text: "I delegate — I focus on the highest-impact tasks", animals: ["Lion", "Wolf"] },
        { text: "I plan meticulously — I know exactly what I'm doing", animals: ["Ant", "Owl"] },
        { text: "I juggle many things at once and thrive in chaos", animals: ["Octopus", "Cheetah"] },
        { text: "I focus on one thing and see it through completely", animals: ["Horse", "Fox"] }] 
    },
    { dimension: 3, text: "How do you feel about deadlines?", options: [
        { text: "I thrive on them — pressure brings out my best", animals: ["Cheetah", "Lion"] },
        { text: "I plan ahead so I never feel the pressure", animals: ["Ant", "Owl"] },
        { text: "I hit them but prefer quality over speed", animals: ["Horse", "Elephant"] },
        { text: "I adapt — I'll push for more time if it matters", animals: ["Fox", "Octopus"] }] 
    },
    { dimension: 3, text: "How do you prefer to work?", options: [
        { text: "Lead a team — I'm most effective directing others", animals: ["Lion", "Wolf"] },
        { text: "Solo deep work — I do my best thinking alone", animals: ["Owl", "Ant"] },
        { text: "Collaborative — back and forth energises me", animals: ["Dolphin", "Peacock"] },
        { text: "Flexibly — I adapt to whatever's needed", animals: ["Octopus", "Cheetah"] }] 
    },
    { dimension: 3, text: "What does your ideal work environment look like?", options: [
        { text: "Fast-paced, high-stakes, always something happening", animals: ["Lion", "Cheetah"] },
        { text: "Structured and organised — clear goals, clean process", animals: ["Ant", "Horse"] },
        { text: "Creative and exploratory — freedom to experiment", animals: ["Eagle", "Octopus"] },
        { text: "Collaborative and warm — good people, good culture", animals: ["Dolphin", "Elephant"] }] 
    },
    { dimension: 3, text: "How do you respond when things go wrong?", options: [
        { text: "Take charge immediately and fix it", animals: ["Lion", "Wolf"] },
        { text: "Analyse what went wrong before reacting", animals: ["Owl", "Fox"] },
        { text: "Rally the team and work through it together", animals: ["Dolphin", "Elephant"] },
        { text: "Stay calm, adjust the plan, and keep moving", animals: ["Ant", "Horse"] }] 
    },
    { dimension: 3, text: "How do you handle multiple priorities?", options: [
        { text: "I ruthlessly cut what isn't essential and focus", animals: ["Lion", "Fox"] },
        { text: "I handle everything at once — a natural multi-tasker", animals: ["Octopus"] },
        { text: "I sequence them carefully and work through each", animals: ["Ant", "Horse"] },
        { text: "I delegate what I can and focus on what only I can do", animals: ["Wolf", "Cheetah"] }] 
    },
    { dimension: 3, text: "How do you typically approach a goal?", options: [
        { text: "Sprint hard — get there fast, polish later", animals: ["Cheetah", "Octopus"] },
        { text: "Steady and consistent — slow and sure wins", animals: ["Horse", "Ant"] },
        { text: "Strategically — the smartest path, not the fastest", animals: ["Fox", "Eagle"] },
        { text: "With the team — we go as fast as we all go", animals: ["Dolphin", "Wolf"] }] 
    },
    { dimension: 3, text: "How do you feel about rules and processes?", options: [
        { text: "I make the rules — I don't follow them blindly", animals: ["Lion", "Eagle"] },
        { text: "I respect them — good processes exist for a reason", animals: ["Ant", "Horse"] },
        { text: "I bend them when needed — outcomes matter more", animals: ["Fox", "Cheetah"] },
        { text: "I improve them — always looking for a better way", animals: ["Octopus", "Owl"] }] 
    },
    // Dimension 5 — Values & environment
    { dimension: 4, text: "What kind of company culture do you thrive in?", options: [
        { text: "High performance — results-driven and competitive", animals: ["Lion", "Cheetah"] },
        { text: "Innovative — always exploring and disrupting", animals: ["Eagle", "Octopus"] },
        { text: "People-first — everyone genuinely cares", animals: ["Dolphin", "Elephant"] },
        { text: "Structured and stable — strong foundations", animals: ["Ant", "Horse"] }] 
    },
    { dimension: 4, text: "What matters most to you in a workplace?", options: [
        { text: "Autonomy — freedom to lead and make calls", animals: ["Lion", "Eagle"] },
        { text: "Growth — I want to keep learning and advancing", animals: ["Owl", "Elephant"] },
        { text: "Belonging — I want to be part of something", animals: ["Dolphin", "Horse"] },
        { text: "Impact — I need to know my work matters", animals: ["Wolf", "Cheetah"] }] 
    },
    { dimension: 4, text: "How comfortable are you with risk?", options: [
        { text: "Very — I see risk as opportunity", animals: ["Lion", "Eagle"] },
        { text: "Calculated — only when the data supports it", animals: ["Fox", "Owl"] },
        { text: "Moderate — I prefer a safety net but can leap", animals: ["Wolf", "Octopus"] },
        { text: "Low — I prefer stability and proven paths", animals: ["Ant", "Horse"] }] 
    },
    { dimension: 4, text: "How do you feel about being in the spotlight?", options: [
        { text: "I love it — visibility drives me", animals: ["Peacock", "Lion"] },
        { text: "Comfortable with it when I've earned it", animals: ["Eagle", "Wolf"] },
        { text: "I prefer to let the work speak for itself", animals: ["Owl", "Ant"] },
        { text: "I'd rather shine light on the team than myself", animals: ["Elephant", "Horse"] }] 
    },
    { dimension: 4, text: "What does loyalty mean to you at work?", options: [
        { text: "Loyalty to the mission — I follow the vision", animals: ["Eagle", "Cheetah"] },
        { text: "Loyalty to my team — I'll always have their back", animals: ["Wolf", "Horse"] },
        { text: "Loyalty to people — relationships outlast any job", animals: ["Dolphin", "Elephant"] },
        { text: "Loyalty to my craft — everything to the work itself", animals: ["Owl", "Ant"] }] 
    },
    { dimension: 4, text: "Which environment brings out your best work?", options: [
        { text: "A fast startup where I wear many hats", animals: ["Octopus", "Cheetah"] },
        { text: "A scaled company where I go deep in my specialty", animals: ["Owl", "Ant"] },
        { text: "A mission-driven org where values lead", animals: ["Dolphin", "Elephant"] },
        { text: "My own venture — I want to build something I own", animals: ["Lion", "Eagle"] }] 
    },
    { dimension: 4, text: "What legacy do you want to leave in your career?", options: [
        { text: "I built something that outlasted me", animals: ["Eagle", "Octopus"] },
        { text: "I developed people who went on to do great things", animals: ["Elephant", "Dolphin"] },
        { text: "I led teams that achieved exceptional results", animals: ["Lion", "Wolf"] },
        { text: "I was known as the best at what I did", animals: ["Owl", "Fox"] }] 
    },
    { dimension: 4, text: "If you could pick one superpower at work, what would it be?", options: [
        { text: "Inspire anyone to follow my lead", animals: ["Lion", "Peacock"] },
        { text: "See exactly what will happen 5 years from now", animals: ["Eagle", "Fox"] },
        { text: "Make any team work in perfect harmony", animals: ["Dolphin", "Elephant"] },
        { text: "Execute anything flawlessly at lightning speed", animals: ["Cheetah", "Ant"] },
        { text: "Build anything I can imagine", animals: ["Octopus"] },
        { text: "Always find the smartest solution to any problem", animals: ["Owl", "Fox"] }] 
    },
];

export type PersonaScores = Record<AnimalTrait, number>;

export interface PersonaResult {
    trait: AnimalTrait;
    scores: PersonaScores;
    ranked: AnimalTrait[];
}

/** Tally answers into per-animal scores and return the winner + ranking. */
export function computePersona(answers: (number | null)[]): PersonaResult {
    const scores = {} as PersonaScores;
    (Object.keys(ANIMALS) as AnimalTrait[]).forEach((a) => (scores[a] = 0));
    answers.forEach((ans, qi) => {
        if (ans == null) return;
        const opt = QUESTIONS[qi].options[ans];
        opt?.animals.forEach((a) => (scores[a] += 1));
    });
    const ranked = (Object.keys(scores) as AnimalTrait[]).sort((a, b) => scores[b] - scores[a]);
    return { trait: ranked[0], scores, ranked };
}