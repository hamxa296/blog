import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, MessageSquare, Mail, Code } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#08080a] border-t border-white/10 text-white/70 py-24 px-4 sm:px-6 lg:px-8 mt-auto relative z-30">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
        
        {/* Column 1: Branding */}
        <div className="flex flex-col items-start col-span-1 md:col-span-1">
          <span className="text-2xl font-black tracking-widest uppercase text-white mb-4">
            GIKI CHRONICLES
          </span>
          <p className="text-sm text-white/50 leading-relaxed mb-6">
            Every story has a beginning. Every achievement deserves to be remembered. Documenting the GIKI experience.
          </p>
          <span className="text-xs text-white/40 font-mono tracking-widest uppercase mt-auto">
            © {new Date().getFullYear()} All Rights Reserved.
          </span>
        </div>

        {/* Column 2: Navigation */}
        <div className="flex flex-col gap-4">
          <h3 className="text-white font-semibold tracking-wider text-sm mb-2">EXPLORE</h3>
          <Link to="/" className="text-sm hover:text-white hover:translate-x-1 transition-all">Home</Link>
          <Link to="/browse" className="text-sm hover:text-white hover:translate-x-1 transition-all">Student Blogs</Link>
          <Link to="/gallery" className="text-sm hover:text-white hover:translate-x-1 transition-all">Photo Gallery</Link>
          <Link to="/guide" className="text-sm hover:text-white hover:translate-x-1 transition-all">Freshman Guide</Link>
        </div>

        {/* Column 3: Quicklinks / Resources */}
        <div className="flex flex-col gap-4">
          <h3 className="text-white font-semibold tracking-wider text-sm mb-2">RESOURCES</h3>
          <Link to="/about" className="text-sm hover:text-white hover:translate-x-1 transition-all">About Us</Link>
          <Link to="/contact" className="text-sm hover:text-white hover:translate-x-1 transition-all">Contact / Join</Link>
          <Link to="/campus-map" className="text-sm hover:text-white hover:translate-x-1 transition-all">Campus Map</Link>
          <a href="https://giki.edu.pk" target="_blank" rel="noreferrer" className="text-sm hover:text-white hover:translate-x-1 transition-all">Official GIKI Site</a>
        </div>

        {/* Column 4: Connect */}
        <div className="flex flex-col gap-4">
          <h3 className="text-white font-semibold tracking-wider text-sm mb-2">CONNECT</h3>
          <div className="flex items-center gap-5 mt-2">
            <a href="#" className="p-3 bg-white/5 rounded-full hover:bg-white/10 hover:text-white hover:scale-110 transition-all border border-white/10">
              <Camera className="w-5 h-5" />
            </a>
            <a href="#" className="p-3 bg-white/5 rounded-full hover:bg-white/10 hover:text-white hover:scale-110 transition-all border border-white/10">
              <MessageSquare className="w-5 h-5" />
            </a>
            <a href="#" className="p-3 bg-white/5 rounded-full hover:bg-white/10 hover:text-white hover:scale-110 transition-all border border-white/10">
              <Mail className="w-5 h-5" />
            </a>
            <a href="#" className="p-3 bg-white/5 rounded-full hover:bg-white/10 hover:text-white hover:scale-110 transition-all border border-white/10">
              <Code className="w-5 h-5" />
            </a>
          </div>
          <p className="text-xs text-white/40 mt-4 leading-relaxed">
            Built by students, for students.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
