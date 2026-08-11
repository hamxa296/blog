import React from 'react';
import { Link } from 'react-router-dom';

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

import { motion } from 'framer-motion';

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
    <motion.article 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative w-full aspect-square max-h-[420px] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl flex flex-row group bg-[#08080a]"
    >
      {/* Background Image Sizing & Alignment */}
      <div
        className="card-bg transition-transform duration-700 group-hover:scale-105"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      {/* Dark Atmospheric Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-black/30 to-black/1 z-[2] pointer-events-none" />

      {/* Left Column: Transparent & Bottom-Anchored Vertical Sidebar Rail */}
      <div className="relative z-10 flex items-end justify-center px-4 sm:px-5 pb-16 pt-8 border-r border-white/10 bg-black/20 backdrop-blur-xs select-none h-full">
        <span className="writing-mode-vertical text-3xl sm:text-4xl lg:text-5xl font-black tracking-[0.15em] uppercase text-white/20 drop-shadow-md">
          {verticalTitle}
        </span>
      </div>

      {/* Right Column: Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-6 sm:p-8 lg:p-10 pb-16">
        {/* Top Space / Header Tag */}
        <div className="flex items-center justify-end">
          <span className="text-[10px] sm:text-xs font-mono tracking-widest text-white/40 uppercase">
            // GIKI CHRONICLES
          </span>
        </div>

        {/* Middle: Lowered & Massive Display Headings + Description */}
        {/* Updated top padding from pt-12 to pt-28 sm:pt-32 to push headings down */}
        <div className="flex flex-col gap-3 mt-auto mb-2 pt-12">
          <div className="flex flex-col">
          <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase leading-[0.85] drop-shadow-xl">
            {topHeading}
          </span>

          <span
            className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase leading-[0.85] drop-shadow-2xl"
            style={{ color: accentColor }}
          >
            {bottomHeading}
          </span>
          </div>

          <p className="text-sm sm:text-base text-gray-300 font-medium leading-relaxed max-w-md pt-1">
            {description}
          </p>
        </div>

        {/* Bottom: Pill Button with Accent Theme Color */}
        <div className="pt-4">
          <Link
            to={ctaLink}
            className="inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-full border backdrop-blur-md text-xs sm:text-sm font-extrabold tracking-widest uppercase transition-all duration-300 hover:scale-105 shadow-lg"
            style={{
              backgroundColor: `${accentColor}1A`,
              borderColor: `${accentColor}50`,
              color: '#FFFFFF',
            }}
          >
            <span>{ctaText}</span>
            <span style={{ color: accentColor }} className="text-base font-bold">
              →
            </span>
          </Link>
        </div>
      </div>

      {/* Torn Paper Edge Masking at Bottom */}
      <div className="torn-paper-edge" aria-hidden="true" />
    </motion.article>
  );
};

export default FeatureCard;