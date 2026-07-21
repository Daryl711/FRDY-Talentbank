import { Feather, Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SubmittedJob } from "@/data/types";
import { colors } from "@/theme/colors";

/**
 * Bottom sheet listing the jobs the candidate has applied to (right-swiped).
 * Each row shows the company, role, match score and whether it became a mutual
 * match. `jobs` is owned by the parent so the list reflects the latest data.
 */
export default function SubmittedJobsModal({
  visible,
  jobs,
  onClose,
}: {
  visible: boolean;
  jobs: SubmittedJob[];
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          className="border-t border-line rounded-t-[24px] px-6 pt-4 pb-9"
          style={{ backgroundColor: colors.bg, maxHeight: "80%" }}
        >
          <View className="self-center w-[42px] h-[5px] rounded-full mb-5" style={{ backgroundColor: colors.line2 }} />

          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-serifsemi text-[21px] text-ink">Submitted Jobs</Text>
            <Text className="font-mono text-[10px] tracking-[1.5px] text-mut uppercase">
              {jobs.length} {jobs.length === 1 ? "application" : "applications"}
            </Text>
          </View>

          {jobs.length === 0 ? (
            <View className="items-center py-12">
              <Ionicons name="paper-plane-outline" size={30} color={colors.mut} />
              <Text className="text-dim text-[14px] mt-3 text-center">
                No applications yet.{"\n"}Swipe right (Match) on a company to apply.
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {jobs.map((j) => (
                <View key={j.id} className="flex-row items-center gap-[14px] bg-surface border border-line rounded-2xl p-4 mb-3">
                  <View className="w-[46px] h-[46px] rounded-[12px] items-center justify-center" style={{ backgroundColor: "rgba(216,180,90,0.13)", borderWidth: 1, borderColor: "rgba(216,180,90,0.3)" }}>
                    <Text className="font-serif text-[16px] text-goldbright">{j.initials}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-[15.5px] text-ink">{j.role}</Text>
                    <Text className="text-dim text-[13px] mt-[2px]">{j.name}</Text>
                    <View className="flex-row items-center gap-[6px] mt-[6px]">
                      <Feather name="clock" size={11} color={colors.mut} />
                      <Text className="text-mut text-[12px]">{j.date}</Text>
                      <Text className="text-gold text-[12px] ml-1">· {j.match}% match</Text>
                    </View>
                  </View>
                  {/* status pill */}
                  {j.matched ? (
                    <View className="flex-row items-center gap-[5px] rounded-[10px] px-[9px] py-[5px]" style={{ backgroundColor: "rgba(63,191,106,0.14)", borderWidth: 1, borderColor: "rgba(63,191,106,0.35)" }}>
                      <Ionicons name="heart" size={11} color={colors.ok} />
                      <Text className="font-mono text-[9px] tracking-[0.5px] font-bold text-ok">MATCHED</Text>
                    </View>
                  ) : (
                    <View className="rounded-[10px] px-[9px] py-[5px]" style={{ backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line }}>
                      <Text className="font-mono text-[9px] tracking-[0.5px] text-dim">APPLIED</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          <Pressable onPress={onClose} className="mt-5 items-center bg-surface2 border border-line rounded-[14px] py-[14px]">
            <Text className="text-ink text-[14px] font-medium">Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
