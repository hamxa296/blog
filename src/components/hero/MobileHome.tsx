import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import newerBg from '@/assets/randombg2.png';

import img1 from '@/assets/1.png';
import img2 from '@/assets/2.png';
import img3 from '@/assets/3.png';
import img4 from '@/assets/4.png';
import img5 from '@/assets/5.png';
import img6 from '@/assets/6.png';
import img7 from '@/assets/7.png';
import img8 from '@/assets/8.png';
import img9 from '@/assets/img9.jpg';
import img10 from '@/assets/img10.jpg';
import img11 from '@/assets/11.jpeg';
import img12 from '@/assets/12.jpeg';
import img13 from '@/assets/13.jpeg';
import img14 from '@/assets/14.png';
import img15 from '@/assets/15.jpg';

const IMAGES = [
  img1,
  img2,
  img3,
  img4,
  img5,
  img6,
  img7,
  img8,
  img9,
  img10,
  img11,
  img12,
  img13,
  img14,
  img15,
];

const PATH =
  'M60,180 C180,40 320,320 480,160 S780,40 920,200 S1080,360 1240,180';

export default function MobileHome() {
  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${newerBg})` }}
    >
      <div className="absolute inset-0 bg-black/25" aria-hidden />

      <div className="absolute inset-x-0 top-[12%] z-10 flex flex-col items-center px-4 text-center pointer-events-none">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          
        </h1>
        <p className="mt-2 max-w-xs text-sm text-white/70">
          
        </p>
      </div>

      

      <div className="absolute bottom-38 left-1/2 z-30 -translate-x-1/2">
      <Link
        to="/browse"
        className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-medium uppercase tracking-[0.2em] text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:border-white/60 hover:bg-white/20"
      >
        {/* Shimmer */}
        <span
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(120deg, transparent 35%, rgba(255,255,255,0.4) 50%, transparent 65%)",
            backgroundSize: "250% 100%",
            animation: "shimmer 2.8s linear infinite",
          }}
        />

        <span className="relative z-10">Explore</span>

        <ArrowRight className="relative z-10 size-4 transition-transform duration-300 group-hover:translate-x-1" />

        <style>{`
          @keyframes shimmer {
            from { background-position: 200% 0; }
            to { background-position: -200% 0; }
          }
        `}</style>
      </Link>
      </div>
    </div>
  );
}
