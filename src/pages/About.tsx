import React from 'react';
import TeamMemberCard from '../components/about/TeamMemberCard';

const TEAM = [
  {
    position: 'left' as const,
    jobPosition: 'Founder & Editor',
    firstName: 'Ayesha',
    lastName: 'Khan',
    imageUrl:
      'https://images.unsplash.com/photo-1526510747491-58f928ec870f?fm=jpg&q=60&w=800',
    description:
      'Ayesha leads the editorial vision for GIKI Chronicles — shaping stories that capture campus life, culture, and student voices across the valley.',
  },
  {
    position: 'right' as const,
    jobPosition: 'Creative Director',
    firstName: 'Hamza',
    lastName: 'Ali',
    imageUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
    description:
      'Hamza crafts the visual language of the platform — from gallery curation to brand moments that make every chronicle feel cinematic and alive.',
  },
  {
    position: 'left' as const,
    jobPosition: 'Community Lead',
    firstName: 'Sara',
    lastName: 'Malik',
    imageUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
    description:
      'Sara builds bridges between writers, photographers, and readers — ensuring every freshman, senior, and alum finds a place in the chronicle.',
  },
];

export const About: React.FC = () => {
  return (
    <main className="relative z-10 min-h-screen pb-24 bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-16 pb-8">
        <p className="text-xs font-medium tracking-[0.3em] text-zinc-500 uppercase mb-4">
          About Us
        </p>
        <h1 className="text-4xl sm:text-6xl font-extralight tracking-tight text-white mb-4">
          The people behind
          <br />
          <span className="font-normal">GIKI Chronicles</span>
        </h1>
        <p className="text-zinc-400 max-w-xl text-sm sm:text-base leading-relaxed">
          Three builders. One campus voice. We document the stories, places, and
          people that make GIKI unforgettable.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8">
        {TEAM.map((member) => (
          <TeamMemberCard key={`${member.firstName}-${member.lastName}`} {...member} />
        ))}
      </div>
    </main>
  );
};
