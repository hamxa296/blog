"use client";

import React, { useRef, useState, useEffect, type RefObject } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  type MotionValue,
} from "framer-motion";

import img3 from "../../assets/3.png";
import img4 from "../../assets/4.png";
import img6 from "../../assets/6.png";
import img7 from "../../assets/7.png";
import img8 from "../../assets/8.png";
import img11 from "../../assets/11.jpeg";
import img12 from "../../assets/12.jpeg";
import img13 from "../../assets/13.jpeg";

export interface CollectionItem {
  id: number | string;
  image: string;
  title: string;
}

export type CollectionSurferVariant = "magnetic" | "uplift" | "simple";

const ITEMS: CollectionItem[] = [
  {
    id: 1,
    image:
      img13,
    title: "HERITAGE 01",
  },
  {
    id: 2,
    image:
      img6,
    title: "HERITAGE 02",
  },
  {
    id: 3,
    image:
      img7,
    title: "HERITAGE 03",
  },
  {
    id: 4,
    image:
      img11,
    title: "HERITAGE 04",
  },
  {
    id: 5,
    image:
      img12,
    title: "HERITAGE 05",
  },
  {
    id: 6,
    image:
      img4,
    title: "HERITAGE 06",
  },
  {
    id: 7,
    image:
      img3,
    title: "HERITAGE 07",
  },
  {
    id: 8,
    image:
      img8,
    title: "HERITAGE 08",
  },
  
];

interface CollectionSurferProps {
  items?: CollectionItem[];
  variant?: CollectionSurferVariant;
  heading?: string;
  subheading?: string;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  spacerHeight?: number;
}

export function CollectionSurfer({
  items = ITEMS,
  variant = "magnetic",
  heading = "GIKI GALLERY",
  subheading = "COLLECTION",
  scrollContainerRef,
  spacerHeight = 12000,
}: CollectionSurferProps) {
  const safeItems = items.length > 0 ? items : ITEMS;
  const duplicatedItems = [...safeItems, ...safeItems];
  const scrollPerItem = 600;
  const loopDistance = Math.max(safeItems.length * scrollPerItem, 1);

  const { scrollY } = useScroll(
    scrollContainerRef ? { container: scrollContainerRef } : undefined,
  );

  const smoothScroll = useSpring(scrollY, {
    mass: 0.1,
    stiffness: 100,
    damping: 20,
  });

  const loopedProgress = useTransform(
    smoothScroll,
    (value) => value % loopDistance,
  );

  const stepX = 240;
  const stepY = -84;
  const stepZ = -288;

  const x = useTransform(
    loopedProgress,
    [0, loopDistance],
    [0, -safeItems.length * stepX],
  );
  const y = useTransform(
    loopedProgress,
    [0, loopDistance],
    [0, -safeItems.length * stepY],
  );
  const z = useTransform(
    loopedProgress,
    [0, loopDistance],
    [0, -safeItems.length * stepZ],
  );

  const mouseX = useMotionValue(-10000);
  const mouseY = useMotionValue(-10000);

  const [overlayOpacity, setOverlayOpacity] = useState(1);

  useEffect(() => {
    const unsub = scrollY.on("change", (v) => {
      const fadeStart = spacerHeight * 0.85;
      const next = v <= fadeStart ? 1 : Math.max(0, 1 - (v - fadeStart) / (spacerHeight * 0.12));
      setOverlayOpacity(next);
    });
    return () => unsub();
  }, [scrollY, spacerHeight]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (variant === "simple") return;
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  const handleMouseLeave = () => {
    if (variant === "simple") return;
    mouseX.set(-10000);
    mouseY.set(-10000);
  };

  return (
    <div className="relative bg-transparent text-white w-full">
      <div style={{ height: `${spacerHeight}px` }} className="w-full" />

      <div
        className="fixed inset-0 w-full h-screen overflow-hidden flex items-center justify-center perspective-container pointer-events-none"
        style={{ opacity: overlayOpacity }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="absolute top-[3vw] left-[3vw] z-50 pointer-events-none mix-blend-difference">
          <h1 className="font-bold text-[clamp(2rem,6vw,5rem)] leading-[0.9] tracking-tighter ml-[4vw]">
            {heading}
          </h1>
          <h1 className="font-bold text-[clamp(2rem,6vw,5rem)] leading-[0.9] tracking-tighter">
            {subheading}
            <span className="text-[0.4em] align-top relative top-[0.6em] ml-2 font-mono tabular-nums">
              ({safeItems.length})
            </span>
          </h1>
        </div>

        <div className="absolute bottom-[3vw] right-[3vw] z-50 font-mono text-xs tracking-wider uppercase opacity-70">
          scroll to surf
        </div>

        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            perspective: "2000px",
            perspectiveOrigin: "10% 10%",
          }}
        >
          <motion.div
            className="relative w-0 h-0"
            style={{
              x,
              y,
              z,
              transformStyle: "preserve-3d",
            }}
          >
            {duplicatedItems.map((item, i) => (
              <SurferCard
                key={`${item.id}-${i}`}
                item={item}
                i={i}
                itemCount={safeItems.length}
                stepX={stepX}
                stepY={stepY}
                stepZ={stepZ}
                mouseX={mouseX}
                mouseY={mouseY}
                scrollSpring={smoothScroll}
                variant={variant}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function SurferCard({
  item,
  i,
  itemCount,
  stepX,
  stepY,
  stepZ,
  mouseX,
  mouseY,
  scrollSpring,
  variant,
}: {
  item: CollectionItem;
  i: number;
  itemCount: number;
  stepX: number;
  stepY: number;
  stepZ: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  scrollSpring: MotionValue<number>;
  variant: CollectionSurferVariant;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform([mouseX, mouseY, scrollSpring], ([mx, my]) => {
    if (!ref.current || variant === "simple") return 200;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.sqrt(
      Math.pow(Number(mx) - centerX, 2) + Math.pow(Number(my) - centerY, 2),
    );
  });

  const targetScale = useTransform(distance, [0, 400], [1.5, 1]);
  const springScale = useSpring(targetScale, {
    mass: 0.5,
    stiffness: 300,
    damping: 20,
  });

  const targetUplift = useTransform(distance, [0, 400], [-100, 0]);
  const springUplift = useSpring(targetUplift, {
    mass: 0.5,
    stiffness: 300,
    damping: 20,
  });

  const transform = useTransform([springScale, springUplift], ([s, u]) => {
    let scaleValue = 1;
    let upliftValue = 0;

    if (variant === "magnetic") {
      scaleValue = Number(s);
    } else if (variant === "uplift") {
      upliftValue = Number(u);
    }

    const baseX = i * stepX;
    const baseY = i * stepY;
    const baseZ = i * stepZ;

    return `translate3d(${baseX}px, ${baseY + upliftValue}px, ${baseZ}px) rotateY(-50deg) scale(${scaleValue})`;
  });

  return (
    <motion.div
      ref={ref}
      className="absolute w-[300px] h-[400px] bg-neutral-900 overflow-hidden shadow-2xl transition-colors duration-500 ease-out group"
      style={{
        transform,
        transformStyle: "preserve-3d",
      }}
    >
      <div className="absolute -top-6 -left-4 text-white font-mono text-xs opacity-50 transition-opacity group-hover:opacity-100">
        {String((i % itemCount) + 1).padStart(2, "0")}
      </div>

      <div className="relative w-full h-full  duration-300">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover"
        />
      </div>

      
    </motion.div>
  );
}

export default CollectionSurfer;
