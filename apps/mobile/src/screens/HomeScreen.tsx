import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { Avatar, Card, Eyebrow, GoldButton, ScreenBg, SectionTitle } from "@/components/ui";
import { careerInsights, getFeaturedRoles, getMyProfile, trendingSectors } from "@/data/repo";
import { Profile, Role } from "@/data/types";
import { colors, gradients } from "@/theme/colors";

const fmtK = (n: number) => `$${Math.round(n / 1000)}K`;

/** Time-of-day greeting so the header reads correctly whenever the app is opened. */
function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

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
  const nav = useNavigation<any>();
  const [roles, setRoles] = useState<Role[]>([]);
  const [me, setMe] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  // Locally-saved roles (bookmark toggle). Kept in-memory for the demo.
  const [saved, setSaved] = useState<Set<string>>(new Set());

  // The signed-in user's real profile (name + avatar) and their featured roles.
  // Insights and trending sectors below stay on mock/dummy data.
  const load = useCallback(async () => {
    const [r, p] = await Promise.all([getFeaturedRoles(), getMyProfile()]);
    setRoles(r);
    setMe(p);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  }, [load]);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const filtered = useMemo(
    () =>
      searching
        ? roles.filter((r) => `${r.title} ${r.company} ${r.location} ${r.type}`.toLowerCase().includes(q))
        : roles,
    [roles, q, searching],
  );

  // When searching, drop the hero treatment and show every match as a list row.
  const featured = searching ? undefined : filtered[0];
  const rest = searching ? filtered : filtered.slice(1);

  // Headline stats derived from the loaded roles so they track the real data.
  const topMatch = roles.length ? Math.max(...roles.map((r) => r.match)) : 0;
  const avgSalary = roles.length
    ? Math.round(roles.reduce((s, r) => s + (r.salary_min + r.salary_max) / 2, 0) / roles.length)
    : 0;

  const toggleSave = useCallback((id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Tapping a role (or "Apply Now") jumps to the Job Match tab with this job
  // brought to the top of the deck, where the resume actions live. We pass a
  // full SwipeCompany-shaped payload so Match can show the card even if the
  // company isn't already in the deck.
  const goToJob = useCallback(
    (r: Role) => {
      nav.navigate("Match", {
        focus: {
          id: r.id,
          name: r.company,
          initials: r.initials,
          role: r.title,
          location: r.location,
          match: r.match,
          package: fmtK(r.salary_max),
        },
      });
    },
    [nav],
  );

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} colors={[colors.gold]} />
        }
      >
        {/* greeting */}
        <View className="flex-row items-start justify-between pt-2">
          <View className="flex-1 pr-3">
            <Eyebrow className="mb-1">{greetingForNow()}</Eyebrow>
            <Text className="font-serif text-[27px] text-ink" numberOfLines={1}>
              {me?.name ?? (loading ? "Welcome" : "there")}
            </Text>
          </View>
          <View className="flex-row items-center gap-[10px]">
            <Pressable
              onPress={() => Alert.alert("Notifications", "You have 1 new match and 2 profile views this week.")}
              hitSlop={8}
              className="w-[42px] h-[42px] rounded-full bg-surface2 border border-line items-center justify-center"
            >
              <Feather name="bell" size={19} color={colors.dim} />
              <View className="absolute top-[9px] right-[10px] w-[7px] h-[7px] rounded-full bg-gold" />
            </Pressable>
            <Pressable onPress={() => nav.navigate("Profile")} hitSlop={6}>
              <Avatar initials={me?.initials ?? ""} size={44} gradient online icon />
            </Pressable>
          </View>
        </View>

        {/* search */}
        <View className="flex-row items-center gap-3 bg-surface2 border border-line rounded-[14px] px-4 py-[6px] mt-5">
          <Feather name="search" size={18} color={colors.mut} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search roles, companies, skills…"
            placeholderTextColor={colors.mut}
            returnKeyType="search"
            autoCorrect={false}
            className="flex-1 text-ink text-[14.5px] py-[8px]"
            style={{ fontFamily: "Inter_400Regular" }}
          />
          {searching && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Feather name="x" size={17} color={colors.mut} />
            </Pressable>
          )}
        </View>

        {/* stats */}
        <View className="flex-row gap-[11px] mt-[18px]">
          <StatTile icon={<Ionicons name="briefcase-outline" size={18} color={colors.gold} />} value="2,840" label="Active Roles" />
          <StatTile
            icon={<Feather name="trending-up" size={18} color={colors.gold} />}
            value={avgSalary ? fmtK(avgSalary) : "—"}
            label="Avg. Salary"
          />
          <StatTile
            icon={<Ionicons name="star-outline" size={18} color={colors.gold} />}
            value={topMatch ? `${topMatch}%` : "—"}
            label="Top Match"
          />
        </View>

        <SectionTitle
          action={
            searching ? (
              <Text className="text-mut text-[13px]">
                {filtered.length} {filtered.length === 1 ? "result" : "results"}
              </Text>
            ) : (
              <Pressable className="flex-row items-center gap-1" onPress={() => nav.navigate("Match")} hitSlop={6}>
                <Text className="text-gold text-[13px] font-medium">View all</Text>
                <Feather name="chevron-right" size={14} color={colors.gold} />
              </Pressable>
            )
          }
        >
          {searching ? "Results" : "Featured Roles"}
        </SectionTitle>

        {/* loading / empty states for the roles area */}
        {loading && roles.length === 0 ? (
          <View className="items-center py-10">
            <ActivityIndicator size="small" color={colors.gold} />
          </View>
        ) : filtered.length === 0 ? (
          <Card className="items-center py-9 px-6">
            <Feather name="search" size={22} color={colors.mut} />
            <Text className="text-dim text-[14px] mt-3 text-center">No roles match “{query.trim()}”.</Text>
          </Card>
        ) : null}

        {/* featured role card */}
        {featured && (
          <Pressable onPress={() => goToJob(featured)}>
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
                <GoldButton label="Apply Now" block={false} onPress={() => goToJob(featured)} />
              </View>
            </LinearGradient>
          </Pressable>
        )}

        {/* mini roles */}
        {rest.map((r) => {
          const isSaved = saved.has(r.id);
          return (
            <Pressable key={r.id} onPress={() => goToJob(r)}>
              <Card className="flex-row items-center gap-[14px] p-4 mb-3">
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
                <Pressable onPress={() => toggleSave(r.id)} hitSlop={10}>
                  <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={20} color={isSaved ? colors.gold : colors.mut} />
                </Pressable>
              </Card>
            </Pressable>
          );
        })}

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
          <Pressable key={s.name} onPress={() => Alert.alert(s.name, `${s.open} open roles right now.`)}>
            <Card className="px-4 py-[15px] mb-[11px]">
              <View className="flex-row justify-between items-center">
                <Text className="font-semibold text-[15px] text-ink">{s.name}</Text>
                <Text className="text-dim text-[12.5px]">{s.open} open</Text>
              </View>
              <View className="h-[5px] bg-[#1d2742] rounded mt-[11px] overflow-hidden">
                <LinearGradient colors={gradients.bar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${s.pct}%`, height: "100%" }} />
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </ScreenBg>
  );
}
