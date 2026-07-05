import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, TextInputProps, View, ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, gradients } from "@/theme/colors";

export function ScreenBg({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-1 bg-bg">
      <LinearGradient colors={gradients.screen} className="absolute inset-0" />
      <SafeAreaView edges={["top"]} className="flex-1">
        {children}
      </SafeAreaView>
    </View>
  );
}

export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Text className={`font-mono text-[10.5px] tracking-[2.5px] text-mut uppercase ${className}`}>
      {children}
    </Text>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between mt-6 mb-3">
      <Text className="font-serifsemi text-[21px] text-ink">{children}</Text>
      {action}
    </View>
  );
}

export function GoldButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  icon,
  block = true,
  className = "",
}: {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Feather>["name"];
  /** Stretch to fill the parent width (default). Set false to size to content. */
  block?: boolean;
  className?: string;
}) {
  const off = disabled || loading;
  // Dark ink so the label/icon stay legible on the gold fill.
  const ink = "#3a2d08";
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      disabled={off}
      style={{ alignSelf: block ? "stretch" : "center", opacity: off ? 0.5 : 1 }}
      className={`flex-row items-center justify-center gap-2 bg-gold border border-gold rounded-[14px] px-5 py-[15px] ${className}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={ink} />
      ) : (
        <>
          {icon && <Feather name={icon} size={16} color={ink} />}
          <Text className="text-[14px] font-medium" style={{ color: ink }}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Field({
  icon,
  value,
  onChangeText,
  placeholder,
  secureToggle = false,
  ...props
}: {
  icon?: React.ComponentProps<typeof Feather>["name"];
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureToggle?: boolean;
} & Omit<TextInputProps, "value" | "onChangeText" | "placeholder">) {
  const [hidden, setHidden] = useState(secureToggle);
  return (
    <View className="flex-row items-center bg-surface2 border border-line rounded-[13px] px-[14px]">
      {icon && <Feather name={icon} size={17} color={colors.mut} />}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mut}
        secureTextEntry={hidden}
        className="flex-1 text-ink text-[15px] py-[14px] px-[11px]"
        style={{ fontFamily: "Inter_400Regular" }}
        {...props}
      />
      {secureToggle && (
        <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
          <Feather name={hidden ? "eye" : "eye-off"} size={17} color={colors.mut} />
        </Pressable>
      )}
    </View>
  );
}

export function Pill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "gold" | "ok" }) {
  const styles = {
    neutral: "bg-white/5 border-white/10",
    gold: "border-gold/35",
    ok: "border-ok/35",
  }[tone];
  const text = { neutral: "text-[#cfe6d2]", gold: "text-goldbright", ok: "text-ok" }[tone];
  return (
    <View
      className={`rounded-[18px] border px-3 py-[7px] ${styles}`}
      style={tone === "gold" ? { backgroundColor: "rgba(216,180,90,0.14)" } : tone === "ok" ? { backgroundColor: "rgba(63,191,106,0.14)" } : undefined}
    >
      <Text className={`text-[12px] ${text}`}>{label}</Text>
    </View>
  );
}

export function Avatar({
  initials,
  size = 50,
  gradient = false,
  color = colors.surface2,
  online = false,
  textClass = "",
  icon = false,
}: {
  initials: string;
  size?: number;
  gradient?: boolean;
  color?: string;
  online?: boolean;
  textClass?: string;
  /** Show the default person icon instead of the initials. */
  icon?: boolean;
}) {
  const dot = (
    <View
      style={{
        position: "absolute",
        bottom: size * 0.045,
        right: size * 0.045,
        width: size * 0.24,
        height: size * 0.24,
        borderRadius: 999,
        backgroundColor: colors.ok,
        borderWidth: 2.5,
        borderColor: colors.surface,
      }}
    />
  );
  const iconStyle = { includeFontPadding: false, textAlign: "center" as const, textAlignVertical: "center" as const, lineHeight: size * 0.5, height: size * 0.5 };
  const content = icon ? (
    <Feather name="user" size={size * 0.5} color={colors.mut} style={iconStyle} />
  ) : (
    <Text style={{ fontSize: size * 0.32, textAlign: "center", includeFontPadding: false }} className={`font-bold ${textClass}`}>{initials}</Text>
  );
  if (gradient) {
    return (
      <View style={{ width: size, height: size }} className="items-center justify-center">
        <LinearGradient colors={gradients.gold} style={{ width: size, height: size, borderRadius: 999 }} className="items-center justify-center">
          {icon ? (
            <Feather name="user" size={size * 0.5} color="#3a2d08" style={iconStyle} />
          ) : (
            <Text style={{ fontSize: size * 0.32, color: "#3a2d08", textAlign: "center", includeFontPadding: false }} className="font-bold">{initials}</Text>
          )}
        </LinearGradient>
        {online && dot}
      </View>
    );
  }
  return (
    <View style={{ width: size, height: size, backgroundColor: color, borderRadius: 999 }} className="items-center justify-center">
      {content}
      {online && dot}
    </View>
  );
}

export function Card({ children, className = "", ...rest }: ViewProps & { className?: string }) {
  return (
    <View className={`bg-surface border border-line rounded-2xl ${className}`} {...rest}>
      {children}
    </View>
  );
}
