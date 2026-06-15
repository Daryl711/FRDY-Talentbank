import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Avatar, ScreenBg } from "@/components/ui";
import { getConnections } from "@/data/repo";
import { Connection } from "@/data/types";
import { colors } from "@/theme/colors";

type Seg = Connection["kind"];
const SEGMENTS: { key: Seg; label: string; badge?: string }[] = [
  { key: "network", label: "Network" },
  { key: "requests", label: "Requests", badge: "2" },
  { key: "discover", label: "Discover" },
];

export default function ConnectScreen() {
  const [seg, setSeg] = useState<Seg>("network");
  const [people, setPeople] = useState<Connection[]>([]);

  useEffect(() => {
    getConnections(seg).then(setPeople);
  }, [seg]);

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <View className="pt-8">
          <Text className="font-serif text-[30px] text-ink">Connections</Text>
          <Text className="text-dim text-[13.5px] mt-[7px]">4 connections · 2 pending requests</Text>
        </View>

        <View className="flex-row items-center gap-3 bg-surface2 border border-line rounded-[14px] px-4 py-[14px] mt-[18px]">
          <Feather name="search" size={18} color={colors.mut} />
          <Text className="text-mut text-[14.5px]">Search your network…</Text>
        </View>

        {/* segmented control */}
        <View className="flex-row bg-surface2 border border-line rounded-[12px] p-[5px] mt-[18px] gap-1">
          {SEGMENTS.map((s) => {
            const on = seg === s.key;
            return (
              <Pressable key={s.key} onPress={() => setSeg(s.key)} className={`flex-1 items-center justify-center flex-row gap-[6px] py-[9px] rounded-[8px] ${on ? "" : ""}`} style={on ? { backgroundColor: colors.gold } : undefined}>
                <Text className={`font-mono text-[11px] tracking-[1px] uppercase ${on ? "font-bold" : "text-dim"}`} style={on ? { color: "#3a2d08" } : undefined}>
                  {s.label}
                </Text>
                {s.badge && (
                  <View className="rounded-[10px] px-[6px] py-[1px]" style={{ backgroundColor: "#3a2d08" }}>
                    <Text className="text-goldbright text-[9px]">{s.badge}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* people */}
        {people.map((p) => {
          const isReq = seg === "requests";
          return (
            <View key={p.id} className="flex-row items-center gap-[14px] bg-surface border border-line rounded-2xl p-[15px] mt-[13px]">
              <Avatar initials={p.initials} size={50} color={p.color} online={p.online} textClass="text-white" />
              <View className="flex-1">
                <Text className="font-semibold text-[15.5px] text-ink">{p.name}</Text>
                <Text className="text-dim text-[12.5px] mt-[3px]">{p.role}</Text>
                <Text className="text-gold font-mono text-[10.5px] mt-[6px]">{p.mutual}</Text>
              </View>
              <Pressable className="w-[40px] h-[40px] rounded-[11px] items-center justify-center" style={{ backgroundColor: "rgba(216,180,90,0.1)", borderWidth: 1, borderColor: "rgba(216,180,90,0.25)" }}>
                <Feather name={isReq ? "check" : "message-square"} size={18} color={colors.gold} />
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </ScreenBg>
  );
}
