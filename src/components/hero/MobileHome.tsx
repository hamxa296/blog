import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import MarqueeAlongSvgPath from '@/components/ui/marquee-along-svg-path';
import newerBg from '@/assets/newerbg.png';

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
          GIKI Chronicles
        </h1>
        <p className="mt-2 max-w-xs text-sm text-white/70">
          Every story has a beginning. Every achievement deserves to be remembered.
        </p>
      </div>

      <MarqueeAlongSvgPath
        className="absolute inset-0 z-[5] h-full w-full"
        path={PATH}
        viewBox="0 0 1300 400"
        baseVelocity={4}
        repeat={2}
        slowdownOnHover
        draggable
        grabCursor
        responsive
        enableRollingZIndex
      >
        {IMAGES.map((src, i) => (
          <div
            key={i}
            className="h-28 w-20 overflow-hidden rounded-xl border border-white/20 bg-white/5 shadow-2xl"
          >
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </MarqueeAlongSvgPath>

      <div className="absolute bottom-28 left-1/2 z-30 -translate-x-1/2">
        <Link
          to="/browse"
          className="group inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-medium uppercase tracking-[0.2em] text-white backdrop-blur-md transition-colors hover:border-white/60 hover:bg-white/20"
        >
          Explore
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
