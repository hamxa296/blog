import React from 'react';
import randomBg from '../assets/randombg.webp';
import aboutBg from '../assets/about_bg.webp';
import meetTheTeamBg from '../assets/team 3.webp';
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
      {/* Main Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 sm:py-12 my-auto relative z-10 w-full max-w-7xl mx-auto">

        {/* Ambient Glow */}
        <div className="absolute w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] bg-[#ff007f]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center w-full relative z-10">

          {/* ========================================================= */}
          {/* LEFT: ABOUT POSTER INSIDE SCREEN FRAME */}
          {/* ========================================================= */}

          <div className="flex items-center justify-center w-full">

            {/* Outer screen frame */}
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
                transition-all
                duration-500
                hover:shadow-[0_35px_100px_rgba(255,0,127,0.25)]
              "
            >

              {/* Inner Screen */}
              <div
                className="
                  relative
                  overflow-hidden
                  rounded-[22px]
                  sm:rounded-[28px]
                  bg-black
                  border
                  border-white/10
                "
              >

                {/* About Image */}
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

                {/* Moving Glass Reflection */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">

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

                {/* Subtle Glass Overlay */}
                <div
                  className="
                    absolute
                    inset-0
                    pointer-events-none
                    bg-gradient-to-br
                    from-white/[0.06]
                    via-transparent
                    to-transparent
                  "
                />

              </div>

              {/* Bottom Screen Glow */}
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
            {/* CONNECTED TEAM CARDS                                  */}
            {/* ===================================================== */}

            <div
              className="
                team-network
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

              {/* Connection System */}
              <div className="team-connection">

                {/* Main energy line */}
                <div className="connection-line" />

                {/* Moving energy particles */}
                <div className="connection-pulse pulse-one" />
                <div className="connection-pulse pulse-two" />

              </div>


              {/* ================================================= */}
              {/* HAMZA */}
              {/* ================================================= */}

              <div className="team-card team-card-left group">

                <img
                  src={hamzaBg}
                  alt="Hamza"
                  className="team-card-image"
                />

                <div className="team-card-glow" />

              </div>


              {/* ================================================= */}
              {/* ZARA */}
              {/* ================================================= */}

              <div className="team-card team-card-center group">

                <img
                  src={zaraBg}
                  alt="Zara"
                  className="team-card-image"
                />

                <div className="team-card-glow" />

              </div>


              {/* ================================================= */}
              {/* HARIS */}
              {/* ================================================= */}

              <div className="team-card team-card-right group">

                <img
                  src={harisBg}
                  alt="Haris"
                  className="team-card-image"
                />

                <div className="team-card-glow" />

              </div>

            </div>

          </div>

        </div>

      </main>


      {/* ============================================================= */}
      {/* FOOTER                                                        */}
      {/* ============================================================= */}

      <div className="hidden md:block w-full">
        <Footer />
      </div>


      {/* ============================================================= */}
      {/* CUSTOM ANIMATIONS + STYLES                                   */}
      {/* ============================================================= */}

      <style>{`

        /* ========================================================= */
        /* SCREEN SHIMMER                                            */
        /* ========================================================= */

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


        /* ========================================================= */
        /* TEAM CARD BASE                                            */
        /* ========================================================= */

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

          z-index: 2;

        }


        /* ========================================================= */
        /* CARD BACK GLOW                                            */
        /* ========================================================= */

        .team-card::before {

          content: "";

          position: absolute;

          inset: 0;

          z-index: -1;

          border-radius: inherit;

          background: rgba(255, 0, 127, 0.35);

          filter: blur(18px);

          opacity: 0;

          transform: scale(0.95);

          transition:
            opacity 400ms ease,
            transform 400ms ease;

        }


        /* ========================================================= */
        /* CARD BORDER                                               */
        /* ========================================================= */

        .team-card::after {

          content: "";

          position: absolute;

          inset: -1px;

          border-radius: inherit;

          border: 1px solid rgba(255, 255, 255, 0.12);

          pointer-events: none;

          transition:
            border-color 350ms ease,
            box-shadow 350ms ease;

        }


        /* ========================================================= */
        /* CARD IMAGE                                                 */
        /* ========================================================= */

        .team-card-image {

          position: relative;

          z-index: 1;

          width: 100%;

          height: 100%;

          object-fit: cover;

          border-radius: inherit;

          display: block;

          box-shadow:
            0 15px 35px rgba(0, 0, 0, 0.55);

          transition:
            transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1),
            filter 400ms ease,
            box-shadow 400ms ease;

        }


        /* ========================================================= */
        /* CARD FLOOR GLOW                                           */
        /* ========================================================= */

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


        /* ========================================================= */
        /* TEAM NETWORK                                               */
        /* ========================================================= */

        .team-network {

          position: relative;

        }


        /* ========================================================= */
        /* CONNECTION LINE                                            */
        /* ========================================================= */

        .team-connection {

          position: absolute;

          left: 15%;

          right: 15%;

          top: 50%;

          height: 2px;

          transform: translateY(-50%);

          z-index: 1;

          pointer-events: none;

        }


        .connection-line {

          position: absolute;

          inset: 0;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255, 0, 127, 0.25),
              rgba(255, 0, 127, 0.75),
              rgba(255, 0, 127, 0.25),
              transparent
            );

          box-shadow:
            0 0 8px rgba(255, 0, 127, 0.35),
            0 0 20px rgba(255, 0, 127, 0.15);

          opacity: 0.55;

          transition:
            opacity 400ms ease,
            box-shadow 400ms ease;

        }


        /* ========================================================= */
        /* ENERGY PARTICLES                                          */
        /* ========================================================= */

        .connection-pulse {

          position: absolute;

          top: 50%;

          width: 7px;

          height: 7px;

          margin-top: -3.5px;

          border-radius: 50%;

          background: #ff007f;

          box-shadow:
            0 0 6px #ff007f,
            0 0 15px rgba(255, 0, 127, 0.9),
            0 0 30px rgba(255, 0, 127, 0.5);

          opacity: 0;

        }


        .pulse-one {

          animation:
            teamEnergyFlow 3.5s linear infinite;

        }


        .pulse-two {

          animation:
            teamEnergyFlow 3.5s linear infinite 1.75s;

        }


        @keyframes teamEnergyFlow {

          0% {

            left: 0%;

            opacity: 0;

          }

          8% {

            opacity: 1;

          }

          45% {

            opacity: 1;

          }

          92% {

            opacity: 1;

          }

          100% {

            left: 100%;

            opacity: 0;

          }

        }


        /* ========================================================= */
        /* DESKTOP CARD HOVER                                        */
        /* ========================================================= */

        @media (hover: hover) and (pointer: fine) {


          /* Main hovered card */

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

            border-color:
              rgba(255, 0, 127, 0.65);

            box-shadow:
              0 0 15px rgba(255, 0, 127, 0.45),
              0 0 35px rgba(255, 0, 127, 0.25),
              inset 0 0 15px rgba(255, 0, 127, 0.08);

          }


          .team-card:hover .team-card-image {

            transform: scale(1.045);

            filter:
              brightness(1.08)
              saturate(1.12);

            box-shadow:
              0 25px 55px rgba(0, 0, 0, 0.7),
              0 0 25px rgba(255, 0, 127, 0.3);

          }


          .team-card:hover .team-card-glow {

            opacity: 0.75;

            transform: scale(1.15);

          }


          /* ===================================================== */
          /* CONNECTION LIGHT UP                                  */
          /* ===================================================== */

          .team-network:has(.team-card:hover)
          .connection-line {

            opacity: 1;

            box-shadow:
              0 0 10px rgba(255, 0, 127, 0.7),
              0 0 30px rgba(255, 0, 127, 0.4),
              0 0 55px rgba(255, 0, 127, 0.15);

          }


          .team-network:has(.team-card:hover)
          .connection-pulse {

            animation-duration: 2s;

          }


          /* ===================================================== */
          /* HAMZA → NEIGHBORS                                    */
          /* ===================================================== */

          .team-network:has(.team-card-left:hover)
          .team-card-center {

            transform:
              perspective(900px)
              translateY(-7px)
              translateX(3px)
              scale(1.015);

          }


          .team-network:has(.team-card-left:hover)
          .team-card-right {

            transform:
              perspective(900px)
              translateY(-3px)
              translateX(6px)
              scale(1.01);

          }


          /* ===================================================== */
          /* ZARA → NEIGHBORS                                     */
          /* ===================================================== */

          .team-network:has(.team-card-center:hover)
          .team-card-left {

            transform:
              perspective(900px)
              translateY(-6px)
              translateX(-4px)
              scale(1.01);

          }


          .team-network:has(.team-card-center:hover)
          .team-card-right {

            transform:
              perspective(900px)
              translateY(-6px)
              translateX(4px)
              scale(1.01);

          }


          /* ===================================================== */
          /* HARIS → NEIGHBORS                                    */
          /* ===================================================== */

          .team-network:has(.team-card-right:hover)
          .team-card-center {

            transform:
              perspective(900px)
              translateY(-7px)
              translateX(-3px)
              scale(1.015);

          }


          .team-network:has(.team-card-right:hover)
          .team-card-left {

            transform:
              perspective(900px)
              translateY(-3px)
              translateX(-6px)
              scale(1.01);

          }

        }


        /* ========================================================= */
        /* MOBILE                                                    */
        /* ========================================================= */

        @media (max-width: 640px) {

          .team-card {

            border-radius: 12px;

          }


          .team-card-image {

            box-shadow:
              0 10px 25px rgba(0, 0, 0, 0.55);

          }


          .team-connection {

            left: 12%;

            right: 12%;

            opacity: 0.7;

          }


          .connection-line {

            box-shadow:
              0 0 6px rgba(255, 0, 127, 0.3);

          }


          .connection-pulse {

            width: 5px;

            height: 5px;

            margin-top: -2.5px;

          }

        }


        /* ========================================================= */
        /* REDUCED MOTION                                            */
        /* ========================================================= */

        @media (prefers-reduced-motion: reduce) {

          .animate-screen-shimmer,
          .connection-pulse {

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

    </div>
  );
};

export default About;
