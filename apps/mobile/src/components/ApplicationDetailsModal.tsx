import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { getResumeFileUrl, getResumes } from "@/data/repo";
import { Resume, SubmittedJob } from "@/data/types";
import { colors } from "@/theme/colors";

function fmtSalary(v: number | null | undefined) {
  return typeof v === "number" ? `$${v.toLocaleString()}` : "—";
}

/**
 * Read-only view of what the candidate submitted with a specific application:
 * date applied, the salary figures entered on the job card, and the resume(s)
 * on file (resumes aren't tracked per-application, so this lists the same set
 * the employer sees on their side).
 */
export default function ApplicationDetailsModal({
  visible,
  job,
  onClose,
}: {
  visible: boolean;
  job: SubmittedJob | null;
  onClose: () => void;
}) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !job) return;
    let active = true;
    setLoading(true);
    getResumes().then((r) => {
      if (active) {
        setResumes(r);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [visible, job]);

  async function openFile(path: string) {
    setOpening(path);
    try {
      const url = await getResumeFileUrl(path);
      if (url) await Linking.openURL(url);
    } finally {
      setOpening(null);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          className="border-t border-line rounded-t-[24px] px-6 pt-4 pb-9"
          style={{ backgroundColor: colors.bg, maxHeight: "85%" }}
        >
          <View className="self-center w-[42px] h-[5px] rounded-full mb-5" style={{ backgroundColor: colors.line2 }} />

          <View className="flex-row items-center gap-3 mb-5">
            <View className="w-[46px] h-[46px] rounded-[12px] items-center justify-center" style={{ backgroundColor: "rgba(216,180,90,0.13)", borderWidth: 1, borderColor: "rgba(216,180,90,0.3)" }}>
              <Text className="font-serif text-[16px] text-goldbright">{job?.initials ?? "•"}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-serifsemi text-[18px] text-ink" numberOfLines={1}>{job?.role ?? ""}</Text>
              <Text className="text-dim text-[13px] mt-[2px]" numberOfLines={1}>{job?.name ?? ""}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} className="w-[34px] h-[34px] rounded-[10px] items-center justify-center bg-surface2 border border-line">
              <Feather name="x" size={18} color={colors.mut} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row items-center gap-[6px] mb-5">
              <Feather name="clock" size={12} color={colors.mut} />
              <Text className="text-mut text-[12.5px]">Applied {job?.date}</Text>
            </View>

            <Text className="font-mono text-[10px] tracking-[1.5px] text-mut uppercase mb-3">Submitted Details</Text>
            <View className="flex-row gap-3 mb-6">
              <View className="flex-1 bg-surface border border-line rounded-xl p-4">
                <Text className="text-mut text-[11px]">Expected Salary</Text>
                <Text className="text-ink text-[16px] font-semibold mt-1">{fmtSalary(job?.expectedSalary)}</Text>
              </View>
              <View className="flex-1 bg-surface border border-line rounded-xl p-4">
                <Text className="text-mut text-[11px]">Last Drawn Salary</Text>
                <Text className="text-ink text-[16px] font-semibold mt-1">{fmtSalary(job?.lastDrawnSalary)}</Text>
              </View>
            </View>

            <Text className="font-mono text-[10px] tracking-[1.5px] text-mut uppercase mb-3">Resume</Text>
            {loading ? (
              <View className="items-center py-8">
                <ActivityIndicator color={colors.gold} />
              </View>
            ) : resumes.length === 0 ? (
              <Text className="text-mut text-[12.5px]">No resume on file.</Text>
            ) : (
              resumes.map((r) => (
                <View key={r.id} className="flex-row items-center gap-3 bg-surface border border-line rounded-xl p-3 mb-2">
                  <Feather name="file-text" size={18} color={colors.gold} />
                  <View className="flex-1">
                    <Text className="text-ink text-[13.5px] font-semibold" numberOfLines={1}>{r.title}</Text>
                    <Text className="text-mut text-[11.5px] mt-[2px]">
                      {r.kind === "ai" ? "AI-tailored" : "Uploaded"}
                      {r.atsScore > 0 ? ` · ${r.atsScore}% ATS` : ""}
                      {r.date ? ` · ${r.date}` : ""}
                    </Text>
                  </View>
                  {r.storagePath ? (
                    <Pressable
                      onPress={() => openFile(r.storagePath!)}
                      disabled={opening === r.storagePath}
                      className="flex-row items-center gap-1.5 rounded-lg px-3 py-[7px]"
                      style={{ backgroundColor: "rgba(216,180,90,0.12)", borderWidth: 1, borderColor: "rgba(216,180,90,0.3)", opacity: opening === r.storagePath ? 0.5 : 1 }}
                    >
                      {opening === r.storagePath ? (
                        <ActivityIndicator size="small" color={colors.goldbright} />
                      ) : (
                        <Feather name="download" size={13} color={colors.goldbright} />
                      )}
                      <Text className="text-goldbright text-[12px] font-semibold">View</Text>
                    </Pressable>
                  ) : (
                    <Text className="text-mut text-[11px]">No file</Text>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
