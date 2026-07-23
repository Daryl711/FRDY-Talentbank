import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Eyebrow, GoldButton, ScreenBg } from "@/components/ui";
import { Experience, Profile } from "@/data/types";
import { colors } from "@/theme/colors";

/**
 * Second onboarding step (after the Animal Persona quiz): the candidate fills in
 * their About, Skills and Experience. This step is optional — they can skip it
 * and complete it later from their profile. onComplete persists the profile
 * patch and onSkip dismisses the step without saving (see ProfileGate).
 */
export default function ProfileSetupScreen({
  onComplete,
  onSkip,
}: {
  onComplete: (patch: Partial<Profile>) => Promise<void> | void;
  onSkip: () => Promise<void> | void;
}) {
  const [about, setAbout] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [experience, setExperience] = useState<Experience[]>([
    { id: `exp-${Date.now()}`, title: "", company: "", dates: "", description: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.some((k) => k.toLowerCase() === s.toLowerCase())) setSkills([...skills, s]);
    setSkillInput("");
  }
  function removeSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill));
  }
  function addExperience() {
    setExperience([...experience, { id: `exp-${Date.now()}`, title: "", company: "", dates: "", description: "" }]);
  }
  function updateExperience(id: string, patch: Partial<Experience>) {
    setExperience(experience.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  function removeExperience(id: string) {
    setExperience(experience.filter((e) => e.id !== id));
  }

  // Fold any half-typed skill in when judging completeness / saving.
  const pendingSkill = skillInput.trim();
  const allSkills = useMemo(
    () => (pendingSkill && !skills.some((k) => k.toLowerCase() === pendingSkill.toLowerCase()) ? [...skills, pendingSkill] : skills),
    [skills, pendingSkill],
  );
  const filledExperience = experience.filter((e) => e.title.trim() || e.company.trim() || e.description.trim());
  const canSubmit = about.trim().length > 0 && allSkills.length > 0 && filledExperience.length > 0;

  async function submit() {
    if (!canSubmit || saving) return;
    setSaving(true);
    setError(null);
    const patch: Partial<Profile> = {
      about: about.trim(),
      skills: allSkills,
      experience: filledExperience.map((e) => ({
        ...e,
        title: e.title.trim(),
        company: e.company.trim(),
        dates: e.dates.trim(),
        description: e.description.trim(),
      })),
    };
    try {
      await onComplete(patch);
    } catch (e: any) {
      setError(e?.message ?? "Couldn't save your profile. Please try again.");
      setSaving(false);
    }
  }

  const inputCls = "bg-surface2 border border-line rounded-[11px] px-[13px] py-[11px] text-ink text-[14px]";

  return (
    <ScreenBg>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Eyebrow className="!text-gold">Candidate Onboarding · Step 2 of 2 · Optional</Eyebrow>
          <Text className="font-serif text-[30px] text-ink mt-3 leading-[36px]">Complete your{"\n"}profile</Text>
          <Text className="text-dim text-[14px] mt-3 leading-[22px]">
            Tell employers about yourself. Add an intro, your top skills and your work history — or skip for now and finish this anytime from your profile.
          </Text>

          {/* About */}
          <Text className="font-serif text-[19px] text-ink mt-7 mb-3">About</Text>
          <TextInput
            value={about}
            onChangeText={setAbout}
            multiline
            placeholder="A short intro — your focus, strengths and what you're looking for…"
            placeholderTextColor={colors.mut}
            className="bg-surface border border-line rounded-[14px] p-[14px] text-ink text-[14px]"
            style={{ minHeight: 110, lineHeight: 22, textAlignVertical: "top" }}
          />

          {/* Skills */}
          <Text className="font-serif text-[19px] text-ink mt-6 mb-3">Skills</Text>
          {skills.length > 0 && (
            <View className="flex-row flex-wrap gap-[10px] mb-3">
              {skills.map((s) => (
                <Pressable key={s} onPress={() => removeSkill(s)} className="flex-row items-center gap-[8px] bg-surface border border-line2 rounded-[13px] px-[15px] py-[10px]">
                  <Text className="text-ink text-[13px]">{s}</Text>
                  <Feather name="x" size={13} color={colors.mut} />
                </Pressable>
              ))}
            </View>
          )}
          <View className="flex-row items-center gap-[10px]">
            <View className="flex-1 flex-row items-center bg-surface2 border border-line rounded-[13px] px-[14px]">
              <Feather name="tag" size={15} color={colors.mut} />
              <TextInput
                value={skillInput}
                onChangeText={setSkillInput}
                onSubmitEditing={addSkill}
                placeholder="Add a skill"
                placeholderTextColor={colors.mut}
                returnKeyType="done"
                autoCapitalize="words"
                className="flex-1 text-ink text-[14px] py-[12px] px-[10px]"
              />
            </View>
            <Pressable onPress={addSkill} className="bg-surface2 border border-line rounded-[13px] px-[16px] py-[12px]">
              <Feather name="plus" size={18} color={colors.gold} />
            </Pressable>
          </View>

          {/* Experience */}
          <Text className="font-serif text-[19px] text-ink mt-6 mb-3">Experience</Text>
          {experience.map((e, idx) => (
            <View key={e.id} className="bg-surface border border-line rounded-[14px] p-[15px] mb-[11px]">
              <View className="flex-row items-center justify-between mb-[11px]">
                <Text className="font-mono text-[10px] tracking-[1.5px] text-mut uppercase">Role {idx + 1}</Text>
                {experience.length > 1 && (
                  <Pressable onPress={() => removeExperience(e.id)} hitSlop={8} className="flex-row items-center gap-[5px]">
                    <Feather name="trash-2" size={14} color={colors.danger} />
                    <Text className="text-danger text-[12px]">Remove</Text>
                  </Pressable>
                )}
              </View>
              <TextInput value={e.title} onChangeText={(t) => updateExperience(e.id, { title: t })} placeholder="Job title" placeholderTextColor={colors.mut} autoCapitalize="words" className={`${inputCls} mb-[9px]`} />
              <TextInput value={e.company} onChangeText={(t) => updateExperience(e.id, { company: t })} placeholder="Company" placeholderTextColor={colors.mut} autoCapitalize="words" className={`${inputCls} mb-[9px]`} />
              <TextInput value={e.dates} onChangeText={(t) => updateExperience(e.id, { dates: t })} placeholder="Dates — e.g. 2021 — Present" placeholderTextColor={colors.mut} className={`${inputCls} mb-[9px]`} />
              <TextInput value={e.description} onChangeText={(t) => updateExperience(e.id, { description: t })} multiline placeholder="What you did, your impact and achievements…" placeholderTextColor={colors.mut} className={inputCls} style={{ minHeight: 80, lineHeight: 21, textAlignVertical: "top" }} />
            </View>
          ))}
          <Pressable onPress={addExperience} className="flex-row items-center justify-center gap-[8px] bg-surface2 border border-line rounded-[14px] py-[14px]" style={{ borderStyle: "dashed" }}>
            <Feather name="plus" size={17} color={colors.gold} />
            <Text className="text-gold text-[13.5px] font-medium">Add another role</Text>
          </Pressable>

          {error && <Text className="text-danger text-[13px] mt-4">{error}</Text>}

          <View className="mt-7">
            <GoldButton label="Finish & enter Mango" icon="arrow-right" onPress={submit} loading={saving} disabled={!canSubmit} />
          </View>
          <Pressable onPress={() => onSkip()} disabled={saving} hitSlop={8} className="mt-4 py-2 items-center">
            <Text className="text-dim text-[14px] font-medium">Skip for now</Text>
          </Pressable>
          <Text className="text-mut text-[12px] text-center mt-2">
            {canSubmit ? "You can update your profile anytime from the Profile tab." : "Add all three to finish now, or skip and complete it later from your profile."}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBg>
  );
}
