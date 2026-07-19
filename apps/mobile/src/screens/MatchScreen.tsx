import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, Text, useWindowDimensions, View } from "react-native";
import { Eyebrow, ScreenBg } from "@/components/ui";
import { SwipeDeck, SwipeDeckHandle } from "@/components/SwipeDeck";
import { getSwipeDeck, recordSwipe } from "@/data/repo";
import { SwipeCompany, SwipeDirection } from "@/data/types";
import { colors, gradients } from "@/theme/colors";

function CompanyCard({
  c,
  onCreateResume,
  onAddResume,
}: {
  c: SwipeCompany;
  onCreateResume?: (c: SwipeCompany) => void;
  onAddResume?: (c: SwipeCompany) => void;
}) {
  // The resume-action labels are long; on a phone the card isn't wide enough to
  // fit both side-by-side without the text wrapping, so stack them vertically on
  // narrow screens and only go side-by-side on tablets.
  const { width } = useWindowDimensions();
  const stacked = width < 500;
  return (
    <LinearGradient
      colors={gradients.matchCard}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{
        flex: 1,
        borderRadius: 24,
        padding: 22,
        borderWidth: 1,
        borderColor: "#3d6b3f",
        shadowColor: "#000",
        shadowOpacity: 0.45,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 12 },
        elevation: 10,
      }}
    >
      <View className="flex-row justify-between items-start">
        <View className="w-[74px] h-[74px] rounded-[18px] items-center justify-center" style={{ backgroundColor: "rgba(216,180,90,0.13)", borderWidth: 1, borderColor: "rgba(216,180,90,0.3)" }}>
          <Text className="font-serif text-[24px] text-goldbright">{c.initials}</Text>
        </View>
        <View className="flex-row items-center gap-[5px] rounded-[20px] px-3 py-[7px]" style={{ backgroundColor: "rgba(216,180,90,0.18)", borderWidth: 1, borderColor: "rgba(216,180,90,0.4)" }}>
          <Ionicons name="flash" size={12} color={colors.goldbright} />
          <Text className="font-mono text-[11px] font-bold text-goldbright">{c.match}% MATCH</Text>
        </View>
      </View>

      <Text className="font-serif text-[28px] text-ink mt-4">{c.name}</Text>
      <Text className="text-[#bfe3c4] text-[15px] mt-1">{c.role}</Text>

      <View className="flex-row gap-[18px] mt-[14px]">
        <View className="flex-row items-center gap-[5px]">
          <Feather name="map-pin" size={13} color="#9dc4a4" />
          <Text className="text-[#9dc4a4] text-[12.5px]">{c.location}</Text>
        </View>
        <View className="flex-row items-center gap-[5px]">
          <Feather name="users" size={13} color="#9dc4a4" />
          <Text className="text-[#9dc4a4] text-[12.5px]">{c.employees}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2 mt-4">
        {c.tags.map((t) => (
          <View key={t} className="rounded-[18px] px-3 py-[7px]" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}>
            <Text className="text-[#cfe6d2] text-[12px]">{t}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row justify-between items-end mt-auto rounded-[14px] px-4 py-[14px]" style={{ backgroundColor: "rgba(0,0,0,0.22)", borderWidth: 1, borderColor: "rgba(216,180,90,0.18)" }}>
        <View>
          <Text className="font-mono text-[9px] tracking-[1.5px] text-[#9dc4a4] uppercase">Package</Text>
          <Text className="font-serif text-[24px] text-goldbright mt-[5px]">{c.package}</Text>
        </View>
        <View className="items-end gap-[6px]">
          {c.perks.map((p) => (
            <View key={p} className="rounded-[12px] px-[10px] py-1" style={{ backgroundColor: "rgba(216,180,90,0.12)" }}>
              <Text className="text-goldbright text-[10.5px]">{p}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Resume actions */}
      <View className={`${stacked ? "flex-col" : "flex-row"} gap-[10px] mt-[14px] mb-[6px]`}>
        <Pressable
          onPress={() => onCreateResume?.(c)}
          className={`${stacked ? "w-full" : "flex-1"} flex-row items-center justify-center gap-[7px] rounded-[14px] py-[13px]`}
          style={{ backgroundColor: "rgba(216,180,90,0.16)", borderWidth: 1, borderColor: "rgba(216,180,90,0.45)" }}
        >
          <Ionicons name="sparkles" size={14} color={colors.goldbright} />
          <Text numberOfLines={1} className="font-mono text-[10.5px] tracking-[1px] text-goldbright uppercase">Create Specific Resume</Text>
        </Pressable>
        <Pressable
          onPress={() => onAddResume?.(c)}
          className={`${stacked ? "w-full" : "flex-1"} flex-row items-center justify-center gap-[7px] rounded-[14px] py-[13px]`}
          style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }}
        >
          <Feather name="file-text" size={14} color="#cfe6d2" />
          <Text numberOfLines={1} className="font-mono text-[10.5px] tracking-[1px] uppercase" style={{ color: "#cfe6d2" }}>Add Existing Resume</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

/** Build a card from a Home "focus" payload for a company not already in the deck. */
function synthCompany(f: FocusJob): SwipeCompany {
  return {
    id: f.id ?? f.name,
    initials: f.initials ?? f.name.slice(0, 2).toUpperCase(),
    name: f.name,
    role: f.role ?? "",
    location: f.location ?? "",
    employees: f.employees ?? "",
    match: f.match ?? 0,
    tags: f.tags ?? [],
    package: f.package ?? "",
    perks: f.perks ?? [],
  };
}

/** Partial company payload passed from the Home screen when a role is tapped. */
type FocusJob = Partial<SwipeCompany> & { name: string };

export default function MatchScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const [deck, setDeck] = useState<SwipeCompany[]>([]);
  const [matched, setMatched] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [done, setDone] = useState(false);
  const swiperRef = useRef<SwipeDeckHandle>(null);

  useEffect(() => {
    getSwipeDeck().then((d) => {
      setDeck(d);
      setRemaining(d.length);
    });
  }, []);

  // When arriving from a Home role tap, bring that company to the top of the
  // deck (or add it if it isn't there) so its resume actions are front and
  // centre. Changing the deck array also resets the swiper to the top card.
  const focus = route.params?.focus as FocusJob | undefined;
  useEffect(() => {
    if (!focus || deck.length === 0) return;
    setDeck((prev) => {
      const idx = prev.findIndex((c) => c.name.toLowerCase() === focus.name.toLowerCase());
      const ordered =
        idx >= 0
          ? [prev[idx], ...prev.slice(0, idx), ...prev.slice(idx + 1)]
          : [synthCompany(focus), ...prev];
      setRemaining(ordered.length);
      return ordered;
    });
    setDone(false);
    // Clear the param so tapping the same role again re-triggers the focus.
    nav.setParams({ focus: undefined });
  }, [focus, deck.length, nav]);

  function onSwiped(index: number, dir: SwipeDirection) {
    const card = deck[index];
    if (card) recordSwipe(card.id, dir);
    if (dir === "right") setMatched((m) => m + 1);
    setRemaining((r) => Math.max(0, r - 1));
  }

  function onCreateResume(c: SwipeCompany) {
    Alert.alert("Create Specific Resume", `Tailor a new resume for ${c.role} at ${c.name}.`);
  }

  function onAddExistingResume(c: SwipeCompany) {
    Alert.alert("Add Existing Resume", `Attach one of your saved resumes to ${c.name}.`);
  }

  return (
    <ScreenBg>
      <View className="flex-1 px-[22px] pb-[110px]">
        <View className="pt-[10px]">
          <Text className="font-serif text-[26px] text-ink">Job Match</Text>
          <Eyebrow className="mt-2">
            {remaining} {remaining === 1 ? "company" : "companies"} waiting · {matched} matched
          </Eyebrow>
        </View>

        <View style={{ flex: 1, marginTop: 18, maxHeight: 480 }}>
          {!done && deck.length > 0 ? (
            <SwipeDeck
              ref={swiperRef}
              data={deck}
              keyExtractor={(c) => c.id}
              renderCard={(c) => (
                <CompanyCard c={c} onCreateResume={onCreateResume} onAddResume={onAddExistingResume} />
              )}
              onSwiped={(i, dir) => onSwiped(i, dir)}
              onSwipedAll={() => setDone(true)}
              labels={{
                left: { text: "PASS", color: "#e25555" },
                right: { text: "MATCH", color: "#3fbf6a" },
              }}
            />
          ) : (
            <View className="flex-1 items-center justify-center gap-[10px]">
              <Ionicons name="heart" size={40} color={colors.gold} />
              <Text className="font-serif text-[22px] text-ink">You're all caught up</Text>
              <Text className="text-dim text-[13px]">{matched} {matched === 1 ? "match" : "matches"} made today</Text>
            </View>
          )}
        </View>

        {/* actions */}
        <View className="flex-row items-end mt-7">
          {/* Pass */}
          <View className="flex-1 items-center gap-[10px]">
            <Pressable onPress={() => swiperRef.current?.swipeLeft()} className="w-16 h-16 rounded-full items-center justify-center bg-surface2" style={{ borderWidth: 1, borderColor: "rgba(226,85,85,0.45)" }}>
              <Feather name="x" size={26} color={colors.danger} />
            </Pressable>
            <View className="flex-row items-center gap-[5px]">
              <Feather name="arrow-left" size={12} color={colors.danger} />
              <Text className="font-mono text-[10px] tracking-[1.5px] text-dim uppercase">Pass</Text>
            </View>
          </View>

          {/* Swipe or tap hint */}
          <View className="flex-1 items-center gap-[10px]">
            <View className="w-11 h-11 rounded-full items-center justify-center bg-white/5" style={{ borderWidth: 1, borderColor: colors.line }}>
              <Ionicons name="swap-horizontal" size={20} color={colors.dim} />
            </View>
            <Text className="font-mono text-[10px] tracking-[1.5px] text-mut uppercase">Swipe or tap</Text>
          </View>

          {/* Match */}
          <View className="flex-1 items-center gap-[10px]">
            <Pressable onPress={() => swiperRef.current?.swipeRight()} className="w-16 h-16 rounded-full items-center justify-center bg-surface2" style={{ borderWidth: 1, borderColor: "rgba(63,191,106,0.45)" }}>
              <Feather name="check" size={26} color={colors.ok} />
            </Pressable>
            <View className="flex-row items-center gap-[5px]">
              <Text className="font-mono text-[10px] tracking-[1.5px] text-dim uppercase">Match</Text>
              <Feather name="arrow-right" size={12} color={colors.ok} />
            </View>
          </View>
        </View>
      </View>
    </ScreenBg>
  );
}
