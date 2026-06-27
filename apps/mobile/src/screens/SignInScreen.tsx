import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Field, GoldButton, ScreenBg } from "@/components/ui";
import { signInWithEmail } from "@/data/repo";
import { colors } from "@/theme/colors";

export default function SignInScreen({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.includes("@") && password.length >= 6;

  async function submit() {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      // On success the auth listener swaps to the app automatically.
    } catch (e: any) {
      setError(e?.message ?? "Unable to sign in. Check your details and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScreenBg>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 26, paddingVertical: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="font-mono text-[10.5px] tracking-[2.5px] text-gold uppercase">Welcome back</Text>
          <Text className="font-serif text-[34px] text-ink mt-2 leading-[40px]">Sign in to{"\n"}your account</Text>
          <Text className="text-dim text-[14px] mt-3 leading-[22px]">
            Pick up where you left off — your matches and connections are waiting.
          </Text>

          <View className="gap-3 mt-9">
            <Field
              icon="mail"
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Field
              icon="lock"
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureToggle
              autoCapitalize="none"
              autoComplete="password"
            />
          </View>

          {error && <Text className="text-danger text-[13px] mt-4">{error}</Text>}

          <View className="mt-7">
            <GoldButton label="Sign In" icon="arrow-right" pill compact block={false} onPress={submit} loading={busy} disabled={!canSubmit} />
          </View>

          <View className="flex-row justify-center items-center gap-1 mt-8">
            <Text className="text-mut text-[13.5px]">New here?</Text>
            <Pressable onPress={onSwitch} hitSlop={8}>
              <Text className="text-gold text-[13.5px] font-semibold">Create an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBg>
  );
}
