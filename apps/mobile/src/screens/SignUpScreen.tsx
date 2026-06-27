import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Field, GoldButton, ScreenBg } from "@/components/ui";
import { signUpWithEmail } from "@/data/repo";

export default function SignUpScreen({ onSwitch }: { onSwitch: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canSubmit = name.trim().length >= 2 && email.includes("@") && password.length >= 6;

  async function submit() {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await signUpWithEmail(email, password, name);
      // If email confirmation is on, there's no session yet — guide the user.
      if (res.needsConfirmation) {
        setNotice("Account created. Check your email to confirm, then sign in.");
      }
      // Otherwise the auth listener swaps to the app automatically.
    } catch (e: any) {
      setError(e?.message ?? "Unable to create your account. Please try again.");
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
          <Text className="font-mono text-[10.5px] tracking-[2.5px] text-gold uppercase">Get started</Text>
          <Text className="font-serif text-[34px] text-ink mt-2 leading-[40px]">Create your{"\n"}account</Text>
          <Text className="text-dim text-[14px] mt-3 leading-[22px]">
            Build your profile and start matching with companies that fit you.
          </Text>

          <View className="gap-3 mt-9">
            <Field
              icon="user"
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              autoCapitalize="words"
              autoComplete="name"
            />
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
              placeholder="Password (min. 6 characters)"
              secureToggle
              autoCapitalize="none"
              autoComplete="password-new"
            />
          </View>

          {error && <Text className="text-danger text-[13px] mt-4">{error}</Text>}
          {notice && <Text className="text-ok text-[13px] mt-4">{notice}</Text>}

          <View className="mt-7">
            <GoldButton label="Create Account" icon="arrow-right" pill compact block={false} onPress={submit} loading={busy} disabled={!canSubmit} />
          </View>

          <View className="flex-row justify-center items-center gap-1 mt-8">
            <Text className="text-mut text-[13.5px]">Already have an account?</Text>
            <Pressable onPress={onSwitch} hitSlop={8}>
              <Text className="text-gold text-[13.5px] font-semibold">Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBg>
  );
}
