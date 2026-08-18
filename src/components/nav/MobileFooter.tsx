import React from 'react';
import { Link } from 'react-router-dom';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16" height="16"
    viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const links = [
  { label: 'Home',    to: '/' },
  { label: 'Blog',    to: '/browse' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Guide',   to: '/guide' },
  { label: 'Map',     to: '/map' },
  { label: 'About',   to: '/about' },
];

export const MobileFooter: React.FC = () => {
  return (
    <footer className="md:hidden w-full border-t border-white/[0.07] bg-[#0b0b0b] pb-32 pt-8 px-6">
      {/* Brand row */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-white font-black tracking-[0.18em] uppercase text-[13px]">
          GIKI<span className="text-[#fd4378]"> CHRONICLES</span>
        </span>
        {/* Instagram pill */}
        <a
          href="https://www.instagram.com/giki.chronicles?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-white/50 hover:text-white border border-white/10 rounded-full px-3 py-1.5 text-[11px] font-medium tracking-wide transition-colors"
        >
          <InstagramIcon className="w-3 h-3" />
          @gikichronicles
        </a>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06] mb-6" />

      {/* Nav links — 2 column grid */}
      <nav className="grid grid-cols-2 gap-x-4 gap-y-3 mb-8">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="text-white/40 text-[13px] hover:text-white/80 transition-colors"
          >
            {l.label}
          </Link>
        ))}
        <a
          href="https://giki.edu.pk"
          target="_blank"
          rel="noreferrer"
          className="text-white/40 text-[13px] hover:text-white/80 transition-colors"
        >
          giki.edu.pk ↗
        </a>
      </nav>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/20 font-mono tracking-wider uppercase">
          © {new Date().getFullYear()} All rights reserved
        </span>
        <span className="text-[10px] text-white/20 tracking-wide">
          Built by students
        </span>
      </div>
    </footer>
  );
};

export default MobileFooter;
