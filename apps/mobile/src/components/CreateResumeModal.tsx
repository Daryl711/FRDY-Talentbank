import { Feather, Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Eyebrow, Field, GoldButton } from "@/components/ui";
import { colors } from "@/theme/colors";

const INCLUDES = [
  "Keyword-matched experience bullets",
  "Quantified achievements",
  "Role-specific summary",
  "ATS-optimized formatting",
];

/**
 * Bottom sheet for generating a role-targeted AI resume. Collects a target role
 * (required) and optional company, then hands them to onGenerate.
 */
export default function CreateResumeModal({
  visible,
  onClose,
  onGenerate,
  generating = false,
}: {
  visible: boolean;
  onClose: () => void;
  onGenerate: (input: { targetRole: string; targetCompany: string }) => void;
  generating?: boolean;
}) {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");

  function submit() {
    if (!role.trim()) return;
    onGenerate({ targetRole: role.trim(), targetCompany: company.trim() });
    setRole("");
    setCompany("");
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          className="border-t border-line rounded-t-[24px] px-6 pt-4 pb-9"
          style={{ backgroundColor: colors.bg }}
        >
          <View className="self-center w-[42px] h-[5px] rounded-full mb-5" style={{ backgroundColor: colors.line2 }} />

          {/* header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-3">
              <View className="w-[38px] h-[38px] rounded-full bg-surface2 items-center justify-center" style={{ borderWidth: 1, borderColor: "rgba(216,180,90,0.3)" }}>
                <Ionicons name="sparkles" size={18} color={colors.gold} />
              </View>
              <Text className="font-serifsemi text-[21px] text-ink">Create Specific Resume</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Feather name="x" size={22} color={colors.mut} />
            </Pressable>
          </View>

          {/* target role */}
          <Eyebrow className="mb-2">Target Role *</Eyebrow>
          <Field icon="target" value={role} onChangeText={setRole} placeholder="e.g. Senior Product Manager" />

          {/* target company */}
          <Eyebrow className="mb-2 mt-5">Target Company (optional)</Eyebrow>
          <Field icon="briefcase" value={company} onChangeText={setCompany} placeholder="e.g. Meridian Capital" />

          {/* AI will include */}
          <View className="bg-surface2 border border-line rounded-[14px] p-4 mt-6">
            <Eyebrow className="!text-gold mb-3">AI will include</Eyebrow>
            <View className="gap-[10px]">
              {INCLUDES.map((item) => (
                <View key={item} className="flex-row items-center gap-[10px]">
                  <Feather name="check-circle" size={15} color={colors.gold} />
                  <Text className="text-dim text-[13.5px]">{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="mt-6">
            <GoldButton label="Generate Resume" icon="zap" onPress={submit} loading={generating} disabled={!role.trim()} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
