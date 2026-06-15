import { Feather, Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Avatar, ScreenBg } from "@/components/ui";
import { me } from "@/data/mock";
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

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* edit */}
        <View className="flex-row justify-end pt-[10px]">
          <Pressable className="flex-row items-center gap-[7px] bg-surface2 border border-line rounded-[11px] px-[15px] py-[9px]">
            <Feather name="edit-2" size={14} color={colors.gold} />
            <Text className="text-gold text-[13px] font-medium">Edit</Text>
          </Pressable>
        </View>

        {/* identity */}
        <View className="flex-row items-center gap-2 -mt-2">
          <Avatar initials={me.initials} size={80} gradient online />
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
            <Text className="font-serif text-[20px] text-ink mt-6 mb-3">About</Text>
            <Text className="text-dim text-[14px] leading-[23px]">{me.about}</Text>

            <Text className="font-serif text-[20px] text-ink mt-6 mb-3">Skills</Text>
            <View className="flex-row flex-wrap gap-[10px]">
              {me.skills.map((s) => (
                <View key={s} className="bg-surface border border-line2 rounded-[13px] px-[15px] py-[10px]">
                  <Text className="text-ink text-[13px]">{s}</Text>
                </View>
              ))}
            </View>

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
            {["Account & Security", "Notifications", "Privacy & Visibility", "Resume Manager", "Persona Assessment", "Sign Out"].map((row) => (
              <Pressable key={row} className="flex-row items-center justify-between bg-surface border border-line rounded-[14px] px-4 py-[16px]">
                <Text className="text-ink text-[14.5px]">{row}</Text>
                <Feather name="chevron-right" size={18} color={colors.mut} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenBg>
  );
}
