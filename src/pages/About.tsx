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
    <>
      {/* Fixed Background */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${newBg})`,
        }}
      />
  
      {/* Page Content */}
      <main className="relative z-10 min-h-screen pb-24 text-foreground">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-16 pb-8">
          {/* your existing content */}
        </div>
  
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          {TEAM.map((member) => (
            <TeamMemberCard
              key={`${member.firstName}-${member.lastName}`}
              {...member}
            />
          ))}
        </div>
      </main>
    </>
  );
    );
  };
