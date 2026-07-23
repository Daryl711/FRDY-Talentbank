import { Feather } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { getMatchMessages, sendMatchMessage, subscribeMatchMessages } from "@/data/repo";
import { MatchMessage, SubmittedJob } from "@/data/types";
import { colors } from "@/theme/colors";

/**
 * Real-time chat between the candidate and the employer of a job they applied
 * to. Bound to the application's company-match thread (SubmittedJob.matchId);
 * messages stream over Supabase Realtime and the employer replies from the web
 * Hiring board. Optimistic sends append and the subscription dedupes by id.
 */
export default function MatchChatModal({
  visible,
  job,
  onClose,
}: {
  visible: boolean;
  job: SubmittedJob | null;
  onClose: () => void;
}) {
  const matchId = job?.matchId ?? null;
  const [messages, setMessages] = useState<MatchMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const merge = (incoming: MatchMessage) =>
    setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));

  useEffect(() => {
    if (!visible || !matchId) return;
    let active = true;
    setLoading(true);
    getMatchMessages(matchId).then((rows) => {
      if (active) {
        setMessages(rows);
        setLoading(false);
      }
    });
    const unsubscribe = subscribeMatchMessages(matchId, (msg) => {
      if (active) merge(msg);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [visible, matchId]);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [messages.length]);

  async function onSend() {
    const text = draft.trim();
    if (!text || !matchId || sending) return;
    setDraft("");
    setSending(true);
    try {
      const saved = await sendMatchMessage(matchId, text);
      if (saved) merge(saved);
    } catch {
      setDraft(text); // restore on failure so the user doesn't lose their message
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="border-t border-line rounded-t-[24px]"
          style={{ backgroundColor: colors.bg, height: "82%" }}
        >
          {/* header */}
          <View className="flex-row items-center gap-3 px-5 pt-4 pb-3 border-b border-line">
            <View className="w-[40px] h-[40px] rounded-[12px] items-center justify-center" style={{ backgroundColor: "rgba(216,180,90,0.13)", borderWidth: 1, borderColor: "rgba(216,180,90,0.3)" }}>
              <Text className="font-serif text-[15px] text-goldbright">{job?.initials ?? "•"}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-[15.5px] text-ink">{job?.name ?? "Employer"}</Text>
              <Text className="text-dim text-[12px] mt-[2px]" numberOfLines={1}>{job?.role ? `Re: ${job.role}` : ""}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} className="w-[34px] h-[34px] rounded-[10px] items-center justify-center bg-surface2 border border-line">
              <Feather name="x" size={18} color={colors.mut} />
            </Pressable>
          </View>

          {/* messages */}
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={colors.gold} />
            </View>
          ) : (
            <ScrollView ref={scrollRef} className="flex-1" contentContainerStyle={{ padding: 18, gap: 10 }} showsVerticalScrollIndicator={false}>
              {messages.length === 0 ? (
                <View className="items-center py-14">
                  <Feather name="message-circle" size={28} color={colors.mut} />
                  <Text className="text-dim text-[13.5px] mt-3 text-center">
                    Message the {job?.name ?? "employer"} hiring team.{"\n"}They can reply from their dashboard.
                  </Text>
                </View>
              ) : (
                messages.map((m) => (
                  <View key={m.id} className={`max-w-[78%] ${m.mine ? "self-end" : "self-start"}`}>
                    <View
                      className={`px-[14px] py-[10px] rounded-2xl border ${m.mine ? "border-gold/40" : "bg-surface border-line"}`}
                      style={m.mine ? { backgroundColor: "rgba(216,180,90,0.14)" } : undefined}
                    >
                      <Text className={`text-[14.5px] ${m.mine ? "text-goldbright" : "text-ink"}`}>{m.body}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {/* composer */}
          <View className="flex-row items-end gap-2 px-4 pt-2 pb-6 border-t border-line">
            <View className="flex-1 bg-surface2 border border-line rounded-[16px] px-4">
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Write a message…"
                placeholderTextColor={colors.mut}
                multiline
                className="text-ink text-[15px] py-[11px] max-h-[110px]"
                style={{ fontFamily: "Inter_400Regular" }}
                onSubmitEditing={onSend}
              />
            </View>
            <Pressable
              onPress={onSend}
              disabled={!draft.trim() || sending}
              className="w-[46px] h-[46px] rounded-[14px] items-center justify-center bg-gold"
              style={{ opacity: !draft.trim() || sending ? 0.5 : 1 }}
            >
              {sending ? <ActivityIndicator size="small" color="#3a2d08" /> : <Feather name="send" size={18} color="#3a2d08" />}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
