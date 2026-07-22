import { Feather } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import ChatModal from "@/components/ChatModal";
import { Avatar, ScreenBg } from "@/components/ui";
import {
  acceptConnection,
  addConnection,
  declineConnection,
  getConnections,
  getRequestCount,
  subscribeConnections,
} from "@/data/repo";
import { Connection } from "@/data/types";
import { colors } from "@/theme/colors";

type Seg = Connection["kind"];
const SEGMENTS: { key: Seg; label: string }[] = [
  { key: "network", label: "Network" },
  { key: "requests", label: "Requests" },
  { key: "discover", label: "Discover" },
];

export default function ConnectScreen() {
  const [seg, setSeg] = useState<Seg>("network");
  const [people, setPeople] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [networkCount, setNetworkCount] = useState(0);
  // Ids with an in-flight action, so the row shows a spinner / stays disabled.
  const [busy, setBusy] = useState<Set<string>>(new Set());
  // Ids I've just sent a request to — instant "Requested" feedback in Discover.
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [chatPeer, setChatPeer] = useState<Connection | null>(null);

  const loadSegment = useCallback((s: Seg) => {
    setLoading(true);
    getConnections(s)
      .then(setPeople)
      .finally(() => setLoading(false));
  }, []);

  const loadBadges = useCallback(() => {
    getRequestCount().then(setRequestCount);
    getConnections("network").then((n) => setNetworkCount(n.length));
  }, []);

  useEffect(() => {
    loadSegment(seg);
  }, [seg, loadSegment]);

  useEffect(() => {
    loadBadges();
    // Live: someone adds/accepts me → refresh the badge and the visible list.
    const unsubscribe = subscribeConnections(() => {
      loadBadges();
      loadSegment(seg);
    });
    return unsubscribe;
  }, [seg, loadBadges, loadSegment]);

  const withBusy = async (id: string, fn: () => Promise<void>) => {
    setBusy((b) => new Set(b).add(id));
    try {
      await fn();
    } finally {
      setBusy((b) => {
        const next = new Set(b);
        next.delete(id);
        return next;
      });
    }
  };

  const onAdd = (p: Connection) =>
    withBusy(p.id, async () => {
      const connId = await addConnection(p.id);
      setRequested((r) => new Set(r).add(p.id));
      // Keep the connection id on the row so Message works right after adding.
      if (connId) {
        setPeople((prev) => prev.map((c) => (c.id === p.id ? { ...c, connection_id: connId, status: "pending", outgoing: true } : c)));
      }
    });

  const onAccept = (p: Connection) =>
    withBusy(p.id, async () => {
      if (p.connection_id) await acceptConnection(p.connection_id);
      setPeople((prev) => prev.filter((c) => c.id !== p.id)); // leaves Requests, joins Network
      loadBadges();
    });

  const onDecline = (p: Connection) =>
    withBusy(p.id, async () => {
      if (p.connection_id) await declineConnection(p.connection_id);
      setPeople((prev) => prev.filter((c) => c.id !== p.id));
      loadBadges();
    });

  function RowAction({ p }: { p: Connection }) {
    const isBusy = busy.has(p.id);
    if (isBusy) {
      return (
        <View className="w-[40px] h-[40px] items-center justify-center">
          <ActivityIndicator size="small" color={colors.gold} />
        </View>
      );
    }

    if (seg === "requests") {
      return (
        <View className="flex-row gap-2">
          <Pressable onPress={() => onDecline(p)} className="w-[40px] h-[40px] rounded-[11px] items-center justify-center bg-surface2 border border-line">
            <Feather name="x" size={18} color={colors.mut} />
          </Pressable>
          <Pressable onPress={() => onAccept(p)} className="w-[40px] h-[40px] rounded-[11px] items-center justify-center" style={{ backgroundColor: "rgba(216,180,90,0.1)", borderWidth: 1, borderColor: "rgba(216,180,90,0.25)" }}>
            <Feather name="check" size={18} color={colors.gold} />
          </Pressable>
        </View>
      );
    }

    if (seg === "discover") {
      const alreadyRequested = requested.has(p.id) || (p.status === "pending" && p.outgoing);
      if (alreadyRequested) {
        return (
          <View className="flex-row items-center gap-[6px] rounded-[11px] px-[11px] h-[40px]" style={{ backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line }}>
            <Feather name="clock" size={14} color={colors.mut} />
            <Text className="font-mono text-[10px] tracking-[0.5px] text-dim uppercase">Requested</Text>
          </View>
        );
      }
      return (
        <Pressable onPress={() => onAdd(p)} className="flex-row items-center gap-[6px] rounded-[11px] px-[12px] h-[40px] bg-gold">
          <Feather name="user-plus" size={15} color="#3a2d08" />
          <Text className="font-mono text-[10px] tracking-[0.5px] font-bold uppercase" style={{ color: "#3a2d08" }}>Add</Text>
        </Pressable>
      );
    }

    // network → message
    return (
      <Pressable onPress={() => setChatPeer(p)} className="w-[40px] h-[40px] rounded-[11px] items-center justify-center" style={{ backgroundColor: "rgba(216,180,90,0.1)", borderWidth: 1, borderColor: "rgba(216,180,90,0.25)" }}>
        <Feather name="message-square" size={18} color={colors.gold} />
      </Pressable>
    );
  }

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <View className="pt-8">
          <Text className="font-serif text-[30px] text-ink">Connections</Text>
          <Text className="text-dim text-[13.5px] mt-[7px]">
            {networkCount} {networkCount === 1 ? "connection" : "connections"} · {requestCount} pending {requestCount === 1 ? "request" : "requests"}
          </Text>
        </View>

        <View className="flex-row items-center gap-3 bg-surface2 border border-line rounded-[14px] px-4 py-[14px] mt-[18px]">
          <Feather name="search" size={18} color={colors.mut} />
          <Text className="text-mut text-[14.5px]">Search your network…</Text>
        </View>

        {/* segmented control */}
        <View className="flex-row bg-surface2 border border-line rounded-[12px] p-[5px] mt-[18px] gap-1">
          {SEGMENTS.map((s) => {
            const on = seg === s.key;
            const badge = s.key === "requests" && requestCount > 0 ? String(requestCount) : undefined;
            return (
              <Pressable key={s.key} onPress={() => setSeg(s.key)} className="flex-1 items-center justify-center flex-row gap-[6px] py-[9px] rounded-[8px]" style={on ? { backgroundColor: colors.gold } : undefined}>
                <Text className={`font-mono text-[11px] tracking-[1px] uppercase ${on ? "font-bold" : "text-dim"}`} style={on ? { color: "#3a2d08" } : undefined}>
                  {s.label}
                </Text>
                {badge && (
                  <View className="rounded-[10px] px-[6px] py-[1px]" style={{ backgroundColor: on ? "#3a2d08" : colors.gold }}>
                    <Text className="text-[9px]" style={{ color: on ? colors.goldbright : "#3a2d08" }}>{badge}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* people */}
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={colors.gold} />
          </View>
        ) : people.length === 0 ? (
          <View className="items-center py-16">
            <Feather name={seg === "requests" ? "inbox" : seg === "discover" ? "compass" : "users"} size={28} color={colors.mut} />
            <Text className="text-dim text-[13.5px] mt-3 text-center">
              {seg === "requests"
                ? "No pending requests."
                : seg === "discover"
                ? "No one new to discover right now."
                : "No connections yet. Add people from Discover."}
            </Text>
          </View>
        ) : (
          people.map((p) => (
            <View key={p.id} className="flex-row items-center gap-[14px] bg-surface border border-line rounded-2xl p-[15px] mt-[13px]">
              <Avatar initials={p.initials} size={50} color={p.color} online={p.online} textClass="text-white" />
              <View className="flex-1">
                <Text className="font-semibold text-[15.5px] text-ink">{p.name}</Text>
                <Text className="text-dim text-[12.5px] mt-[3px]">{p.role}</Text>
                {!!p.mutual && <Text className="text-gold font-mono text-[10.5px] mt-[6px]">{p.mutual}</Text>}
              </View>
              <RowAction p={p} />
            </View>
          ))
        )}
      </ScrollView>

      <ChatModal visible={!!chatPeer} peer={chatPeer} onClose={() => setChatPeer(null)} />
    </ScreenBg>
  );
}
