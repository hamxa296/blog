import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import newerBg from '@/assets/mobbg.webp';

export default function MobileHome() {
  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${newerBg})` }}
    >
      <div className="absolute inset-0 bg-black/25" aria-hidden />

      <div className="absolute bottom-24 left-1/2 z-30 -translate-x-1/2 flex flex-col gap-4 w-[280px]">
        <Link
          to="/guide"
          className="mb-16 group relative flex items-center justify-center gap-3 overflow-hidden rounded-full border border-[#fd4378]/40 bg-[#fd4378]/10 px-8 py-3.5 text-sm font-medium uppercase tracking-[0.2em] text-[#fff0f5] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:border-[#fd4378] hover:bg-[#fd4378]/20 w-full"
        >
          <span className="relative z-10 whitespace-nowrap">Freshman Guide</span>
          <ArrowRight className="relative z-10 size-4 transition-transform duration-300 group-hover:translate-x-1 text-[#fd4378]" />
        </Link>

        <Link
          to="/about"
          className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-full border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-medium uppercase tracking-[0.2em] text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:border-white/60 hover:bg-white/20 w-full"
        >
          <span
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(120deg, transparent 35%, rgba(255,255,255,0.4) 50%, transparent 65%)',
              backgroundSize: '250% 100%',
              animation: 'shimmer 2.8s linear infinite',
            }}
          />

          <span className="relative z-10 whitespace-nowrap">Explore</span>

          <ArrowRight className="relative z-10 size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>

        <Link
          to="/browse"
          className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-full border border-cyan-500/40 bg-cyan-500/10 px-8 py-3.5 text-sm font-medium uppercase tracking-[0.2em] text-cyan-50 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:border-cyan-400 hover:bg-cyan-500/20 w-full"
        >
          <span className="relative z-10 whitespace-nowrap">Read Stories</span>
          <ArrowRight className="relative z-10 size-4 transition-transform duration-300 group-hover:translate-x-1 text-cyan-400" />
        </Link>

        <style>{`
          @keyframes shimmer {
            from { background-position: 200% 0; }
            to { background-position: -200% 0; }
          }
        `}</style>
      </div>
    </div>
  );
}
