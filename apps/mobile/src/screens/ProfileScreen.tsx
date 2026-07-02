import { Feather, Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Avatar, ScreenBg } from "@/components/ui";
import { getMyProfile, signOut, updateMyProfile } from "@/data/repo";
import { Profile } from "@/data/types";
import { colors } from "@/theme/colors";

const experience = [
  { initials: "MC", color: "#2563c4", title: "Senior Product Manager", company: "Meridian Capital", dates: "2021 — Present" },
  { initials: "SV", color: "#6d49d6", title: "Product Manager", company: "Stratos Ventures", dates: "2018 — 2021" },
];

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

  const [editing, setEditing] = useState(false);
  const [about, setAbout] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
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
    setError(null);
    setEditing(true);
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
    const patch = { about: about.trim(), skills: finalSkills };
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
            {experience.map((e) => (
              <View key={e.company} className="flex-row gap-[13px] bg-surface border border-line rounded-[14px] p-[15px] mb-[11px]">
                <View style={{ backgroundColor: e.color }} className="w-[44px] h-[44px] rounded-[11px] items-center justify-center">
                  <Text className="font-bold text-[13px] text-white">{e.initials}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-[14.5px] text-ink">{e.title}</Text>
                  <Text className="text-dim text-[12.5px] mt-[2px]">{e.company}</Text>
                  <Text className="font-mono text-[10.5px] text-mut mt-[5px]">{e.dates}</Text>
                </View>
              </View>
            ))}
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
    </ScreenBg>
  );
}
