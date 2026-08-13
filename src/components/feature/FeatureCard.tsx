
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export interface FeatureCardProps {
  verticalTitle: string;
  topHeading: string;
  bottomHeading: string;
  accentColor: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  bgImage: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  verticalTitle,
  topHeading,
  bottomHeading,
  accentColor,
  description,
  ctaText,
  ctaLink,
  bgImage,
}) => {
  return (
    <div className="relative w-full group [perspective:1200px]">

      {/* =========================================
          WHITE SIDE GLOW
      ========================================= */}
      <div
        className="
          pointer-events-none
          absolute
          -inset-x-4
          inset-y-8
          rounded-[2.5rem]
          bg-white/50
          blur-2xl
          opacity-0
          transition-all
          duration-500
          ease-out
          group-hover:opacity-80
          group-hover:-inset-x-6
        "
      />

      {/* Stronger thin edge glow */}
      <div
        className="
          pointer-events-none
          absolute
          -inset-x-1
          inset-y-4
          rounded-[2.2rem]
          border-x-2
          border-white/0
          transition-all
          duration-500
          group-hover:border-white/60
          group-hover:blur-[1px]
        "
      />

      {/* =========================================
          CARD
      ========================================= */}
      <motion.article
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}

        whileHover={{
          y: -14,
          rotateX: 3,
          rotateY: 1.5,
          scale: 1.015,
        }}

        style={{
          transformStyle: 'preserve-3d',
        }}

        className="
          relative
          w-full
          aspect-square
          max-h-[420px]
          rounded-[2rem]
          overflow-hidden
          border
          border-white/10
          bg-[#08080a]
          flex
          flex-row
          group/card
          transition-[border-color,box-shadow]
          duration-500
          ease-out

          hover:border-white/30

          hover:shadow-[0_30px_80px_rgba(0,0,0,0.65)]
        "
      >

        {/* =========================================
            BACKGROUND IMAGE
        ========================================= */}
        <div
          className="
            absolute
            inset-0
            bg-cover
            bg-center
            bg-no-repeat
            transition-transform
            duration-700
            ease-out
            group-hover/card:scale-110
          "
          style={{
            backgroundImage: `url(${bgImage})`,
          }}
        />

        {/* =========================================
            IMAGE DARKENING
        ========================================= */}
        <div
          className="
            absolute
            inset-0
            bg-gradient-to-t
            from-[#08080a]
            via-black/40
            to-black/10
            z-[2]
            pointer-events-none
          "
        />

        {/* =========================================
            SUBTLE WHITE EDGE LIGHT
        ========================================= */}
        <div
          className="
            absolute
            inset-0
            z-[3]
            pointer-events-none
            rounded-[2rem]
            opacity-0
            transition-opacity
            duration-500
            group-hover/card:opacity-100

            shadow-[inset_12px_0_35px_-25px_rgba(255,255,255,0.9),inset_-12px_0_35px_-25px_rgba(255,255,255,0.9)]
          "
        />

        {/* =========================================
            LEFT VERTICAL RAIL
        ========================================= */}
        <div
          className="
            relative
            z-10
            flex
            items-end
            justify-center
            px-4
            sm:px-5
            pb-16
            pt-8
            border-r
            border-white/10
            bg-black/20
            backdrop-blur-xs
            select-none
            h-full
            transition-all
            duration-500
            group-hover/card:border-white/30
          "
        >
          <span
            className="
              writing-mode-vertical
              text-3xl
              sm:text-4xl
              lg:text-5xl
              font-black
              tracking-[0.15em]
              uppercase
              text-white/20
              drop-shadow-md
              transition-all
              duration-500
              group-hover/card:text-white/40
              group-hover/card:drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]
            "
          >
            {verticalTitle}
          </span>
        </div>

        {/* =========================================
            MAIN CONTENT
        ========================================= */}
        <div
          className="
            relative
            z-10
            flex-1
            flex
            flex-col
            justify-between
            p-6
            sm:p-8
            lg:p-10
            pb-16
          "
        >

          {/* Header */}
          <div className="flex items-center justify-end">
            <span
              className="
                text-[10px]
                sm:text-xs
                font-mono
                tracking-widest
                text-white/40
                uppercase
                transition-colors
                duration-300
                group-hover/card:text-white/70
              "
            >
              // GIKI CHRONICLES
            </span>
          </div>

          {/* Headings + Description */}
          <div className="flex flex-col gap-3 mt-auto mb-2 pt-12">

            <div className="flex flex-col">

              <span
                className="
                  text-3xl
                  sm:text-4xl
                  lg:text-5xl
                  font-black
                  tracking-tight
                  text-white
                  uppercase
                  leading-[0.85]
                  drop-shadow-xl
                  transition-transform
                  duration-500
                  group-hover/card:translate-x-1
                "
              >
                {topHeading}
              </span>

              <span
                className="
                  text-3xl
                  sm:text-4xl
                  lg:text-5xl
                  font-black
                  tracking-tight
                  uppercase
                  leading-[0.85]
                  drop-shadow-2xl
                  transition-all
                  duration-500
                  group-hover/card:drop-shadow-[0_0_14px_var(--accent)]
                "
                style={{
                  color: accentColor,
                  ['--accent' as string]: accentColor,
                }}
              >
                {bottomHeading}
              </span>

            </div>

            <p
              className="
                text-sm
                sm:text-base
                text-gray-300
                font-medium
                leading-relaxed
                max-w-md
                pt-1
                transition-colors
                duration-500
                group-hover/card:text-white
              "
            >
              {description}
            </p>

          </div>

          {/* =========================================
              CTA BUTTON
          ========================================= */}
          <div className="pt-4">
            <Link
              to={ctaLink}
              className="
                inline-flex
                items-center
                justify-center
                gap-3
                px-8
                py-3.5
                rounded-full
                border
                backdrop-blur-md
                text-xs
                sm:text-sm
                font-extrabold
                tracking-widest
                uppercase
                transition-all
                duration-300
                hover:scale-105
                shadow-lg
              "
              style={{
                backgroundColor: `${accentColor}1A`,
                borderColor: `${accentColor}50`,
                color: '#FFFFFF',
              }}
            >
              <span>{ctaText}</span>

              <span
                style={{ color: accentColor }}
                className="
                  text-base
                  font-bold
                  transition-transform
                  duration-300
                  group-hover/card:translate-x-1
                "
              >
                →
              </span>
            </Link>
          </div>

        </div>

        {/* =========================================
            TORN PAPER EDGE
        ========================================= */}
        <div
          className="torn-paper-edge"
          aria-hidden="true"
        />

      </motion.article>
    </div>
  );
};

export default FeatureCard;
