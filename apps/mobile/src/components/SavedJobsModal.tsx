import { Feather, Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Role } from "@/data/types";
import { colors } from "@/theme/colors";

const fmtK = (n: number) => `$${Math.round(n / 1000)}K`;

/**
 * Bottom sheet listing the candidate's saved roles. Tapping a row opens the job
 * (via onOpenJob); the bookmark removes it. `jobs` is owned by the parent so the
 * list stays in sync with the Home screen's saved state.
 */
export default function SavedJobsModal({
  visible,
  jobs,
  onClose,
  onOpenJob,
  onRemove,
}: {
  visible: boolean;
  jobs: Role[];
  onClose: () => void;
  onOpenJob: (role: Role) => void;
  onRemove: (roleId: string) => void;
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
            <Text className="font-serifsemi text-[21px] text-ink">Saved Jobs</Text>
            <Text className="font-mono text-[10px] tracking-[1.5px] text-mut uppercase">
              {jobs.length} {jobs.length === 1 ? "role" : "roles"}
            </Text>
          </View>

          {jobs.length === 0 ? (
            <View className="items-center py-12">
              <Ionicons name="bookmark-outline" size={30} color={colors.mut} />
              <Text className="text-dim text-[14px] mt-3 text-center">
                No saved jobs yet.{"\n"}Tap the bookmark on a role to save it here.
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {jobs.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => onOpenJob(r)}
                  className="flex-row items-center gap-[14px] bg-surface border border-line rounded-2xl p-4 mb-3"
                >
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
                  <Pressable onPress={() => onRemove(r.id)} hitSlop={10}>
                    <Ionicons name="bookmark" size={20} color={colors.gold} />
                  </Pressable>
                </Pressable>
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
