import { Feather, Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, ScrollView, Text, View } from "react-native";
import AtsRing from "@/components/AtsRing";
import CreateResumeModal from "@/components/CreateResumeModal";
import { Eyebrow, ScreenBg } from "@/components/ui";
import { createResume, getResumes, uploadResume } from "@/data/repo";
import { Resume } from "@/data/types";
import { colors } from "@/theme/colors";

export default function ResumeScreen() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastY = useRef(new Animated.Value(20)).current;
  const toastO = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getResumes().then(setResumes);
  }, []);

  const avgAts = useMemo(
    () => (resumes.length ? Math.round(resumes.reduce((s, r) => s + r.atsScore, 0) / resumes.length) : 0),
    [resumes],
  );

  const aiResumes = resumes.filter((r) => r.kind === "ai");
  const uploaded = resumes.filter((r) => r.kind === "uploaded");

  function showToast(msg: string) {
    setToast(msg);
    Animated.parallel([
      Animated.timing(toastO, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(toastY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastO, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(toastY, { toValue: 20, duration: 220, useNativeDriver: true }),
      ]).start();
    }, 1900);
  }

  async function handleGenerate(input: { targetRole: string; targetCompany: string }) {
    setGenerating(true);
    const resume = await createResume(input);
    setResumes((prev) => [resume, ...prev]);
    setGenerating(false);
    setModalOpen(false);
    showToast(`Generated "${resume.title}" · ATS ${resume.atsScore}`);
  }

  async function handleUpload() {
    if (uploading) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      copyToCacheDirectory: true, // so the file bytes are readable for upload
    });
    if (result.canceled) return;
    const file = result.assets[0];
    if (!file) return;

    setUploading(true);
    try {
      const resume = await uploadResume({
        name: file.name,
        uri: file.uri,
        sizeBytes: file.size,
        mimeType: file.mimeType,
      });
      setResumes((prev) => [resume, ...prev]);
      showToast(`Uploaded "${resume.title}"`);
    } catch (e) {
      showToast(e instanceof Error ? `Upload failed: ${e.message}` : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* header */}
        <View className="flex-row items-start justify-between pt-2">
          <View>
            <Text className="font-serif text-[27px] text-ink">My Resumes</Text>
            <Eyebrow className="mt-2">{resumes.length} Documents Saved</Eyebrow>
          </View>
          <View className="items-end">
            <Eyebrow>Avg. ATS Score</Eyebrow>
            <Text className="font-serif text-[26px] text-gold mt-1">{avgAts}%</Text>
          </View>
        </View>

        {/* actions */}
        <View className="flex-row gap-3 mt-5">
          <Pressable onPress={() => setModalOpen(true)} className="flex-1 flex-row items-center justify-center gap-2 bg-gold rounded-[14px] py-[15px]">
            <Ionicons name="sparkles" size={17} color="#3a2d08" />
            <Text className="font-medium text-[14px]" style={{ color: "#3a2d08" }}>Create with AI</Text>
          </Pressable>
          <Pressable onPress={handleUpload} disabled={uploading} className="flex-1 flex-row items-center justify-center gap-2 bg-surface2 border border-line rounded-[14px] py-[15px]" style={{ opacity: uploading ? 0.6 : 1 }}>
            {uploading ? (
              <ActivityIndicator size="small" color={colors.dim} />
            ) : (
              <Feather name="upload" size={16} color={colors.dim} />
            )}
            <Text className="font-medium text-[14px] text-dim">{uploading ? "Uploading…" : "Upload Resume"}</Text>
          </Pressable>
        </View>

        {/* AI-generated */}
        {aiResumes.length > 0 && (
          <>
            <Eyebrow className="mt-7 mb-3">AI-Generated</Eyebrow>
            {aiResumes.map((r) => (
              <ResumeCard key={r.id} resume={r} onAction={showToast} />
            ))}
          </>
        )}

        {/* uploaded */}
        {uploaded.length > 0 && (
          <>
            <Eyebrow className="mt-6 mb-3">Uploaded</Eyebrow>
            {uploaded.map((r) => (
              <ResumeCard key={r.id} resume={r} onAction={showToast} />
            ))}
          </>
        )}
      </ScrollView>

      <CreateResumeModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onGenerate={handleGenerate}
        generating={generating}
      />

      {toast && (
        <Animated.View
          pointerEvents="none"
          style={{ opacity: toastO, transform: [{ translateY: toastY }], position: "absolute", left: 22, right: 22, bottom: 100 }}
        >
          <View className="self-center bg-surface3 border border-line2 rounded-[12px] px-[18px] py-3">
            <Text className="text-ink text-[13px]">{toast}</Text>
          </View>
        </Animated.View>
      )}
    </ScreenBg>
  );
}

function ResumeCard({ resume, onAction }: { resume: Resume; onAction: (msg: string) => void }) {
  const isAi = resume.kind === "ai";
  return (
    <View className="bg-surface border border-line rounded-2xl p-[18px] mb-3">
      <View className="flex-row items-start">
        {/* icon */}
        <View
          className="w-[44px] h-[44px] rounded-[13px] items-center justify-center mr-[14px]"
          style={{ backgroundColor: colors.surface2, borderWidth: 1, borderColor: isAi ? "rgba(216,180,90,0.3)" : colors.line }}
        >
          {isAi ? <Ionicons name="sparkles" size={20} color={colors.gold} /> : <Feather name="file-text" size={20} color={colors.dim} />}
        </View>

        {/* text */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-semibold text-[16px] text-ink">{resume.title}</Text>
            {isAi && (
              <View className="rounded-[6px] px-[6px] py-[2px]" style={{ backgroundColor: "rgba(216,180,90,0.12)", borderWidth: 1, borderColor: "rgba(216,180,90,0.3)" }}>
                <Text className="font-mono text-[8.5px] tracking-[1px] text-goldbright">AI</Text>
              </View>
            )}
          </View>
          {resume.forCompany && <Text className="text-dim text-[13px] mt-[3px]">For {resume.forCompany}</Text>}
          <View className="flex-row items-center gap-[6px] mt-[7px]">
            <Feather name="clock" size={12} color={colors.mut} />
            <Text className="text-mut text-[12px]">{resume.date}</Text>
            <Text className="text-mut text-[12px]">· {resume.sizeKb} KB</Text>
          </View>
        </View>

        {/* ats ring + menu */}
        <View className="items-end gap-2">
          <AtsRing score={resume.atsScore} />
          <Pressable onPress={() => onAction(`${resume.title} · options`)} hitSlop={8}>
            <Feather name="more-horizontal" size={18} color={colors.mut} />
          </Pressable>
        </View>
      </View>

      {/* actions */}
      <View className="flex-row gap-3 mt-4">
        <Pressable onPress={() => onAction(`Preview "${resume.title}"`)} className="flex-1 flex-row items-center justify-center gap-2 bg-surface2 border border-line rounded-[12px] py-[11px]">
          <Feather name="eye" size={15} color={colors.dim} />
          <Text className="text-dim text-[13.5px] font-medium">Preview</Text>
        </Pressable>
        <Pressable onPress={() => onAction(`Edit "${resume.title}"`)} className="flex-1 flex-row items-center justify-center gap-2 bg-surface2 border border-line rounded-[12px] py-[11px]">
          <Feather name="edit-2" size={15} color={colors.gold} />
          <Text className="text-gold text-[13.5px] font-medium">Edit</Text>
        </Pressable>
      </View>
    </View>
  );
}
