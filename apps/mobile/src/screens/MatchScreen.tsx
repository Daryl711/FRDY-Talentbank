import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Eyebrow, ScreenBg } from "@/components/ui";
import { SwipeDeck, SwipeDeckHandle } from "@/components/SwipeDeck";
import SubmittedJobsModal from "@/components/SubmittedJobsModal";
import * as DocumentPicker from "expo-document-picker";
import { getResumes, getSubmittedJobs, getSwipeDeck, recordSwipe, uploadResume } from "@/data/repo";
import { SubmittedJob, SwipeCompany, SwipeDirection } from "@/data/types";
import { colors, gradients } from "@/theme/colors";

function CompanyCard({
  c,
  hasResume,
  uploading,
  onUpload,
  onCreateNew,
  onCreateResume,
}: {
  c: SwipeCompany;
  hasResume: boolean;
  uploading: boolean;
  onUpload: () => void;
  onCreateNew: () => void;
  onCreateResume?: (c: SwipeCompany) => void;
}) {
  return (
    <LinearGradient
      colors={gradients.matchCard}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{
        flex: 1,
        borderRadius: 24,
        padding: 22,
        borderWidth: 1,
        borderColor: "#3d6b3f",
        shadowColor: "#000",
        shadowOpacity: 0.45,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 12 },
        elevation: 10,
      }}
    >
      <View className="flex-row justify-between items-start">
        <View className="w-[74px] h-[74px] rounded-[18px] items-center justify-center" style={{ backgroundColor: "rgba(216,180,90,0.13)", borderWidth: 1, borderColor: "rgba(216,180,90,0.3)" }}>
          <Text className="font-serif text-[24px] text-goldbright">{c.initials}</Text>
        </View>
        <View className="flex-row items-center gap-[5px] rounded-[20px] px-3 py-[7px]" style={{ backgroundColor: "rgba(216,180,90,0.18)", borderWidth: 1, borderColor: "rgba(216,180,90,0.4)" }}>
          <Ionicons name="flash" size={12} color={colors.goldbright} />
          <Text className="font-mono text-[11px] font-bold text-goldbright">{c.match}% MATCH</Text>
        </View>
      </View>

      <Text className="font-serif text-[28px] text-ink mt-4">{c.name}</Text>
      <Text className="text-[#bfe3c4] text-[15px] mt-1">{c.role}</Text>

      <View className="flex-row gap-[18px] mt-[14px]">
        <View className="flex-row items-center gap-[5px]">
          <Feather name="map-pin" size={13} color="#9dc4a4" />
          <Text className="text-[#9dc4a4] text-[12.5px]">{c.location}</Text>
        </View>
        <View className="flex-row items-center gap-[5px]">
          <Feather name="users" size={13} color="#9dc4a4" />
          <Text className="text-[#9dc4a4] text-[12.5px]">{c.employees}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2 mt-4">
        {c.tags.map((t) => (
          <View key={t} className="rounded-[18px] px-3 py-[7px]" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}>
            <Text className="text-[#cfe6d2] text-[12px]">{t}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row justify-between items-end mt-auto rounded-[14px] px-4 py-[14px]" style={{ backgroundColor: "rgba(0,0,0,0.22)", borderWidth: 1, borderColor: "rgba(216,180,90,0.18)" }}>
        <View>
          <Text className="font-mono text-[9px] tracking-[1.5px] text-[#9dc4a4] uppercase">Package</Text>
          <Text className="font-serif text-[24px] text-goldbright mt-[5px]">{c.package}</Text>
        </View>
        <View className="items-end gap-[6px]">
          {c.perks.map((p) => (
            <View key={p} className="rounded-[12px] px-[10px] py-1" style={{ backgroundColor: "rgba(216,180,90,0.12)" }}>
              <Text className="text-goldbright text-[10.5px]">{p}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Resume actions — upload is required before matching unlocks. */}
      {hasResume ? (
        <View className="mt-[14px] mb-[6px]">
          <View className="flex-row items-center gap-[6px] mb-[10px]">
            <Feather name="check" size={13} color="#8fd6a0" />
            <Text className="text-[#8fd6a0] text-[12px]">Resume attached — swipe right to match</Text>
          </View>
          <Pressable
            onPress={() => onCreateResume?.(c)}
            className="w-full flex-row items-center justify-center gap-[7px] rounded-[14px] py-[13px]"
            style={{ backgroundColor: "rgba(216,180,90,0.16)", borderWidth: 1, borderColor: "rgba(216,180,90,0.45)" }}
          >
            <Ionicons name="sparkles" size={14} color={colors.goldbright} />
            <Text numberOfLines={1} className="font-mono text-[10.5px] tracking-[1px] text-goldbright uppercase">Create Specific Resume</Text>
          </Pressable>
        </View>
      ) : (
        <View className="mt-[14px] mb-[6px]">
          <View className="flex-row items-center gap-[6px] mb-[10px]">
            <Feather name="lock" size={12} color="#e0c072" />
            <Text className="text-[#e0c072] text-[12px]">Upload your resume to unlock matching</Text>
          </View>
          <View className="flex-row gap-[10px]">
            <Pressable
              onPress={onUpload}
              disabled={uploading}
              className="flex-1 flex-row items-center justify-center gap-[7px] rounded-[14px] py-[13px]"
              style={{ backgroundColor: uploading ? "rgba(216,180,90,0.5)" : colors.gold }}
            >
              <Feather name="upload" size={15} color="#2b2106" />
              <Text numberOfLines={1} className="font-mono text-[11px] tracking-[1px] uppercase" style={{ color: "#2b2106" }}>
                {uploading ? "Uploading…" : "Upload Resume"}
              </Text>
            </Pressable>
            <Pressable
              onPress={onCreateNew}
              className="flex-1 flex-row items-center justify-center gap-[7px] rounded-[14px] py-[13px]"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(216,180,90,0.45)" }}
            >
              <Feather name="file-plus" size={15} color={colors.goldbright} />
              <Text numberOfLines={1} className="font-mono text-[11px] tracking-[1px] uppercase text-goldbright">Create Resume</Text>
            </Pressable>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

/** Build a card from a Home "focus" payload for a company not already in the deck. */
function synthCompany(f: FocusJob): SwipeCompany {
  return {
    id: f.id ?? f.name,
    initials: f.initials ?? f.name.slice(0, 2).toUpperCase(),
    name: f.name,
    role: f.role ?? "",
    location: f.location ?? "",
    employees: f.employees ?? "",
    match: f.match ?? 0,
    tags: f.tags ?? [],
    package: f.package ?? "",
    perks: f.perks ?? [],
  };
}

/** Partial company payload passed from the Home screen when a role is tapped. */
type FocusJob = Partial<SwipeCompany> & { name: string };

export default function MatchScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const [deck, setDeck] = useState<SwipeCompany[]>([]);
  const [matched, setMatched] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [done, setDone] = useState(false);
  const [submitted, setSubmitted] = useState<SubmittedJob[]>([]);
  const [submittedOpen, setSubmittedOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  // null = still checking. Candidates must upload a resume before matching.
  const [hasResume, setHasResume] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState(false);
  const swiperRef = useRef<SwipeDeckHandle>(null);

  useEffect(() => {
    getSwipeDeck().then((d) => {
      setDeck(d);
      setRemaining(d.length);
    });
    getSubmittedJobs().then(setSubmitted);
    getResumes().then((rs) => setHasResume(rs.some((r) => r.kind === "uploaded")));
  }, []);

  // Refetch the applications list whenever the sheet is opened so it reflects
  // swipes made this session.
  function openSubmitted() {
    getSubmittedJobs().then(setSubmitted);
    setSubmittedOpen(true);
  }

  // Browse-all-jobs: pick a job to bring it to the front of the deck. Reordering
  // the deck resets the swiper to show the selected job as the top card.
  function selectJob(id: string) {
    setDeck((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx < 0) return prev;
      const ordered = [prev[idx], ...prev.slice(0, idx), ...prev.slice(idx + 1)];
      setRemaining(ordered.length);
      return ordered;
    });
    setDone(false);
    setBrowseOpen(false);
  }

  // When arriving from a Home role tap, bring that company to the top of the
  // deck (or add it if it isn't there) so its resume actions are front and
  // centre. Changing the deck array also resets the swiper to the top card.
  const focus = route.params?.focus as FocusJob | undefined;
  useEffect(() => {
    if (!focus || deck.length === 0) return;
    setDeck((prev) => {
      // Match the specific job by title first (the deck is role-based), then by
      // company name, else synthesize a card for it.
      const wantRole = (focus.role ?? "").toLowerCase();
      const idx = prev.findIndex(
        (c) => (wantRole && c.role.toLowerCase() === wantRole) || c.name.toLowerCase() === focus.name.toLowerCase(),
      );
      const ordered =
        idx >= 0
          ? [prev[idx], ...prev.slice(0, idx), ...prev.slice(idx + 1)]
          : [synthCompany(focus), ...prev];
      setRemaining(ordered.length);
      return ordered;
    });
    setDone(false);
    // Clear the param so tapping the same role again re-triggers the focus.
    nav.setParams({ focus: undefined });
  }, [focus, deck.length, nav]);

  function onSwiped(index: number, dir: SwipeDirection) {
    const card = deck[index];
    if (card) recordSwipe(card.id, dir);
    if (dir === "right") setMatched((m) => m + 1);
    setRemaining((r) => Math.max(0, r - 1));
  }

  function onCreateResume(c: SwipeCompany) {
    Alert.alert("Create Specific Resume", `Tailor a new resume for ${c.role} at ${c.name}.`);
  }

  // Upload a resume straight from the job card. On success, matching unlocks.
  async function handleUpload() {
    if (uploading) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const file = result.assets[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadResume({ name: file.name, uri: file.uri, sizeBytes: file.size, mimeType: file.mimeType });
      setHasResume(true);
      Alert.alert("Resume uploaded", "You can now swipe right to match.");
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setUploading(false);
    }
  }

  // Matching (right-swipe) is locked until a resume is uploaded.
  const canMatch = hasResume === true;

  function attemptMatch() {
    if (canMatch) swiperRef.current?.swipeRight();
    else Alert.alert("Upload your resume", "Upload a resume on the card to unlock matching.");
  }

  return (
    <ScreenBg>
      <View className="flex-1 px-[22px] pb-[110px]">
        <View className="pt-[10px] flex-row items-start justify-between">
          <View>
            <Text className="font-serif text-[26px] text-ink">Job Match</Text>
            <Eyebrow className="mt-2">
              {remaining} {remaining === 1 ? "job" : "jobs"} waiting · {matched} matched
            </Eyebrow>
          </View>
          <View className="flex-row items-center gap-[10px]">
            <Pressable
              onPress={() => setBrowseOpen(true)}
              hitSlop={8}
              className="w-[42px] h-[42px] rounded-full bg-surface2 border border-line items-center justify-center"
            >
              <Feather name="list" size={18} color={colors.dim} />
            </Pressable>
            <Pressable
              onPress={openSubmitted}
              hitSlop={8}
              className="w-[42px] h-[42px] rounded-full bg-surface2 border border-line items-center justify-center"
            >
              <Ionicons name="paper-plane-outline" size={18} color={colors.dim} />
              {submitted.length > 0 && (
                <View className="absolute -top-[3px] -right-[3px] min-w-[17px] h-[17px] px-[4px] rounded-full bg-gold items-center justify-center">
                  <Text className="font-mono text-[9px] font-bold" style={{ color: "#3a2d08" }}>{submitted.length}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <View style={{ flex: 1, marginTop: 18, maxHeight: 480 }}>
          {!done && deck.length > 0 ? (
            <SwipeDeck
              ref={swiperRef}
              data={deck}
              keyExtractor={(c) => c.id}
              renderCard={(c) => (
                <CompanyCard
                  c={c}
                  hasResume={canMatch}
                  uploading={uploading}
                  onUpload={handleUpload}
                  onCreateNew={() => nav.navigate("Resume")}
                  onCreateResume={onCreateResume}
                />
              )}
              onSwiped={(i, dir) => onSwiped(i, dir)}
              onSwipedAll={() => setDone(true)}
              rightLocked={!canMatch}
              onRightLocked={() => Alert.alert("Upload your resume", "Upload a resume on the card to unlock matching.")}
              labels={{
                left: { text: "PASS", color: "#e25555" },
                right: { text: canMatch ? "MATCH" : "LOCKED", color: canMatch ? "#3fbf6a" : "#8a8f9c" },
              }}
            />
          ) : (
            <View className="flex-1 items-center justify-center gap-[10px]">
              <Ionicons name="heart" size={40} color={colors.gold} />
              <Text className="font-serif text-[22px] text-ink">You're all caught up</Text>
              <Text className="text-dim text-[13px]">{matched} {matched === 1 ? "match" : "matches"} made today</Text>
            </View>
          )}
        </View>

        {/* actions */}
        <View className="flex-row items-end mt-7">
          {/* Pass */}
          <View className="flex-1 items-center gap-[10px]">
            <Pressable onPress={() => swiperRef.current?.swipeLeft()} className="w-16 h-16 rounded-full items-center justify-center bg-surface2" style={{ borderWidth: 1, borderColor: "rgba(226,85,85,0.45)" }}>
              <Feather name="x" size={26} color={colors.danger} />
            </Pressable>
            <View className="flex-row items-center gap-[5px]">
              <Feather name="arrow-left" size={12} color={colors.danger} />
              <Text className="font-mono text-[10px] tracking-[1.5px] text-dim uppercase">Pass</Text>
            </View>
          </View>

          {/* Swipe or tap hint */}
          <View className="flex-1 items-center gap-[10px]">
            <View className="w-11 h-11 rounded-full items-center justify-center bg-white/5" style={{ borderWidth: 1, borderColor: colors.line }}>
              <Ionicons name="swap-horizontal" size={20} color={colors.dim} />
            </View>
            <Text className="font-mono text-[10px] tracking-[1.5px] text-mut uppercase">Swipe or tap</Text>
          </View>

          {/* Match */}
          <View className="flex-1 items-center gap-[10px]">
            <Pressable
              onPress={attemptMatch}
              className="w-16 h-16 rounded-full items-center justify-center bg-surface2"
              style={{ borderWidth: 1, borderColor: canMatch ? "rgba(63,191,106,0.45)" : colors.line }}
            >
              <Feather name={canMatch ? "check" : "lock"} size={canMatch ? 26 : 22} color={canMatch ? colors.ok : colors.mut} />
            </Pressable>
            <View className="flex-row items-center gap-[5px]">
              <Text className="font-mono text-[10px] tracking-[1.5px] text-dim uppercase">{canMatch ? "Match" : "Locked"}</Text>
              <Feather name="arrow-right" size={12} color={canMatch ? colors.ok : colors.mut} />
            </View>
          </View>
        </View>
      </View>

      <SubmittedJobsModal visible={submittedOpen} jobs={submitted} onClose={() => setSubmittedOpen(false)} />

      {/* Browse all jobs — select one to bring it to the front of the deck. */}
      <Modal visible={browseOpen} transparent animationType="slide" onRequestClose={() => setBrowseOpen(false)}>
        <Pressable onPress={() => setBrowseOpen(false)} className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <Pressable onPress={() => {}} className="bg-bgtop border-t border-line rounded-t-[24px] px-[22px] pt-5 pb-10" style={{ maxHeight: "78%" }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="font-serif text-[20px] text-ink">All Jobs</Text>
              <Pressable onPress={() => setBrowseOpen(false)} hitSlop={8}>
                <Feather name="x" size={20} color={colors.dim} />
              </Pressable>
            </View>
            {deck.length === 0 ? (
              <Text className="text-dim text-[13px] text-center py-8">No jobs left to review.</Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="gap-[10px]">
                  {deck.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => selectJob(c.id)}
                      className="flex-row items-center gap-[12px] rounded-[14px] p-3 bg-surface2 border border-line"
                    >
                      <View className="w-11 h-11 rounded-[12px] items-center justify-center" style={{ backgroundColor: "rgba(216,180,90,0.13)", borderWidth: 1, borderColor: "rgba(216,180,90,0.3)" }}>
                        <Text className="font-serif text-[14px] text-goldbright">{c.initials}</Text>
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text numberOfLines={1} className="text-ink text-[14px] font-semibold">{c.role || "Open Role"}</Text>
                        <Text numberOfLines={1} className="text-dim text-[12.5px]">{c.name}{c.location ? ` · ${c.location}` : ""}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-gold text-[12.5px] font-semibold">{c.package || "—"}</Text>
                        <Text className="text-mut text-[11.5px]">{c.match}% match</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenBg>
  );
}
