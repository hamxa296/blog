import React from 'react';
import TeamMemberCard from '../components/about/TeamMemberCard';

import img6 from "../assets/6.png";
import img7 from "../assets/7.png";
import img13 from "../assets/13.jpeg";

import newBg from '../assets/randombg.png';

const TEAM = [
  {
    position: 'left' as const,
    jobPosition: 'we care about you!',
    firstName: 'Your Complete Survival',
    lastName: 'Freshmen Guide',
    imageUrl:
      img6,
    description:
      'From packing essentials to navigating campus life, our comprehensive guide covers everything you need to know as a new GIKI student. Discover hostel information, mess schedules, weekend travel options, and essential contacts to make your transition smooth and exciting.',
  },
  {
    position: 'right' as const,
    jobPosition: 'Be yourself; everyone else is already taken',
    firstName: 'GIKIs own',
    lastName: 'Blogging app',
    imageUrl:
      img7,
    description:
      'Every student has a story worth telling. Share your experiences, publish your ideas, and become part of the conversations shaping life at GIKI.',
  },
  {
    position: 'left' as const,
    jobPosition: 'Campus essentials, Ofcourse!',
    firstName: 'Explore Our Campus',
    lastName: 'Through the Lens',
    imageUrl:
      img13,
    description:
      'From academic blocks and hostel life to sports facilities and campus events, capture the essence of student life and share your own moments with the community.',
  },
];

export const About: React.FC = () => {
  return (
    <main
      className="relative z-10 min-h-screen pb-24 text-foreground bg-cover bg-center"
      style={{
        backgroundImage: `url(${newBg})`,
        backgroundAttachment: "fixed",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-16 pb-8">
        <p className="text-xs font-medium tracking-[0.3em] text-zinc-500 uppercase mb-4">
          About Us
        </p>
        <h1 className="text-4xl sm:text-6xl font-extralight tracking-tight text-white mb-4">
          The idea behind
          <br />
          <span className="font-normal">GIKI Chronicles</span>
        </h1>
        <p className="text-zinc-400 max-w-xl text-sm sm:text-base leading-relaxed">
        Be Prepared For The Valley & Beyond!
        Your one-stop hub for student life, engineering marvels, and campus tales at GIKI Institute.
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
