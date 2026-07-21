import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { colors } from "@/theme/colors";

const STEPS = [
  { n: "1", t: "Animal Persona quiz", s: "40 quick questions (~5 min) that reveal your work style." },
  { n: "2", t: "Your profile", s: "Add your About, Skills and Experience." },
];

/**
 * One-time acknowledgement shown at the very start of candidate onboarding —
 * before the persona quiz and profile setup — so the candidate knows the two
 * steps ahead and why they matter (better job matches). The "Get Started"
 * button is enabled only once they tick the acknowledgement.
 */
export default function OnboardingWelcomeModal({
  visible,
  onAcknowledge,
}: {
  visible: boolean;
  onAcknowledge: () => void;
}) {
  const [checked, setChecked] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.72)", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <View className="w-full border border-line rounded-[24px] p-6" style={{ backgroundColor: colors.bg, maxWidth: 430 }}>
          <View className="items-center">
            <View className="w-[58px] h-[58px] rounded-full items-center justify-center" style={{ backgroundColor: "rgba(216,180,90,0.12)", borderWidth: 1, borderColor: "rgba(216,180,90,0.4)" }}>
              <Feather name="award" size={26} color={colors.gold} />
            </View>
            <Text className="font-serif text-[24px] text-ink mt-4 text-center leading-[30px]">Let&apos;s set you up for better matches</Text>
            <Text className="text-dim text-[14px] mt-3 leading-[22px] text-center">
              To help employers find you and match you with the right roles, we&apos;ll guide you through two quick steps first.
            </Text>
          </View>

          <View className="mt-6 gap-3">
            {STEPS.map((step) => (
              <View key={step.n} className="flex-row gap-[13px] items-start bg-surface2 border border-line rounded-[14px] p-4">
                <View className="w-[26px] h-[26px] rounded-full items-center justify-center" style={{ backgroundColor: colors.gold }}>
                  <Text className="font-mono text-[12px] font-bold" style={{ color: "#3a2d08" }}>{step.n}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-ink text-[14.5px] font-semibold">{step.t}</Text>
                  <Text className="text-dim text-[12.5px] mt-[3px] leading-[18px]">{step.s}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* acknowledgement */}
          <Pressable onPress={() => setChecked((c) => !c)} className="flex-row items-center gap-[11px] mt-5">
            <View
              className="w-[22px] h-[22px] rounded-[7px] items-center justify-center border"
              style={checked ? { backgroundColor: colors.gold, borderColor: colors.gold } : { backgroundColor: colors.surface2, borderColor: colors.line2 }}
            >
              {checked && <Feather name="check" size={14} color="#2b2106" />}
            </View>
            <Text className="flex-1 text-dim text-[13px] leading-[18px]">
              I understand I&apos;ll complete a short quiz and my profile to get better job matches.
            </Text>
          </Pressable>

          <Pressable
            onPress={checked ? onAcknowledge : undefined}
            disabled={!checked}
            className="flex-row items-center justify-center gap-2 rounded-[14px] py-[15px] mt-5"
            style={{ backgroundColor: colors.gold, opacity: checked ? 1 : 0.5 }}
          >
            <Text className="text-[14px] font-semibold" style={{ color: "#3a2d08" }}>Get Started</Text>
            <Feather name="arrow-right" size={16} color="#3a2d08" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
