import React, { useState } from 'react';
import { X } from 'lucide-react';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);
import randomBg from '../assets/randombg.webp';
import aboutBg from '../assets/about_bg.webp';
import meetTheTeamBg from '../assets/team 3.webp';
import zaraBg from '../assets/zara.webp';
import hamzaBg from '../assets/hamza2.webp';
import harisBg from '../assets/haris2.webp';


export const About: React.FC = () => {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  return (
    <div
      className="w-full min-h-screen flex flex-col justify-between bg-cover bg-center bg-no-repeat relative overflow-x-hidden"
      style={{ backgroundImage: `url(${randomBg})` }}
    >
      {/* Main Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 sm:py-12 my-auto relative z-10 w-full max-w-7xl mx-auto">

        {/* Ambient Glow */}
        <div className="absolute w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] bg-[#ff007f]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center w-full relative z-10">

          {/* ========================================================= */}
          {/* LEFT: ABOUT POSTER INSIDE SCREEN FRAME */}
          {/* ========================================================= */}
          <div className="flex items-center justify-center w-full">

            {/* Screen outer frame */}
            <div
              className="
                relative
                w-[82vw]
                max-w-[430px]
                sm:w-[70vw]
                lg:w-full
                lg:max-w-[500px]
                p-[7px]
                sm:p-[9px]
                rounded-[28px]
                sm:rounded-[34px]
                bg-gradient-to-br from-white/20 via-white/5 to-white/10
                border border-white/20
                shadow-[0_30px_80px_rgba(0,0,0,0.75)]
                transition-all duration-500
                hover:shadow-[0_35px_100px_rgba(255,0,127,0.25)]
              "
            >

              {/* Inner screen */}
              <div
                className="
                  relative
                  overflow-hidden
                  rounded-[22px]
                  sm:rounded-[28px]
                  bg-black
                  border border-white/10
                "
              >

                {/* Screen image */}
                <img
                  src={aboutBg}
                  alt="About GIKI Chronicles"
                  className="
                    w-full
                    h-auto
                    object-contain
                    block
                    transition-transform
                    duration-700
                    hover:scale-[1.015]
                  "
                />

                {/* Glass reflection */}
                <div
                  className="
                    absolute
                    inset-0
                    pointer-events-none
                    overflow-hidden
                  "
                >
                  <div
                    className="
                      absolute
                      top-0
                      -left-[70%]
                      w-[45%]
                      h-full
                      bg-gradient-to-r
                      from-transparent
                      via-white/20
                      to-transparent
                      skew-x-[-20deg]
                      animate-screen-shimmer
                    "
                  />
                </div>

                {/* Subtle glass overlay */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />

              </div>

              {/* Bottom screen glow */}
              <div
                className="
                  absolute
                  -bottom-5
                  left-1/2
                  -translate-x-1/2
                  w-[65%]
                  h-8
                  bg-[#ff007f]/20
                  blur-2xl
                  pointer-events-none
                "
              />

            </div>
          </div>


          {/* ========================================================= */}
          {/* RIGHT: TEAM */}
          {/* ========================================================= */}
          <div className="flex flex-col items-center justify-center gap-5 sm:gap-6 w-full">

            {/* Team Header */}
            <div className="w-full flex justify-center overflow-visible">

              <img
                src={meetTheTeamBg}
                alt="Meet The Team"
                className="
                  w-full
                  max-w-[280px]
                  sm:max-w-sm
                  lg:max-w-md
                  xl:max-w-lg
                  h-auto
                  object-contain
                  mx-auto
                  drop-shadow-xl
                  transition-transform
                  duration-500
                  hover:scale-[1.03]
                "
              />

            </div>


            {/* ===================================================== */}
            {/* TEAM CARDS */}
            {/* ===================================================== */}
            <div
              className="
                grid
                grid-cols-3
                gap-2.5
                sm:gap-4
                items-center
                justify-center
                w-full
                max-w-[620px]
                mx-auto
                px-1
              "
            >

              {/* ================= HAMZA ================= */}
              <div className="flex flex-col items-center">
                <div 
                  className="team-card group cursor-pointer"
                  onClick={() => setLightboxImage(hamzaBg)}
                >
                  <img
                    src={hamzaBg}
                    alt="Hamza"
                    className="team-card-image"
                  />
                  {/* Glow */}
                  <div className="team-card-glow" />
                </div>
                <a
                  href="https://instagram.com/hamxa_296/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                  <span>@hamxa_296</span>
                </a>
              </div>

              {/* ================= ZARA ================= */}
              <div className="flex flex-col items-center">
                <div 
                  className="team-card group cursor-pointer"
                  onClick={() => setLightboxImage(zaraBg)}
                >
                  <img
                    src={zaraBg}
                    alt="Zara"
                    className="team-card-image"
                  />
                  {/* Glow */}
                  <div className="team-card-glow" />
                </div>
                <a
                  href="https://instagram.com/zed._.axe/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                  <span>@zed._.axe</span>
                </a>
              </div>

              {/* ================= HARIS ================= */}
              <div className="flex flex-col items-center">
                <div 
                  className="team-card group cursor-pointer"
                  onClick={() => setLightboxImage(harisBg)}
                >
                  <img
                    src={harisBg}
                    alt="Haris"
                    className="team-card-image"
                  />
                  {/* Glow */}
                  <div className="team-card-glow" />
                </div>
                <a
                  href="https://instagram.com/harisssss23/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                  <span>@harisssss23</span>
                </a>
              </div>

            </div>

          </div>

        </div>
      </main>


      


      {/* ============================================================= */}
      {/* CUSTOM ANIMATIONS */}
      {/* ============================================================= */}
      <style>{`

        /* --------------------------------------------------------- */
        /* SCREEN SHIMMER                                            */
        /* --------------------------------------------------------- */

        @keyframes screenShimmer {
          0% {
            left: -70%;
          }

          45%,
          100% {
            left: 130%;
          }
        }

        .animate-screen-shimmer {
          animation: screenShimmer 5s ease-in-out infinite;
        }


        /* --------------------------------------------------------- */
        /* TEAM CARD                                                   */
        /* --------------------------------------------------------- */

        .team-card {
          position: relative;
          width: 100%;
          aspect-ratio: 9 / 16;
          overflow: visible;
          border-radius: 18px;

          transform:
            perspective(900px)
            translateZ(0)
            rotateX(0deg)
            rotateY(0deg);

          transition:
            transform 450ms cubic-bezier(0.2, 0.8, 0.2, 1),
            box-shadow 450ms ease;
        }


        /* Card itself */
        .team-card::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;

          border-radius: inherit;

          background: rgba(255, 0, 127, 0.35);

          filter: blur(18px);

          opacity: 0;

          transition:
            opacity 400ms ease,
            transform 400ms ease;
        }


        /* Card border */
        .team-card::after {
          content: "";
          position: absolute;
          inset: -1px;

          border-radius: inherit;

          border: 1px solid rgba(255,255,255,0.12);

          pointer-events: none;

          transition:
            border-color 350ms ease,
            box-shadow 350ms ease;
        }


        /* Image */
        .team-card-image {
          position: relative;
          z-index: 1;

          width: 100%;
          height: 100%;

          object-fit: cover;

          border-radius: inherit;

          display: block;

          box-shadow:
            0 15px 35px rgba(0,0,0,0.55);

          transition:
            transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1),
            filter 400ms ease,
            box-shadow 400ms ease;
        }


        /* Glow layer */
        .team-card-glow {
          position: absolute;

          left: 10%;
          right: 10%;
          bottom: -15px;

          height: 35px;

          background: #ff007f;

          filter: blur(25px);

          opacity: 0;

          z-index: 0;

          transition:
            opacity 400ms ease,
            transform 400ms ease;
        }


        /* --------------------------------------------------------- */
        /* DESKTOP HOVER                                              */
        /* --------------------------------------------------------- */

        @media (hover: hover) and (pointer: fine) {

          .team-card:hover {
            transform:
              perspective(900px)
              translateY(-18px)
              translateZ(30px)
              rotateX(2deg)
              rotateY(-2deg);

            z-index: 10;
          }

          .team-card:hover::before {
            opacity: 0.8;
            transform: scale(1.05);
          }

          .team-card:hover::after {
            border-color: rgba(255, 0, 127, 0.65);

            box-shadow:
              0 0 15px rgba(255,0,127,0.45),
              0 0 35px rgba(255,0,127,0.25),
              inset 0 0 15px rgba(255,0,127,0.08);
          }

          .team-card:hover .team-card-image {
            transform: scale(1.045);

            filter:
              brightness(1.08)
              saturate(1.12);

            box-shadow:
              0 25px 55px rgba(0,0,0,0.7),
              0 0 25px rgba(255,0,127,0.3);
          }

          .team-card:hover .team-card-glow {
            opacity: 0.75;
            transform: scale(1.15);
          }

        }


        /* --------------------------------------------------------- */
        /* TABLET / MOBILE                                            */
        /* --------------------------------------------------------- */

        @media (max-width: 640px) {

          .team-card {
            border-radius: 12px;
          }

          .team-card-image {
            box-shadow:
              0 10px 25px rgba(0,0,0,0.55);
          }

        }


        /* --------------------------------------------------------- */
        /* REDUCE MOTION                                              */
        /* --------------------------------------------------------- */

        @media (prefers-reduced-motion: reduce) {

          .animate-screen-shimmer {
            animation: none;
          }

          .team-card,
          .team-card-image,
          .team-card-glow,
          .team-card::before,
          .team-card::after {
            transition: none;
          }

        }

      `}</style>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-10 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
            onClick={() => setLightboxImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          
          <img 
            src={lightboxImage} 
            alt="Team Member" 
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
};

export default About;
