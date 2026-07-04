import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Eyebrow, GoldButton, ScreenBg } from "@/components/ui";
import {
    ANIMALS,
    AnimalTrait,
    computePersona,
    DIMENSIONS,
    PersonaResult,
    QUESTIONS,
} from "@/data/persona";
import { colors, gradients } from "@/theme/colors";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export default function PersonaQuizScreen({
    onComplete,
}: {
    onComplete: (result: PersonaResult) => void;
}) {
    const [phase, setPhase] = useState<"intro" | "quiz" | "result">("intro");
    const [idx, setIdx] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>(() => new Array(QUESTIONS.length).fill(null));

    const result = useMemo<PersonaResult | null>(
        () => (phase === "result" ? computePersona(answers) : null),
        [phase, answers]
    );

    function choose(optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = optionIndex;
      return next;
    });
    // Snappy auto-advance, except on the last question.
    if (idx < QUESTIONS.length - 1) {
      setTimeout(() => setIdx((i) => Math.min(i + 1, QUESTIONS.length - 1)), 200);
    }
  }

  function goNext() {
    if (answers[idx] == null) return;
    if (idx < QUESTIONS.length - 1) setIdx((i) => i + 1);
    else setPhase("result");
  }

  function restart() {
    setAnswers(new Array(QUESTIONS.length).fill(null));
    setIdx(0);
    setPhase("intro");
  }

  if (phase === "intro") return <Intro onStart={() => setPhase("quiz")} />;
  if (phase === "result" && result)
    return <Result result={result} onContinue={() => onComplete(result)} onRetake={restart} />;

  const q = QUESTIONS[idx];
  const answered = answers[idx] != null;
  const progress = ((idx + 1) / QUESTIONS.length) * 100;

  return (
    <ScreenBg>
      <View className="flex-1 px-[22px]">
        <View className="flex-row items-center justify-between pt-3 mb-3">
          <Eyebrow>{DIMENSIONS[q.dimension]}</Eyebrow>
          <Eyebrow>{String(idx + 1).padStart(2, "0")} / {QUESTIONS.length}</Eyebrow>
        </View>

        {/* progress bar */}
        <View className="h-[6px] bg-surface3 rounded-full overflow-hidden mb-6">
          <LinearGradient colors={gradients.bar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${progress}%`, height: "100%" }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <Text className="font-serifsemi text-[22px] text-ink leading-[30px] mb-5">{q.text}</Text>

          {q.options.map((opt, i) => {
            const sel = answers[idx] === i;
            return (
              <Pressable
                key={i}
                onPress={() => choose(i)}
                className={`flex-row items-start gap-[13px] rounded-[14px] px-[17px] py-[16px] mb-[11px] border ${
                  sel ? "border-gold bg-gold/[0.09]" : "border-line bg-surface2"
                }`}
              >
                <View
                  className={`w-[24px] h-[24px] rounded-[7px] items-center justify-center mt-[1px] border ${
                    sel ? "bg-gold border-gold" : "bg-surface3 border-line2"
                  }`}
                >
                  <Text className={`font-mono text-[11px] ${sel ? "font-bold" : ""}`} style={{ color: sel ? "#2b2106" : colors.dim }}>
                    {LETTERS[i]}
                  </Text>
                </View>
                <Text className="flex-1 text-ink text-[14.5px] leading-[21px]">{opt.text}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* nav */}
        <View className="flex-row gap-3 py-3">
          {idx > 0 && (
            <Pressable
              onPress={() => setIdx((i) => Math.max(0, i - 1))}
              className="flex-row items-center justify-center gap-2 bg-surface2 border border-line rounded-[14px] px-5 py-[15px]"
            >
              <Feather name="arrow-left" size={16} color={colors.dim} />
              <Text className="text-dim text-[14px] font-medium">Back</Text>
            </Pressable>
          )}
          <View className="flex-1">
            <GoldButton
              label={idx === QUESTIONS.length - 1 ? "See my persona" : "Next"}
              icon={idx === QUESTIONS.length - 1 ? "star" : "arrow-right"}
              disabled={!answered}
              onPress={goNext}
            />
          </View>
        </View>
      </View>
    </ScreenBg>
  );
}

/* ---------------------------------------------------------------- intro */
function Intro({ onStart }: { onStart: () => void }) {
  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 26, paddingVertical: 40 }} showsVerticalScrollIndicator={false}>
        <Eyebrow className="!text-gold">Candidate Onboarding</Eyebrow>
        <Text className="font-serif text-[34px] text-ink mt-3 leading-[40px]">Discover your{"\n"}Animal Persona</Text>
        <Text className="text-dim text-[14.5px] mt-4 leading-[23px]">
          Answer 40 quick questions about how you work, think, and lead. There are no right answers — just pick what feels most like you. We&apos;ll match you to one of 12 personas that shapes how employers see your strengths.
        </Text>

        <View className="flex-row flex-wrap gap-[10px] mt-6">
          {[["40", "questions"], ["~5", "minutes"], ["12", "personas"]].map(([n, l]) => (
            <View key={l} className="bg-surface2 border border-line rounded-[12px] px-[14px] py-[10px]">
              <Text className="text-dim text-[12.5px]"><Text className="text-ink font-bold">{n}</Text> {l}</Text>
            </View>
          ))}
        </View>

        <View className="flex-row flex-wrap gap-2 mt-5">
          {DIMENSIONS.map((d) => (
            <View key={d} className="rounded-[10px] px-[11px] py-[7px]" style={{ backgroundColor: "rgba(216,180,90,0.08)", borderWidth: 1, borderColor: "rgba(216,180,90,0.25)" }}>
              <Text className="font-mono text-[10px] tracking-[1px] text-gold uppercase">{d.split(" ")[0]}</Text>
            </View>
          ))}
        </View>

        <View className="mt-8">
          <GoldButton label="Start the quiz" icon="arrow-right" onPress={onStart} />
        </View>
      </ScrollView>
    </ScreenBg>
  );
}

/* result */
function Result({ result, onContinue, onRetake }: { result: PersonaResult; onContinue: () => void; onRetake: () => void }) {
  const meta = ANIMALS[result.trait];
  const top = result.ranked.slice(0, 5);
  const max = result.scores[result.ranked[0]] || 1;

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 26, paddingVertical: 36, alignItems: "center" }} showsVerticalScrollIndicator={false}>
        <Eyebrow>Your Animal Persona</Eyebrow>
        <Text style={{ fontSize: 72, lineHeight: 84 }}>{meta.emoji}</Text>
        <Text className="font-serif text-[34px] text-ink">{result.trait}</Text>
        <Text className="text-gold text-[15px] font-semibold mt-1">{meta.archetype}</Text>

        <View className="flex-row flex-wrap gap-[9px] justify-center mt-4">
          {meta.tags.map((t) => (
            <View key={t} className="bg-surface2 border border-line2 rounded-[12px] px-[13px] py-[8px]">
              <Text className="text-ink text-[12.5px]">{t}</Text>
            </View>
          ))}
        </View>

        <Text className="text-dim text-[14.5px] leading-[24px] mt-5 self-stretch">{meta.description}</Text>

        {/* breakdown */}
        <View className="self-stretch mt-7">
          <Eyebrow className="mb-4">Your top matches</Eyebrow>
          {top.map((a, i) => {
            const pct = Math.round((result.scores[a] / max) * 100);
            const isTop = i === 0;
            return (
              <View key={a} className="flex-row items-center gap-[11px] mb-3">
                <Text style={{ fontSize: 18, width: 24, textAlign: "center" }}>{ANIMALS[a].emoji}</Text>
                <Text className="text-dim text-[13px]" style={{ width: 74 }}>{a}</Text>
                <View className="flex-1 h-[8px] bg-surface3 rounded-full overflow-hidden">
                  <LinearGradient
                    colors={isTop ? (["#2f9c53", colors.ok] as const) : gradients.bar}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: `${pct}%`, height: "100%" }}
                  />
                </View>
                <Text className="font-mono text-[11px] text-dim" style={{ width: 22, textAlign: "right" }}>{result.scores[a]}</Text>
              </View>
            );
          })}
        </View>

        <View className="self-stretch mt-8">
          <GoldButton label="Continue to Mango" icon="arrow-right" onPress={onContinue} />
        </View>
        <Pressable onPress={onRetake} className="mt-3 py-2">
          <Text className="text-mut text-[13px]">Retake quiz</Text>
        </Pressable>
      </ScrollView>
    </ScreenBg>
  );
}