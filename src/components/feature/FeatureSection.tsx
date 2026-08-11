import React from 'react';
import FeatureCard, { type FeatureCardProps } from './FeatureCard';

import freshmanBg from '@/assets/freshman-bg.webp';
import galleryBg from '@/assets/Gallery_png.webp';
import blogBg from '@/assets/blog-bg1.webp';

const FEATURE_CARDS: FeatureCardProps[] = [
  {
    verticalTitle: 'FRESHMAN',
    topHeading: 'SURVIVAL',
    bottomHeading: 'GUIDE',
    accentColor: '#FF0055',
    description:
      'Essential campus navigation, course hacks, hostel tips & survival tactics for day 0.',
    ctaText: 'FRESHMAN GUIDE',
    ctaLink: '/guide',
    bgImage: freshmanBg,
  },
  {
    verticalTitle: 'CAMPUS',
    topHeading: 'PHOTO',
    bottomHeading: 'GALLERY',
    accentColor: '#00F0FF',
    description:
      'High-res captures of academic blocks, sunset spots, and iconic campus events.',
    ctaText: 'VIEW VAULT',
    ctaLink: '/gallery',
    bgImage: galleryBg,
  },
  {
    verticalTitle: 'COMMUNITY',
    topHeading: 'STUDENT',
    bottomHeading: 'BLOGS',
    accentColor: '#FFB800',
    description:
      'Unfiltered stories, engineering project logs, and late-night hostel chronicles.',
    ctaText: 'READ STORIES',
    ctaLink: '/browse',
    bgImage: blogBg,
  },
];

export const FeatureSection: React.FC = () => {
  return (
    <section className="w-full flex flex-col bg-transparent py-16 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-6">
        {FEATURE_CARDS.map((card, index) => (
          <FeatureCard key={index} {...card} />
        ))}
      </div>
    </section>
  );
};

export default FeatureSection;
