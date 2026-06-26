import { Feather, Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ScreenBg } from "@/components/ui";
import { askAdvisor, suggestedQuestions } from "@/services/advisor";
import { ChatMessage } from "@/data/types";
import { colors } from "@/theme/colors";

const GREETING: ChatMessage = {
  id: "g0",
  who: "ai",
  text: "Hello, Alexander. I'm your personal career advisor. I've analyzed your profile and experience to help you find the ideal role. What would you like to explore today?",
  time: "9:41 AM",
};

export default function AdvisorScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  async function send(question: string) {
    if (!question.trim()) return;
    setStarted(true);
    const mine: ChatMessage = { id: `m${Date.now()}`, who: "me", text: question, time: "Just now" };
    setMessages((prev) => [...prev, mine]);
    setInput("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    const reply = await askAdvisor(question);
    setMessages((prev) => [...prev, { id: `a${Date.now()}`, who: "ai", text: reply, time: "Just now" }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }

  function reset() {
    setMessages([{ id: "g1", who: "ai", text: "Chat reset. What would you like to explore next, Alexander?", time: "Just now" }]);
    setStarted(false);
  }

  return (
    <ScreenBg>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <View className="flex-1 px-[22px]">
          {/* header */}
          <View className="flex-row items-center justify-between pt-[14px]">
            <View className="flex-row items-center gap-[13px]">
              <View className="w-[46px] h-[46px] rounded-full bg-surface2 items-center justify-center" style={{ borderWidth: 1, borderColor: "rgba(216,180,90,0.3)" }}>
                <Ionicons name="sparkles" size={20} color={colors.gold} />
                <View className="absolute bottom-[1px] right-[1px] w-[10px] h-[10px] rounded-full bg-ok" style={{ borderWidth: 2, borderColor: colors.bg }} />
              </View>
              <View>
                <Text className="font-serif text-[21px] text-ink">Career Advisor</Text>
                <Text className="font-mono text-[9.5px] tracking-[1.5px] text-ok uppercase mt-[3px]">Online · AI-Powered</Text>
              </View>
            </View>
            <Pressable onPress={reset} className="w-[42px] h-[42px] rounded-full bg-surface2 border border-line items-center justify-center">
              <Feather name="rotate-ccw" size={18} color={colors.dim} />
            </Pressable>
          </View>

          {/* preference banner */}
          <View className="flex-row justify-between items-start gap-3 bg-surface2 border border-line rounded-[14px] px-4 py-[14px] mt-5">
            <View className="flex-1">
              <Text className="font-mono text-[9px] tracking-[1.5px] text-mut uppercase">Your Job Preferences</Text>
              <Text className="text-ink text-[14px] mt-[7px] leading-5">Senior PM · Fintech · $180K – $230K · Hybrid</Text>
            </View>
            <View className="rounded-[12px] px-[10px] py-[5px]" style={{ backgroundColor: "rgba(63,191,106,0.14)", borderWidth: 1, borderColor: "rgba(63,191,106,0.35)" }}>
              <Text className="font-mono text-[10px] font-bold text-ok">94% FIT</Text>
            </View>
          </View>

          {/* chat */}
          <ScrollView ref={scrollRef} className="flex-1 mt-5" contentContainerStyle={{ paddingBottom: 12, gap: 14 }} showsVerticalScrollIndicator={false}>
            {messages.map((m) =>
              m.who === "me" ? (
                <View key={m.id} className="self-end max-w-[84%] rounded-[16px] px-4 py-[14px]" style={{ backgroundColor: "#cda14a", borderTopRightRadius: 5 }}>
                  <Text className="text-[14px] leading-5 font-medium" style={{ color: "#2b2106" }}>{m.text}</Text>
                </View>
              ) : (
                <View key={m.id} className="flex-row gap-[9px] items-start self-start max-w-[88%]">
                  <View className="w-[26px] h-[26px] rounded-full bg-surface2 items-center justify-center mt-[2px]" style={{ borderWidth: 1, borderColor: "rgba(216,180,90,0.25)" }}>
                    <Ionicons name="sparkles" size={13} color={colors.gold} />
                  </View>
                  <View className="flex-1">
                    <View className="bg-surface2 border border-line rounded-[16px] px-4 py-[14px]" style={{ borderTopLeftRadius: 5 }}>
                      <Text className="text-ink text-[14px] leading-[21px]">{m.text}</Text>
                    </View>
                    <Text className="font-mono text-[10px] text-mut mt-[5px]">{m.time}</Text>
                  </View>
                </View>
              )
            )}

            {/* suggestions (only before first question) */}
            {!started && (
              <View className="mt-2">
                <Text className="font-mono text-[9.5px] tracking-[1.5px] text-mut uppercase mb-[11px]">Suggested Questions</Text>
                <View className="flex-row flex-wrap gap-[10px]">
                  {suggestedQuestions.map((q) => (
                    <Pressable key={q} onPress={() => send(q)} className="rounded-[14px] px-[15px] py-[10px]" style={{ backgroundColor: "rgba(216,180,90,0.08)", borderWidth: 1, borderColor: "rgba(216,180,90,0.28)" }}>
                      <Text className="text-goldbright text-[13px]">{q}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* input */}
          <View className="flex-row items-center gap-[10px] bg-surface2 border border-line rounded-[16px] pl-[18px] pr-[14px] py-[10px] mb-[100px]">
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => send(input)}
              placeholder="Ask about your job preferences…"
              placeholderTextColor={colors.mut}
              className="flex-1 text-ink text-[14px]"
              style={{ fontFamily: "Inter_400Regular" }}
            />
            <Pressable onPress={() => send(input)} className="w-[40px] h-[40px] rounded-[11px] bg-surface3 border border-line2 items-center justify-center">
              <Feather name="send" size={18} color={colors.gold} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenBg>
  );
}
