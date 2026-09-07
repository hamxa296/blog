// author: Khoa Phan <https://www.pldkhoa.dev>

"use client";

import {
  createContext,
  useContext,
  useRef,
  type HTMLAttributes,
  type PropsWithChildren,
} from "react";

import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
  type UseScrollOptions,
} from "motion/react";

import { cn } from "@/lib/utils";

interface StackingCardsProps
  extends PropsWithChildren,
    HTMLAttributes<HTMLDivElement> {
  scrollOptions?: UseScrollOptions;
  scaleMultiplier?: number;
  totalCards: number;
}

interface StackingCardItemProps
  extends HTMLAttributes<HTMLDivElement>,
    PropsWithChildren {
  index: number;
  topPosition?: string;
}

export default function StackingCards({
  children,
  className,
  scrollOptions,
  scaleMultiplier,
  totalCards,
  ...props
}: StackingCardsProps) {
  const targetRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    offset: ["start start", "end end"],
    ...scrollOptions,
    target: targetRef,
  });

  return (
    <StackingCardsContext.Provider
      value={{
        progress: scrollYProgress,
        scaleMultiplier,
        totalCards,
      }}
    >
      <div
        className={cn("relative", className)}
        ref={targetRef}
        {...props}
      >
        {children}
      </div>
    </StackingCardsContext.Provider>
  );
}

const StackingCardItem = ({
  index,
  topPosition,
  className,
  children,
  ...props
}: StackingCardItemProps) => {
  const {
    progress,
    scaleMultiplier,
    totalCards = 0,
  } = useStackingCardsContext();

  const safeTotalCards = Math.max(totalCards, 1);

  const scaleTo =
    1 -
    (safeTotalCards - index) *
      (scaleMultiplier ?? 0.10);

  const rangeScale = [
    index * (1 / safeTotalCards),
    1,
  ];

  const scale = useTransform(
    progress,
    rangeScale,
    [1, scaleTo]
  );

  const top = topPosition ?? `${5 + index * 3}%`;

  return (
    <div
      className={cn(
        "h-full sticky top-0 pointer-events-none",
        className
      )}
      style={{
        zIndex: index + 1,
      }}
      {...props}
    >
      <motion.div
        className={cn(
          "origin-top relative h-full pointer-events-auto",

          // Make everything inside the card interactive
          "[&_a]:pointer-events-auto",
          "[&_button]:pointer-events-auto",

          // Button base
          "[&_button]:relative",
          "[&_button]:overflow-hidden",
          "[&_button]:isolate",
          "[&_button]:transition-all",
          "[&_button]:duration-300",

          // Button hover
          "[&_button:hover]:-translate-y-[1px]",
          "[&_button:hover]:shadow-[0_0_20px_rgba(255,34,115,0.25)]",

          // Shimmer
          "[&_button::after]:content-['']",
          "[&_button::after]:absolute",
          "[&_button::after]:inset-y-0",
          "[&_button::after]:-left-full",
          "[&_button::after]:w-1/2",
          "[&_button::after]:skew-x-[-20deg]",
          "[&_button::after]:bg-gradient-to-r",
          "[&_button::after]:from-transparent",
          "[&_button::after]:via-white/40",
          "[&_button::after]:to-transparent",
          "[&_button::after]:animate-button-shimmer"
        )}
        style={{
          top,
          scale,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

const StackingCardsContext = createContext<{
  progress: MotionValue<number>;
  scaleMultiplier?: number;
  totalCards?: number;
} | null>(null);

export const useStackingCardsContext = () => {
  const context = useContext(StackingCardsContext);

  if (!context) {
    throw new Error(
      "StackingCardItem must be used within StackingCards"
    );
  }

  return context;
};

export { StackingCardItem };

/* -------------------------------------------------------------------------- */
/*                               SHIMMER ANIMATION                            */
/* -------------------------------------------------------------------------- */

const shimmerStyles = `
@keyframes button-shimmer {
  0% {
    transform: translateX(0) skewX(-20deg);
  }

  100% {
    transform: translateX(300%) skewX(-20deg);
  }
}
`;

/*
 * Inject the shimmer animation once.
 */
if (typeof document !== "undefined") {
  const styleId = "stacking-cards-button-shimmer";

  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");

    style.id = styleId;
    style.textContent = shimmerStyles;

    document.head.appendChild(style);
  }
}