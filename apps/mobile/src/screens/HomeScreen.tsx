import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Avatar, Card, Eyebrow, GoldButton, ScreenBg, SectionTitle } from "@/components/ui";
import { careerInsights, getFeaturedRoles, getMyProfile, trendingSectors } from "@/data/repo";
import { Profile, Role } from "@/data/types";
import { colors, gradients } from "@/theme/colors";

const fmtK = (n: number) => `$${Math.round(n / 1000)}K`;

function StatTile({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <Card className="flex-1 items-center py-4 px-2">
      <View className="mb-[7px]">{icon}</View>
      <Text className="font-serif text-[20px] text-gold">{value}</Text>
      <Text className="font-mono text-[8.5px] tracking-[1.5px] text-mut uppercase mt-[5px]">{label}</Text>
    </Card>
  );
}

export default function HomeScreen() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [me, setMe] = useState<Profile | null>(null);
  useEffect(() => {
    getFeaturedRoles().then(setRoles);
    // The signed-in user's real profile (name + avatar). Featured roles,
    // insights and trending sectors below stay on mock/dummy data.
    getMyProfile().then(setMe);
  }, []);

  const featured = roles[0];
  const rest = roles.slice(1);

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* greeting */}
        <View className="flex-row items-start justify-between pt-2">
          <View>
            <Eyebrow className="mb-1">Good Morning</Eyebrow>
            <Text className="font-serif text-[27px] text-ink">{me?.name ?? ""}</Text>
          </View>
          <View className="flex-row items-center gap-[10px]">
            <View className="w-[42px] h-[42px] rounded-full bg-surface2 border border-line items-center justify-center">
              <Feather name="bell" size={19} color={colors.dim} />
              <View className="absolute top-[9px] right-[10px] w-[7px] h-[7px] rounded-full bg-gold" />
            </View>
            <Avatar initials={me?.initials ?? ""} size={44} gradient />
          </View>
        </View>

        {/* search */}
        <View className="flex-row items-center gap-3 bg-surface2 border border-line rounded-[14px] px-4 py-[14px] mt-5">
          <Feather name="search" size={18} color={colors.mut} />
          <Text className="text-mut text-[14.5px]">Search roles, companies, skills…</Text>
        </View>

        {/* stats */}
        <View className="flex-row gap-[11px] mt-[18px]">
          <StatTile icon={<Ionicons name="briefcase-outline" size={18} color={colors.gold} />} value="2,840" label="Active Roles" />
          <StatTile icon={<Feather name="trending-up" size={18} color={colors.gold} />} value="$195K" label="Avg. Salary" />
          <StatTile icon={<Ionicons name="star-outline" size={18} color={colors.gold} />} value="94%" label="Top Match" />
        </View>

        <SectionTitle
          action={
            <Pressable className="flex-row items-center gap-1">
              <Text className="text-gold text-[13px] font-medium">View all</Text>
              <Feather name="chevron-right" size={14} color={colors.gold} />
            </Pressable>
          }
        >
          Featured Roles
        </SectionTitle>

        {/* featured role card */}
        {featured && (
          <LinearGradient colors={gradients.featured} start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }} className="rounded-[20px] p-5 mb-[14px]" style={{ borderWidth: 1, borderColor: "#2a3c66" }}>
            <View className="flex-row items-start justify-between">
              <View style={{ backgroundColor: featured.color }} className="w-[54px] h-[54px] rounded-[14px] items-center justify-center">
                <Text className="font-bold text-[16px] text-white">{featured.initials}</Text>
              </View>
              <View className="rounded-[20px] px-3 py-[6px]" style={{ backgroundColor: "rgba(216,180,90,0.14)", borderWidth: 1, borderColor: "rgba(216,180,90,0.35)" }}>
                <Text className="font-mono text-[10px] tracking-[1px] text-goldbright font-bold">{featured.match}% MATCH</Text>
              </View>
            </View>
            <Text className="font-serifsemi text-[22px] text-ink mt-[18px]">{featured.title}</Text>
            <Text className="text-dim text-[14px] mt-[3px]">{featured.company}</Text>
            <View className="flex-row gap-4 mt-[14px]">
              <View className="flex-row items-center gap-[5px]">
                <Feather name="map-pin" size={13} color={colors.dim} />
                <Text className="text-dim text-[12.5px]">{featured.location}</Text>
              </View>
              <View className="flex-row items-center gap-[5px]">
                <Feather name="clock" size={13} color={colors.dim} />
                <Text className="text-dim text-[12.5px]">{featured.posted}</Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between mt-[18px]">
              <Text className="font-serif text-[20px] text-goldbright">{fmtK(featured.salary_min)} – {fmtK(featured.salary_max)}</Text>
              <GoldButton label="Apply Now" />
            </View>
          </LinearGradient>
        )}

        {/* mini roles */}
        {rest.map((r) => (
          <Card key={r.id} className="flex-row items-center gap-[14px] p-4 mb-3">
            <View style={{ backgroundColor: r.color }} className="w-[46px] h-[46px] rounded-[12px] items-center justify-center">
              <Text className="font-bold text-[14px] text-white">{r.initials}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-[15.5px] text-ink">{r.title}</Text>
              <Text className="text-dim text-[13px] mt-[2px]">{r.company}</Text>
              <View className="flex-row items-center mt-[6px]">
                <Text className="text-gold font-semibold text-[12.5px]">{fmtK(r.salary_min)} – {fmtK(r.salary_max)}</Text>
                <Text className="text-mut text-[12.5px] ml-2">{r.type}</Text>
              </View>
            </View>
            <Feather name="bookmark" size={20} color={colors.mut} />
          </Card>
        ))}

        {/* insights */}
        <SectionTitle>Career Insights</SectionTitle>
        <View className="flex-row flex-wrap gap-3">
          {careerInsights.map((i) => (
            <Card key={i.label} className="p-[17px]" style={{ width: "47.5%" }}>
              <Text className="font-mono text-[9px] tracking-[1.5px] text-mut uppercase">{i.label}</Text>
              <Text className="font-serif text-[30px] text-ink mt-2">{i.value}</Text>
              <Text className="text-gold text-[12px] mt-[6px]">{i.sub}</Text>
            </Card>
          ))}
        </View>

        {/* trending */}
        <SectionTitle>Trending Sectors</SectionTitle>
        {trendingSectors.map((s) => (
          <Card key={s.name} className="px-4 py-[15px] mb-[11px]">
            <View className="flex-row justify-between items-center">
              <Text className="font-semibold text-[15px] text-ink">{s.name}</Text>
              <Text className="text-dim text-[12.5px]">{s.open} open</Text>
            </View>
            <View className="h-[5px] bg-[#1d2742] rounded mt-[11px] overflow-hidden">
              <LinearGradient colors={gradients.bar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${s.pct}%`, height: "100%" }} />
            </View>
          </Card>
        ))}
      </ScrollView>
    </ScreenBg>
  );
}
