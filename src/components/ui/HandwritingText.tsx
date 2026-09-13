"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useAnimation,
  type Variants,
} from "motion/react";

export interface HandwritingTextProps {
  /** A single phrase to write. */
  text?: string;

  /** Cycle through these words. */
  words?: string[];

  /** Milliseconds each word stays visible. */
  interval?: number;

  /** Time in seconds for the writing animation. */
  duration?: number;

  /** Delay before writing starts. */
  delay?: number;

  /** CSS height of the text. */
  height?: string;

  /** Color of the text. */
  color?: string;

  /** Show the little pen. */
  showPen?: boolean;

  /** Add a playful wobble to the writing. */
  playful?: boolean;

  /** Additional CSS classes. */
  className?: string;
}

function HandwritingText({
  text,
  words,
  interval = 3200,
  duration = 1.8,
  delay = 0.15,
  height = "1.15em",
  color = "#ff2273",
  showPen = true,
  playful = true,
  className = "",
}: HandwritingTextProps) {
  const cycle = Boolean(words && words.length > 0);

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controls = useAnimation();

  const current = cycle
    ? words![index % words!.length]
    : text ?? "";

  /*
   * Start the writing animation whenever the word changes.
   */
  useEffect(() => {
    let mounted = true;

    setVisible(false);

    controls.set({
      opacity: 0,
      y: 5,
      rotate: playful ? -1.5 : 0,
      scale: 0.98,
    });

    const start = window.setTimeout(() => {
      if (!mounted) return;

      controls.start({
        opacity: 1,
        y: 0,
        rotate: 0,
        scale: 1,
        transition: {
          duration,
          delay,
          ease: [0.16, 1, 0.3, 1],
        },
      });

      window.setTimeout(() => {
        if (mounted) {
          setVisible(true);
        }
      }, (duration + delay) * 1000);
    }, 80);

    return () => {
      mounted = false;
      window.clearTimeout(start);
    };
  }, [current, duration, delay, playful, controls]);

  /*
   * Cycle through words.
   */
  useEffect(() => {
    if (!cycle) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setIndex((i) => i + 1);
    }, interval);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [cycle, interval, index]);

  /*
   * Pen animation.
   */
  const penVariants: Variants = {
    hidden: {
      x: "-8%",
      y: 2,
      rotate: -35,
      opacity: 0,
    },

    writing: {
      x: "105%",
      y: [2, -1, 2, 0, 2],
      rotate: [-35, -28, -33, -27, -30],
      opacity: [0, 1, 1, 1, 0],

      transition: {
        duration: duration + 0.1,
        delay: Math.max(0, delay - 0.05),
        ease: "easeInOut",

        y: {
          duration,
          times: [0, 0.25, 0.5, 0.75, 1],
          ease: "easeInOut",
        },

        rotate: {
          duration,
          times: [0, 0.25, 0.5, 0.75, 1],
          ease: "easeInOut",
        },
      },
    },
  };

  /*
   * Text reveal animation.
   */
  const textVariants: Variants = {
    hidden: {
      clipPath: "inset(0 100% 0 0)",
      opacity: 0.3,
    },

    writing: {
      clipPath: "inset(0 0% 0 0)",
      opacity: 1,

      transition: {
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <span
      className={`relative inline-flex items-center overflow-hidden ${className}`}
      style={{
        height,
        color: color,
        maxWidth: "100%",
        width: "fit-content",
        contain: "layout paint",
      }}
    >
      {/* Invisible sizing text */}
      <span
        aria-hidden="true"
        className="invisible whitespace-nowrap"
        style={{
          fontSize: "inherit",
          lineHeight: 1,
          maxWidth: "100%",
          overflow: "hidden",
          color: color,
        }}
      >
        {current}
      </span>

      {/* Animated handwriting text */}
      <AnimatePresence mode="wait">
        <motion.span
          key={current}
          variants={textVariants}
          initial="hidden"
          animate="writing"
          className="absolute inset-0 whitespace-nowrap overflow-hidden"
          style={{
            fontSize: "inherit",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            maxWidth: "100%",
            color: color,
          }}
        >
          {current}
        </motion.span>
      </AnimatePresence>

      {/* Animated pen */}
      {showPen && (
        <motion.span
          key={`pen-${current}`}
          variants={penVariants}
          initial="hidden"
          animate="writing"
          className="pointer-events-none absolute z-20"
          style={{
            left: 0,
            top: "50%",
            width: "1.15em",
            height: "1.15em",
            marginTop: "-0.25em",
            overflow: "visible",
            color: color,
          }}
        >
          {/* Pen body */}
          <span
            className="absolute"
            style={{
              width: "0.75em",
              height: "0.18em",
              top: "0.42em",
              left: "0.18em",
              borderRadius: "999px",
              background: color,
              transform: "rotate(-35deg)",
              transformOrigin: "left center",
              opacity: 0.9,
            }}
          />

          {/* Pen grip */}
          <span
            className="absolute"
            style={{
              width: "0.22em",
              height: "0.22em",
              top: "0.37em",
              left: "0.05em",
              borderRadius: "50%",
              background: color,
            }}
          />

          {/* Pen tip */}
          <span
            className="absolute"
            style={{
              width: 0,
              height: 0,
              top: "0.39em",
              left: "-0.02em",
              borderTop: "0.08em solid transparent",
              borderBottom: "0.08em solid transparent",
              borderRight: `0.16em solid ${color}`,
              transform: "rotate(-35deg)",
            }}
          />

          {/* Tiny ink dot */}
          <motion.span
            className="absolute rounded-full"
            style={{
              width: "0.055em",
              height: "0.055em",
              background: color,
              left: "-0.02em",
              top: "0.52em",
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 0.35,
              delay: delay + 0.15,
              repeat: 2,
            }}
          />
        </motion.span>
      )}

      {/* Finishing sparkle */}
      {playful && visible && (
        <motion.span
          key={`spark-${current}`}
          className="pointer-events-none absolute"
          initial={{
            opacity: 0,
            scale: 0,
            x: "100%",
            y: "30%",
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.15, 0.7],
            x: ["100%", "108%", "112%"],
            y: ["30%", "0%", "-10%"],
            rotate: [0, 15, 30],
          }}
          transition={{
            duration: 0.65,
            ease: "easeOut",
          }}
          style={{
            fontSize: "0.45em",
            pointerEvents: "none",
            color: color,
          }}
        >
          ✦
        </motion.span>
      )}
    </span>
  );
}

export default HandwritingText;