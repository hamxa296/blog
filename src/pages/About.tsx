import React from 'react';
import randomBg from '../assets/randombg.webp';
import aboutBg from '../assets/about_bg.webp';
import Footer from '../components/nav/Footer';

export const About: React.FC = () => {
  return (
    <div
      className="w-full min-h-screen flex flex-col justify-between bg-cover bg-center bg-no-repeat relative overflow-x-hidden"
      style={{ backgroundImage: `url(${randomBg})` }}
    >
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        {/* Subtle Ambient Pink Glow behind poster */}
        <div className="absolute w-[500px] h-[500px] bg-[#ff007f]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Main Poster Asset (Zoomed slightly with scale-105 sm:scale-110) */}
        <img
          src={aboutBg}
          alt="About GIKI Chronicles"
          className="relative z-10 w-full max-h-[80vh] sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl h-auto object-contain mx-auto scale-105 sm:scale-110 transition-transform duration-300 drop-shadow-[0_25px_50px_rgba(0,0,0,0.85)]"
        />
      </div>

      {/* Footer Component (Desktop Only) */}
      <div className="hidden md:block w-full">
        <Footer />
      </div>
    </div>
  );
};

export default About;