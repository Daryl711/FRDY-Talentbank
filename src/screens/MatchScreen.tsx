import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Eyebrow, ScreenBg } from "@/components/ui";
import { SwipeDeck, SwipeDeckHandle } from "@/components/SwipeDeck";
import { getSwipeDeck, recordSwipe } from "@/data/repo";
import { SwipeCompany, SwipeDirection } from "@/data/types";
import { colors, gradients } from "@/theme/colors";

function CompanyCard({ c }: { c: SwipeCompany }) {
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
    </LinearGradient>
  );
}

export default function MatchScreen() {
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

  function onSwiped(index: number, dir: SwipeDirection) {
    const card = deck[index];
    if (card) recordSwipe(card.id, dir);
    if (dir === "right") setMatched((m) => m + 1);
    setRemaining((r) => Math.max(0, r - 1));
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
              renderCard={(c) => <CompanyCard c={c} />}
              onSwiped={(i, dir) => onSwiped(i, dir)}
              onSwipedAll={() => setDone(true)}
              labels={{
                left: { text: "PASS", color: "#e25555" },
                right: { text: "MATCH", color: "#3fbf6a" },
                top: { text: "SAVED", color: "#d8b45a" },
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
        <View className="flex-row items-center justify-center gap-6 mt-6">
          <Pressable onPress={() => swiperRef.current?.swipeLeft()} className="w-[62px] h-[62px] rounded-full items-center justify-center bg-surface2" style={{ borderWidth: 1, borderColor: "rgba(226,85,85,0.4)" }}>
            <Feather name="x" size={24} color={colors.danger} />
          </Pressable>
          <Pressable onPress={() => swiperRef.current?.swipeTop()} className="w-[54px] h-[54px] rounded-full items-center justify-center bg-surface2" style={{ borderWidth: 1, borderColor: "rgba(216,180,90,0.4)" }}>
            <Ionicons name="star" size={22} color={colors.gold} />
          </Pressable>
          <Pressable onPress={() => swiperRef.current?.swipeRight()}>
            <LinearGradient colors={["#46c873", "#2f9c53"]} className="w-[62px] h-[62px] rounded-full items-center justify-center">
              <Ionicons name="heart" size={26} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
        <View className="flex-row justify-center gap-7 mt-3">
          <Text className="font-mono text-[9.5px] tracking-[1.5px] text-mut uppercase">← Pass</Text>
          <Text className="font-mono text-[9.5px] tracking-[1.5px] text-mut uppercase">Swipe or tap</Text>
          <Text className="font-mono text-[9.5px] tracking-[1.5px] text-mut uppercase">Match →</Text>
        </View>
      </View>
    </ScreenBg>
  );
}
