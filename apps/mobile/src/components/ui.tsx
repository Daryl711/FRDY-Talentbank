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
  size,
  color,
  gradient = false,
  online = false,
  icon = false,
  textClass = "text-ink",
}: {
  initials: string;
  size: number;
  /** Solid background color (used when not a gradient avatar). */
  color?: string;
  /** Gold gradient fill (initials shown in dark ink for contrast). */
  gradient?: boolean;
  /** Show the online status dot at the bottom-right. */
  online?: boolean;
  /** Render the default gold avatar glyph instead of initials. */
  icon?: boolean;
  /** className for the initials text (ignored for the icon/gradient variants). */
  textClass?: string;
}) {
  const dotSize = Math.max(10, Math.round(size * 0.2));
  const iconSize = Math.round(size * 0.52);
  const fontSize = Math.round(size * 0.36);

  // Default-avatar variant: a gold person glyph on a subtly gold-tinted,
  // gold-ringed circle — matches the app's gold accent system.
  const inner = icon ? (
    <Feather name="user" size={iconSize} color={colors.gold} />
  ) : (
    <Text
      className={gradient ? "font-bold" : `font-semibold ${textClass}`}
      style={{ fontSize, ...(gradient ? { color: "#3a2d08" } : null) }}
    >
      {initials}
    </Text>
  );

  return (
    <View style={{ width: size, height: size }}>
      {icon ? (
        <View
          className="flex-1 items-center justify-center rounded-full border"
          style={{ backgroundColor: "rgba(216,180,90,0.12)", borderColor: "rgba(216,180,90,0.45)" }}
        >
          {inner}
        </View>
      ) : gradient ? (
        <LinearGradient
          colors={gradients.gold}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, borderRadius: size / 2, alignItems: "center", justifyContent: "center" }}
        >
          {inner}
        </LinearGradient>
      ) : (
        <View
          className="flex-1 items-center justify-center rounded-full"
          style={{ backgroundColor: color ?? colors.surface2 }}
        >
          {inner}
        </View>
      )}

      {online && (
        <View
          className="absolute rounded-full"
          style={{
            width: dotSize,
            height: dotSize,
            backgroundColor: colors.ok,
            borderWidth: 2,
            borderColor: colors.bg,
            right: 0,
            bottom: 0,
          }}
        />
      )}
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
