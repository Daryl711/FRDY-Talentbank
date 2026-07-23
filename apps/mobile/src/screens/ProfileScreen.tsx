import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Avatar, ScreenBg } from "@/components/ui";
import { getMyProfile, signOut, updateMyProfile } from "@/data/repo";
import { ANIMALS, AnimalTrait, PersonaScores } from "@/data/persona";
import { Education, Experience, Profile } from "@/data/types";
import { colors, gradients } from "@/theme/colors";

// Experience cards show a colored company monogram. Since users type a free-form
// company name, derive both the initials and a stable accent color from it.
const expColors = ["#2563c4", "#6d49d6", "#2f8f5b", "#b8553f", "#7c4dab", "#4a6d8c", "#9a6b34", "#3a6ea5"];

function expColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return expColors[h % expColors.length];
}

function expInitials(company: string) {
  const words = company.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "•";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function PStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View className="flex-1 items-center bg-surface border border-line rounded-[14px] py-4 px-2">
      <View className="mb-[6px]">{icon}</View>
      <Text className="font-serif text-[21px] text-gold">{value}</Text>
      <Text className="font-mono text-[8.5px] tracking-[1.2px] text-mut uppercase mt-[5px]">{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const [tab, setTab] = useState<"profile" | "settings">("profile");
  const [me, setMe] = useState<Profile | null>(null);
  const [personaOpen, setPersonaOpen] = useState(false);

  const [editing, setEditing] = useState(false);
  const [about, setAbout] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [experience, setExperience] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyProfile().then(setMe);
  }, []);

  if (!me) {
    return (
      <ScreenBg>
        <View className="flex-1 items-center justify-center">
          <Text className="font-mono text-[11px] tracking-[1.5px] text-mut uppercase">Loading…</Text>
        </View>
      </ScreenBg>
    );
  }

  function startEdit() {
    setAbout(me!.about ?? "");
    setSkills(me!.skills ?? []);
    setSkillInput("");
    // Clone so per-field edits don't mutate the saved profile until we save.
    setExperience((me!.experience ?? []).map((e) => ({ ...e })));
    setEducation((me!.education ?? []).map((e) => ({ ...e })));
    setError(null);
    setEditing(true);
  }

  function addEducation() {
    setEducation([...education, { id: `edu-${Date.now()}`, school: "", degree: "", grade: "", dates: "" }]);
  }

  function updateEducation(id: string, patch: Partial<Education>) {
    setEducation(education.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function removeEducation(id: string) {
    setEducation(education.filter((e) => e.id !== id));
  }

  function addExperience() {
    setExperience([
      ...experience,
      { id: `exp-${Date.now()}`, title: "", company: "", dates: "", description: "" },
    ]);
  }

  function updateExperience(id: string, patch: Partial<Experience>) {
    setExperience(experience.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function removeExperience(id: string) {
    setExperience(experience.filter((e) => e.id !== id));
  }

  function addSkill() {
    const s = skillInput.trim();
    if (!s) return;
    // Skip duplicates (case-insensitive).
    if (!skills.some((k) => k.toLowerCase() === s.toLowerCase())) {
      setSkills([...skills, s]);
    }
    setSkillInput("");
  }

  function removeSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill));
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    // Fold any half-typed skill into the list before saving.
    const pending = skillInput.trim();
    const finalSkills = pending && !skills.some((k) => k.toLowerCase() === pending.toLowerCase())
      ? [...skills, pending]
      : skills;
    // Trim every field, and drop rows the user added but left effectively empty.
    const finalExperience = experience
      .map((e) => ({
        ...e,
        title: e.title.trim(),
        company: e.company.trim(),
        dates: e.dates.trim(),
        description: e.description.trim(),
      }))
      .filter((e) => e.title || e.company || e.description);
    const finalEducation = education
      .map((e) => ({
        ...e,
        school: e.school.trim(),
        degree: e.degree.trim(),
        grade: e.grade.trim(),
        dates: e.dates.trim(),
      }))
      .filter((e) => e.school || e.degree || e.grade);
    const patch = { about: about.trim(), skills: finalSkills, experience: finalExperience, education: finalEducation };
    try {
      const updated = await updateMyProfile(patch);
      // updateMyProfile returns null in mock mode (no Supabase) — keep the
      // local edits either way so the UI reflects the change.
      setMe(updated ?? { ...me!, ...patch });
      setSkillInput("");
      setEditing(false);
    } catch (e: any) {
      setError(e?.message ?? "Couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* edit / log out */}
        <View className="flex-row justify-end gap-[10px] pt-[10px]">
          {editing ? (
            <>
              <Pressable
                onPress={() => setEditing(false)}
                disabled={saving}
                className="flex-row items-center gap-[7px] bg-surface2 border border-line rounded-[11px] px-[15px] py-[9px]"
              >
                <Feather name="x" size={14} color={colors.mut} />
                <Text className="text-mut text-[13px] font-medium">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={save}
                disabled={saving}
                className="flex-row items-center gap-[7px] rounded-[11px] px-[15px] py-[9px]"
                style={{ backgroundColor: colors.gold, opacity: saving ? 0.6 : 1 }}
              >
                <Feather name="check" size={14} color="#3a2d08" />
                <Text className="text-[13px] font-semibold" style={{ color: "#3a2d08" }}>{saving ? "Saving…" : "Save"}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                onPress={startEdit}
                className="flex-row items-center gap-[7px] bg-surface2 border border-line rounded-[11px] px-[15px] py-[9px]"
              >
                <Feather name="edit-2" size={14} color={colors.gold} />
                <Text className="text-gold text-[13px] font-medium">Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => signOut()}
                className="flex-row items-center gap-[7px] bg-surface2 border border-line rounded-[11px] px-[15px] py-[9px]"
              >
                <Feather name="log-out" size={14} color={colors.danger} />
                <Text className="text-danger text-[13px] font-medium">Log Out</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* identity */}
        <View className="flex-row items-center gap-2 -mt-2">
          <Avatar initials={me.initials} size={80} gradient online icon />
          <View className="rounded-[12px] px-[11px] py-[5px]" style={{ backgroundColor: "rgba(216,180,90,0.13)", borderWidth: 1, borderColor: "rgba(216,180,90,0.3)" }}>
            <Text className="font-mono text-[10px] tracking-[1px] text-goldbright">EXECUTIVE PRO</Text>
          </View>
        </View>

        <Text className="font-serif text-[28px] text-ink mt-4">{me.name}</Text>
        <Text className="text-dim text-[15px] mt-1">{me.headline}</Text>
        <View className="flex-row gap-[18px] mt-[10px]">
          <View className="flex-row items-center gap-[6px]">
            <Feather name="map-pin" size={14} color={colors.mut} />
            <Text className="text-mut text-[13px]">{me.location}</Text>
          </View>
          <View className="flex-row items-center gap-[6px]">
            <Ionicons name="briefcase-outline" size={14} color={colors.mut} />
            <Text className="text-mut text-[13px]">{me.years_exp} yrs exp.</Text>
          </View>
        </View>

        {/* stats */}
        <View className="flex-row gap-[11px] mt-5">
          <PStat icon={<Feather name="trending-up" size={16} color={colors.gold} />} value={`${me.profile_score}%`} label="Profile Score" />
          <PStat icon={<Feather name="eye" size={16} color={colors.gold} />} value={`${me.views}`} label="Views" />
          <PStat icon={<Ionicons name="trophy-outline" size={16} color={colors.gold} />} value={`${me.matches}`} label="Matches" />
        </View>

        {/* tabs */}
        <View className="flex-row bg-surface2 border border-line rounded-[12px] p-[5px] mt-5 gap-1">
          {(["profile", "settings"] as const).map((t) => {
            const on = tab === t;
            return (
              <Pressable key={t} onPress={() => setTab(t)} className="flex-1 items-center py-[11px] rounded-[8px]" style={on ? { backgroundColor: colors.gold } : undefined}>
                <Text className={`font-mono text-[11px] tracking-[1.5px] uppercase ${on ? "font-bold" : "text-dim"}`} style={on ? { color: "#3a2d08" } : undefined}>
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === "profile" ? (
          <>
            {error && <Text className="text-danger text-[13px] mt-6">{error}</Text>}

            {/* Animal Persona — tap to open the full stats card */}
            {me.animal_trait && ANIMALS[me.animal_trait] && (
              <Pressable
                onPress={() => setPersonaOpen(true)}
                className="flex-row items-center gap-[14px] bg-surface border border-line rounded-[16px] p-[16px] mt-6"
              >
                <View
                  className="w-[52px] h-[52px] rounded-[14px] items-center justify-center"
                  style={{ backgroundColor: "rgba(216,180,90,0.12)", borderWidth: 1, borderColor: "rgba(216,180,90,0.28)" }}
                >
                  <Text style={{ fontSize: 30, lineHeight: 36 }}>{ANIMALS[me.animal_trait].emoji}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-mono text-[9.5px] tracking-[1.5px] text-mut uppercase mb-[3px]">Animal Persona</Text>
                  <Text className="font-serif text-[19px] text-ink">{me.animal_trait}</Text>
                  <Text className="text-gold text-[12.5px] font-semibold mt-[1px]">{ANIMALS[me.animal_trait].archetype}</Text>
                </View>
                <View className="flex-row items-center gap-[5px]">
                  <Text className="font-mono text-[9.5px] tracking-[1px] text-mut uppercase">Stats</Text>
                  <Feather name="chevron-right" size={18} color={colors.mut} />
                </View>
              </Pressable>
            )}

            <Text className="font-serif text-[20px] text-ink mt-6 mb-3">About</Text>
            {editing ? (
              <TextInput
                value={about}
                onChangeText={setAbout}
                multiline
                placeholder="Write something about yourself…"
                placeholderTextColor={colors.mut}
                className="bg-surface border border-line rounded-[14px] p-[14px] text-ink text-[14px]"
                style={{ minHeight: 120, lineHeight: 22, textAlignVertical: "top" }}
              />
            ) : (
              <Text className="text-dim text-[14px] leading-[23px]">
                {me.about?.trim() ? me.about : "No about yet. Tap Edit to introduce yourself."}
              </Text>
            )}

            <Text className="font-serif text-[20px] text-ink mt-6 mb-3">Skills</Text>
            {!editing && me.skills.length === 0 ? (
              <Text className="text-dim text-[14px] leading-[23px]">No skill yet. Tap Edit to add your skills.</Text>
            ) : (
              <View className="flex-row flex-wrap gap-[10px]">
                {(editing ? skills : me.skills).map((s) => (
                  <Pressable
                    key={s}
                    onPress={editing ? () => removeSkill(s) : undefined}
                    className="flex-row items-center gap-[8px] bg-surface border border-line2 rounded-[13px] px-[15px] py-[10px]"
                  >
                    <Text className="text-ink text-[13px]">{s}</Text>
                    {editing && <Feather name="x" size={13} color={colors.mut} />}
                  </Pressable>
                ))}
                {editing && skills.length === 0 && (
                  <Text className="text-mut text-[13px] py-[10px]">Add a few skills below.</Text>
                )}
              </View>
            )}
            {editing && (
              <View className="flex-row items-center gap-[10px] mt-3">
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
            )}

            <Text className="font-serif text-[20px] text-ink mt-6 mb-3">Experience</Text>
            {editing ? (
              <>
                {experience.map((e, idx) => (
                  <View key={e.id} className="bg-surface border border-line rounded-[14px] p-[15px] mb-[11px]">
                    <View className="flex-row items-center justify-between mb-[11px]">
                      <Text className="font-mono text-[10px] tracking-[1.5px] text-mut uppercase">Role {idx + 1}</Text>
                      <Pressable onPress={() => removeExperience(e.id)} hitSlop={8} className="flex-row items-center gap-[5px]">
                        <Feather name="trash-2" size={14} color={colors.danger} />
                        <Text className="text-danger text-[12px]">Remove</Text>
                      </Pressable>
                    </View>
                    <TextInput
                      value={e.title}
                      onChangeText={(t) => updateExperience(e.id, { title: t })}
                      placeholder="Job title"
                      placeholderTextColor={colors.mut}
                      autoCapitalize="words"
                      className="bg-surface2 border border-line rounded-[11px] px-[13px] py-[11px] text-ink text-[14px] mb-[9px]"
                    />
                    <TextInput
                      value={e.company}
                      onChangeText={(t) => updateExperience(e.id, { company: t })}
                      placeholder="Company"
                      placeholderTextColor={colors.mut}
                      autoCapitalize="words"
                      className="bg-surface2 border border-line rounded-[11px] px-[13px] py-[11px] text-ink text-[14px] mb-[9px]"
                    />
                    <TextInput
                      value={e.dates}
                      onChangeText={(t) => updateExperience(e.id, { dates: t })}
                      placeholder="Dates — e.g. 2021 — Present"
                      placeholderTextColor={colors.mut}
                      className="bg-surface2 border border-line rounded-[11px] px-[13px] py-[11px] text-ink text-[14px] mb-[9px]"
                    />
                    <TextInput
                      value={e.description}
                      onChangeText={(t) => updateExperience(e.id, { description: t })}
                      multiline
                      placeholder="Description — what you did, your impact and achievements…"
                      placeholderTextColor={colors.mut}
                      className="bg-surface2 border border-line rounded-[11px] px-[13px] py-[11px] text-ink text-[14px]"
                      style={{ minHeight: 84, lineHeight: 21, textAlignVertical: "top" }}
                    />
                  </View>
                ))}
                <Pressable
                  onPress={addExperience}
                  className="flex-row items-center justify-center gap-[8px] bg-surface2 border border-line rounded-[14px] py-[14px] mb-[11px]"
                  style={{ borderStyle: "dashed" }}
                >
                  <Feather name="plus" size={17} color={colors.gold} />
                  <Text className="text-gold text-[13.5px] font-medium">Add experience</Text>
                </Pressable>
              </>
            ) : (me.experience ?? []).length === 0 ? (
              <Text className="text-dim text-[14px] leading-[23px]">No experience yet. Tap Edit to add your work history.</Text>
            ) : (
              (me.experience ?? []).map((e) => (
                <View key={e.id} className="flex-row gap-[13px] bg-surface border border-line rounded-[14px] p-[15px] mb-[11px]">
                  <View style={{ backgroundColor: expColor(e.company) }} className="w-[44px] h-[44px] rounded-[11px] items-center justify-center">
                    <Text className="font-bold text-[13px] text-white">{expInitials(e.company)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-[14.5px] text-ink">{e.title}</Text>
                    <Text className="text-dim text-[12.5px] mt-[2px]">{e.company}</Text>
                    {e.dates ? <Text className="font-mono text-[10.5px] text-mut mt-[5px]">{e.dates}</Text> : null}
                    {e.description ? <Text className="text-dim text-[13px] leading-[20px] mt-[9px]">{e.description}</Text> : null}
                  </View>
                </View>
              ))
            )}

            <Text className="font-serif text-[20px] text-ink mt-6 mb-3">Education</Text>
            {editing ? (
              <>
                {education.map((e, idx) => (
                  <View key={e.id} className="bg-surface border border-line rounded-[14px] p-[15px] mb-[11px]">
                    <View className="flex-row items-center justify-between mb-[11px]">
                      <Text className="font-mono text-[10px] tracking-[1.5px] text-mut uppercase">School {idx + 1}</Text>
                      <Pressable onPress={() => removeEducation(e.id)} hitSlop={8} className="flex-row items-center gap-[5px]">
                        <Feather name="trash-2" size={14} color={colors.danger} />
                        <Text className="text-danger text-[12px]">Remove</Text>
                      </Pressable>
                    </View>
                    <TextInput
                      value={e.school}
                      onChangeText={(t) => updateEducation(e.id, { school: t })}
                      placeholder="University / institution"
                      placeholderTextColor={colors.mut}
                      autoCapitalize="words"
                      className="bg-surface2 border border-line rounded-[11px] px-[13px] py-[11px] text-ink text-[14px] mb-[9px]"
                    />
                    <TextInput
                      value={e.degree}
                      onChangeText={(t) => updateEducation(e.id, { degree: t })}
                      placeholder="Degree & field — e.g. BSc Computer Science"
                      placeholderTextColor={colors.mut}
                      autoCapitalize="words"
                      className="bg-surface2 border border-line rounded-[11px] px-[13px] py-[11px] text-ink text-[14px] mb-[9px]"
                    />
                    <TextInput
                      value={e.grade}
                      onChangeText={(t) => updateEducation(e.id, { grade: t })}
                      placeholder="Grade — e.g. First Class · CGPA 3.8"
                      placeholderTextColor={colors.mut}
                      className="bg-surface2 border border-line rounded-[11px] px-[13px] py-[11px] text-ink text-[14px] mb-[9px]"
                    />
                    <TextInput
                      value={e.dates}
                      onChangeText={(t) => updateEducation(e.id, { dates: t })}
                      placeholder="Dates — e.g. 2016 — 2020"
                      placeholderTextColor={colors.mut}
                      className="bg-surface2 border border-line rounded-[11px] px-[13px] py-[11px] text-ink text-[14px]"
                    />
                  </View>
                ))}
                <Pressable
                  onPress={addEducation}
                  className="flex-row items-center justify-center gap-[8px] bg-surface2 border border-line rounded-[14px] py-[14px] mb-[11px]"
                  style={{ borderStyle: "dashed" }}
                >
                  <Feather name="plus" size={17} color={colors.gold} />
                  <Text className="text-gold text-[13.5px] font-medium">Add education</Text>
                </Pressable>
              </>
            ) : (me.education ?? []).length === 0 ? (
              <Text className="text-dim text-[14px] leading-[23px]">No education yet. Tap Edit to add your universities and grades.</Text>
            ) : (
              (me.education ?? []).map((e) => (
                <View key={e.id} className="flex-row gap-[13px] bg-surface border border-line rounded-[14px] p-[15px] mb-[11px]">
                  <View
                    className="w-[44px] h-[44px] rounded-[11px] items-center justify-center"
                    style={{ backgroundColor: "rgba(216,180,90,0.12)", borderWidth: 1, borderColor: "rgba(216,180,90,0.28)" }}
                  >
                    <Feather name="award" size={20} color={colors.goldbright} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-[14.5px] text-ink">{e.school}</Text>
                    {e.degree ? <Text className="text-dim text-[12.5px] mt-[2px]">{e.degree}</Text> : null}
                    <View className="flex-row flex-wrap items-center gap-x-[12px] gap-y-[2px] mt-[5px]">
                      {e.grade ? <Text className="text-gold text-[12px] font-medium">{e.grade}</Text> : null}
                      {e.dates ? <Text className="font-mono text-[10.5px] text-mut">{e.dates}</Text> : null}
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          <View className="mt-6 gap-3">
            {["Account & Security", "Notifications", "Privacy & Visibility", "Resume Manager", "Persona Assessment", "Sign Out"].map((row) => {
              const isSignOut = row === "Sign Out";
              return (
                <Pressable
                  key={row}
                  onPress={isSignOut ? () => signOut() : undefined}
                  className="flex-row items-center justify-between bg-surface border border-line rounded-[14px] px-4 py-[16px]"
                >
                  <Text className={`text-[14.5px] ${isSignOut ? "text-danger" : "text-ink"}`}>{row}</Text>
                  <Feather name={isSignOut ? "log-out" : "chevron-right"} size={18} color={isSignOut ? colors.danger : colors.mut} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {me.animal_trait && ANIMALS[me.animal_trait] && (
        <PersonaStatsModal
          trait={me.animal_trait}
          scores={me.animal_scores}
          visible={personaOpen}
          onClose={() => setPersonaOpen(false)}
        />
      )}
    </ScreenBg>
  );
}

/* -------------------------------------------------- animal persona stats card */
function PersonaStatsModal({
  trait,
  scores,
  visible,
  onClose,
}: {
  trait: AnimalTrait;
  scores?: PersonaScores | null;
  visible: boolean;
  onClose: () => void;
}) {
  const meta = ANIMALS[trait];
  const ranked = scores
    ? (Object.keys(scores) as AnimalTrait[]).sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0))
    : [];
  const top = ranked.filter((a) => (scores?.[a] ?? 0) > 0).slice(0, 5);
  const max = top.length ? scores?.[top[0]] ?? 1 : 1;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onPress={onClose}>
        {/* stop propagation so taps inside the sheet don't close it */}
        <Pressable
          onPress={() => {}}
          className="border-t border-line rounded-t-[24px] px-6 pt-4 pb-9"
          style={{ backgroundColor: colors.bg }}
        >
          <View className="self-center w-[42px] h-[5px] rounded-full mb-5" style={{ backgroundColor: colors.line2 }} />

          <View className="items-center">
            <Text style={{ fontSize: 60, lineHeight: 70 }}>{meta.emoji}</Text>
            <Text className="font-serif text-[28px] text-ink">{trait}</Text>
            <Text className="text-gold text-[14px] font-semibold mt-1">{meta.archetype}</Text>
            <View className="flex-row flex-wrap gap-[9px] justify-center mt-4">
              {meta.tags.map((t) => (
                <View key={t} className="bg-surface2 border border-line2 rounded-[12px] px-[13px] py-[8px]">
                  <Text className="text-ink text-[12.5px]">{t}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text className="text-dim text-[14px] leading-[23px] mt-5">{meta.description}</Text>

          {top.length > 0 && (
            <View className="mt-7">
              <Text className="font-mono text-[10.5px] tracking-[1.8px] text-mut uppercase mb-4">Your top matches</Text>
              {top.map((a, i) => {
                const pct = Math.round(((scores?.[a] ?? 0) / max) * 100);
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
                    <Text className="font-mono text-[11px] text-dim" style={{ width: 22, textAlign: "right" }}>{scores?.[a] ?? 0}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <Pressable onPress={onClose} className="mt-7 items-center bg-surface2 border border-line rounded-[14px] py-[14px]">
            <Text className="text-ink text-[14px] font-medium">Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
