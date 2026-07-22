import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_W } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_W * 0.28;
const VELOCITY_THRESHOLD = 800;
const OUT_DISTANCE = SCREEN_W * 1.5;

export type SwipeDir = "left" | "right" | "save";

export interface SwipeDeckHandle {
  swipeLeft: () => void;
  swipeRight: () => void;
  swipeTop: () => void;
}

export interface SwipeLabel {
  text: string;
  color: string;
}

interface SwipeDeckProps<T> {
  data: T[];
  renderCard: (item: T) => React.ReactNode;
  onSwiped?: (index: number, dir: SwipeDir) => void;
  onSwipedAll?: () => void;
  labels?: { left?: SwipeLabel; right?: SwipeLabel; top?: SwipeLabel };
  keyExtractor?: (item: T, index: number) => string;
  /** When true, right-swipes (Match) are vetoed and spring back. */
  rightLocked?: boolean;
  /** Called when a right-swipe is blocked by `rightLocked`. */
  onRightLocked?: () => void;
}

function SwipeDeckInner<T>(
  { data, renderCard, onSwiped, onSwipedAll, labels, keyExtractor, rightLocked, onRightLocked }: SwipeDeckProps<T>,
  ref: React.Ref<SwipeDeckHandle>,
) {
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  indexRef.current = index;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  // Mirror the lock into a shared value so the pan worklet (UI thread) can read it.
  const rightLockedSV = useSharedValue(!!rightLocked);
  useEffect(() => {
    rightLockedSV.value = !!rightLocked;
  }, [rightLocked, rightLockedSV]);

  // How far the top card has been dragged, 0..1, drives the cards behind it.
  const progress = useDerivedValue(() =>
    Math.min(1, (Math.abs(translateX.value) + Math.abs(translateY.value)) / SWIPE_THRESHOLD),
  );

  // Reset to the top of the deck whenever a fresh deck arrives.
  useEffect(() => {
    setIndex(0);
    translateX.value = 0;
    translateY.value = 0;
  }, [data, translateX, translateY]);

  const complete = useCallback(
    (dir: SwipeDir) => {
      const current = indexRef.current;
      onSwiped?.(current, dir);
      translateX.value = 0;
      translateY.value = 0;
      const next = current + 1;
      setIndex(next);
      if (next >= data.length) onSwipedAll?.();
    },
    [data.length, onSwiped, onSwipedAll, translateX, translateY],
  );

  const fling = useCallback(
    (dir: SwipeDir) => {
      const cb = () => runOnJS(complete)(dir);
      if (dir === "right") translateX.value = withTiming(OUT_DISTANCE, { duration: 280 }, cb);
      else if (dir === "left") translateX.value = withTiming(-OUT_DISTANCE, { duration: 280 }, cb);
      else translateY.value = withTiming(-OUT_DISTANCE, { duration: 280 }, cb);
    },
    [complete, translateX, translateY],
  );

  useImperativeHandle(ref, () => ({
    swipeLeft: () => fling("left"),
    swipeRight: () => fling("right"),
    swipeTop: () => fling("save"),
  }));

  // Vertical "save" swipe is only enabled when a top label is supplied;
  // otherwise the deck is locked to horizontal (left/right) swipes only.
  const saveEnabled = !!labels?.top;

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = saveEnabled ? e.translationY : 0;
    })
    .onEnd((e) => {
      const x = translateX.value;
      const y = translateY.value;
      if (x > SWIPE_THRESHOLD || e.velocityX > VELOCITY_THRESHOLD) {
        if (rightLockedSV.value) {
          // Match is locked (no resume yet) — snap back and notify the screen.
          translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
          translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
          if (onRightLocked) runOnJS(onRightLocked)();
        } else {
          translateX.value = withTiming(OUT_DISTANCE, { duration: 280 }, () => runOnJS(complete)("right"));
        }
      } else if (x < -SWIPE_THRESHOLD || e.velocityX < -VELOCITY_THRESHOLD) {
        translateX.value = withTiming(-OUT_DISTANCE, { duration: 280 }, () => runOnJS(complete)("left"));
      } else if (saveEnabled && (y < -SWIPE_THRESHOLD || e.velocityY < -VELOCITY_THRESHOLD)) {
        translateY.value = withTiming(-OUT_DISTANCE, { duration: 280 }, () => runOnJS(complete)("save"));
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
        translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
      }
    });

  // When the deck is horizontal-only, require horizontal intent so vertical
  // drags never start a swipe.
  if (!saveEnabled) pan.activeOffsetX([-12, 12]);

  // Render the next two cards behind the active one for a stacked look.
  const visible = [2, 1, 0]
    .map((offset) => ({ offset, item: data[index + offset] }))
    .filter((v) => v.item !== undefined);

  return (
    <View style={StyleSheet.absoluteFill}>
      {visible.map(({ offset, item }) => {
        const key = keyExtractor ? keyExtractor(item, index + offset) : String(index + offset);
        const card = (
          <DeckCard
            key={key}
            offset={offset}
            translateX={translateX}
            translateY={translateY}
            progress={progress}
            labels={labels}
          >
            {renderCard(item)}
          </DeckCard>
        );
        if (offset === 0) {
          return (
            <GestureDetector key={key} gesture={pan}>
              {card}
            </GestureDetector>
          );
        }
        return card;
      })}
    </View>
  );
}

function DeckCard({
  offset,
  translateX,
  translateY,
  progress,
  labels,
  children,
}: {
  offset: number;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  progress: SharedValue<number>;
  labels?: SwipeDeckProps<unknown>["labels"];
  children: React.ReactNode;
}) {
  const isTop = offset === 0;

  const cardStyle = useAnimatedStyle(() => {
    if (isTop) {
      const rotate = interpolate(translateX.value, [-SCREEN_W, 0, SCREEN_W], [-9, 0, 9], Extrapolation.CLAMP);
      return {
        zIndex: 100,
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { rotate: `${rotate}deg` },
        ],
      };
    }
    const scale = interpolate(progress.value, [0, 1], [1 - offset * 0.05, 1 - (offset - 1) * 0.05], Extrapolation.CLAMP);
    const ty = interpolate(progress.value, [0, 1], [offset * 16, (offset - 1) * 16], Extrapolation.CLAMP);
    const opacity = interpolate(progress.value, [0, 1], [offset === 1 ? 0.85 : 0.5, offset === 1 ? 1 : 0.85], Extrapolation.CLAMP);
    return { zIndex: 100 - offset, opacity, transform: [{ translateY: ty }, { scale }] };
  });

  const rightStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));
  const leftStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));
  const topStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View style={[styles.card, cardStyle]}>
      {children}
      {isTop && labels?.right && <Label label={labels.right} style={[styles.badgeRight, rightStyle]} rotate="-12deg" />}
      {isTop && labels?.left && <Label label={labels.left} style={[styles.badgeLeft, leftStyle]} rotate="12deg" />}
      {isTop && labels?.top && <Label label={labels.top} style={[styles.badgeTop, topStyle]} rotate="-4deg" />}
    </Animated.View>
  );
}

function Label({ label, style, rotate }: { label: SwipeLabel; style: object; rotate: string }) {
  return (
    <Animated.View style={[styles.badge, { borderColor: label.color, transform: [{ rotate }] }, style]}>
      <Text style={[styles.badgeText, { color: label.color }]}>{label.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { ...StyleSheet.absoluteFillObject },
  badge: {
    position: "absolute",
    top: 26,
    borderWidth: 3,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "rgba(10,14,27,0.35)",
  },
  badgeText: { fontSize: 26, fontWeight: "800", letterSpacing: 2 },
  badgeRight: { left: 22 },
  badgeLeft: { right: 22 },
  badgeTop: { alignSelf: "center", top: 40 },
});

export const SwipeDeck = forwardRef(SwipeDeckInner) as <T>(
  props: SwipeDeckProps<T> & { ref?: React.Ref<SwipeDeckHandle> },
) => React.ReactElement;
