import { User } from "lucide-react";

/**
 * Default candidate profile avatar — mirrors the mobile app's `Avatar` icon
 * variant (apps/mobile/src/components/ui.tsx): a gold person glyph on a subtly
 * gold-tinted, gold-ringed circle, with an optional online status dot.
 */
export default function Avatar({
  size,
  online = false,
  className = "",
}: {
  size: number;
  online?: boolean;
  className?: string;
}) {
  const iconSize = Math.round(size * 0.52);
  const dot = Math.max(10, Math.round(size * 0.2));
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-full flex items-center justify-center border"
        style={{ backgroundColor: "rgba(216,180,90,0.12)", borderColor: "rgba(216,180,90,0.45)" }}
      >
        <User size={iconSize} className="text-gold" />
      </div>
      {online && (
        <span
          className="absolute rounded-full bg-ok"
          style={{ width: dot, height: dot, right: 0, bottom: 0, border: "2px solid var(--color-bg)" }}
        />
      )}
    </div>
  );
}
