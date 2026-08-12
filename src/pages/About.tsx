import React from 'react';
import randomBg from '../assets/randombg.webp';
import aboutBg from '../assets/about_bg.webp';
import meetTheTeamBg from '../assets/team2.webp';
import zaraBg from '../assets/zara.webp';
import hamzaBg from '../assets/hamza.webp';
import harisBg from '../assets/haris2.webp';
import Footer from '../components/nav/Footer';

export const About: React.FC = () => {
  return (
    <div
      className="w-full min-h-screen flex flex-col justify-between bg-cover bg-center bg-no-repeat relative overflow-x-hidden"
      style={{ backgroundImage: `url(${randomBg})` }}
    >
      {/* Main 2-Column Section */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 py-8 my-auto relative z-10 w-full max-w-7xl mx-auto">
        
        {/* Ambient Glow */}
        <div className="absolute w-[500px] h-[500px] bg-[#ff007f]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full relative z-10">
          
          {/* LEFT HALF: About Poster */}
          <div className="flex items-center justify-center w-full">
            <img
              src={aboutBg}
              alt="About GIKI Chronicles"
              className="w-full max-h-[75vh] object-contain mx-auto drop-shadow-[0_25px_50px_rgba(0,0,0,0.85)]"
            />
          </div>

          {/* RIGHT HALF: Stacked Header & Equalized Cards */}
          <div className="flex flex-col items-center justify-center gap-6 w-full">
            
            {/* Header Graphic (Enlarged) */}
            <div className="w-full flex justify-center py-2 overflow-visible">
              <img
                src={meetTheTeamBg}
                alt="Meet The Team"
                className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl h-auto object-contain mx-auto drop-shadow-xl scale-110 sm:scale-125 transition-transform duration-300"
              />
            </div>

            {/* 3 Equalized Cards (Hamza | Zara | Haris) */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 items-center justify-center w-full max-w-2xl mx-auto">
              
              {/* Hamza */}
              <div className="w-full aspect-[9/16] relative overflow-hidden rounded-xl shadow-xl hover:scale-105 transition-transform duration-300">
                <img
                  src={hamzaBg}
                  alt="Hamza"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Zara (Center) */}
              <div className="w-full aspect-[9/16] relative overflow-hidden rounded-xl shadow-xl hover:scale-105 transition-transform duration-300">
                <img
                  src={zaraBg}
                  alt="Zara"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Haris */}
              <div className="w-full aspect-[9/16] relative overflow-hidden rounded-xl shadow-xl hover:scale-105 transition-transform duration-300">
                <img
                  src={harisBg}
                  alt="Haris"
                  className="w-full h-full object-cover"
                />
              </div>

            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <div className="hidden md:block w-full">
        <Footer />
      </div>
    </div>
  );
};

export default About;
