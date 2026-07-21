import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "@/theme/colors";

function bandColor(score: number) {
  if (score >= 90) return colors.ok;
  if (score >= 75) return colors.gold;
  return colors.mut;
}

/** Circular progress ring showing an ATS score (0–100). */
export default function AtsRing({ score, size = 46 }: { score: number; size?: number }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * circumference;
  const color = bandColor(score);

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surface3} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={{ color }} className="font-mono text-[12px] font-bold">{score}</Text>
    </View>
  );
}
