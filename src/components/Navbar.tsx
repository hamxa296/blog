import React from 'react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onSidebarToggle: () => void;
  user: any; // Will be connected to auth user later
}

export const Navbar: React.FC<NavbarProps> = ({ onSidebarToggle, user }) => {
  return (
    <header className="bg-[#18181b] shadow-sm sticky top-0 z-40">
      <nav className="container mx-auto px-6 py-4 flex items-center">
        {/* Left: Hamburger Button + Brand Logo */}
        <div className="flex items-center space-x-4">
          <button
            id="sidebar-toggle"
            onClick={onSidebarToggle}
            className="text-white hover:text-[#4A7FA7] focus:outline-none cursor-pointer"
            aria-label="Toggle Navigation Sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>

          <Link to="/" className="flex flex-col items-center">
            <img src="/logo.png" alt="GIKI Chronicles Logo" className="h-16 w-auto" />
            <span className="text-lg font-bold text-white mt-1">GIKI Chronicles</span>
          </Link>
        </div>

        {/* Right: Desktop Navigation Items */}
        <div className="hidden md:flex items-center space-x-6 ml-auto">
          <Link to="/about" className="text-white hover:text-[#4A7FA7] transition duration-300">
            About
          </Link>

          <Link
            to="/gallery"
            className="px-6 py-2.5 border-2 border-[#4A7FA7] text-[#4A7FA7] font-semibold rounded-full bg-transparent hover:bg-[#4A7FA7] hover:text-white transition-all duration-300"
          >
            <span>Gallery</span>
          </Link>

          <Link
            to="/guide"
            className="px-6 py-2.5 border-2 border-[#4A7FA7] text-[#4A7FA7] font-semibold rounded-full bg-transparent hover:bg-[#4A7FA7] hover:text-white transition-all duration-300"
          >
            <span>Freshmen Guide</span>
          </Link>

          <Link
            to="/calendar"
            className="px-6 py-2.5 border-2 border-[#4A7FA7] text-[#4A7FA7] font-semibold rounded-full bg-transparent hover:bg-[#4A7FA7] hover:text-white transition-all duration-300"
          >
            <span>Calendar</span>
          </Link>

          {/* Conditional Guest/User links */}
          {!user ? (
            <div id="guest-nav" className="flex items-center space-x-6">
              <Link to="/login" className="text-white hover:text-[#4A7FA7] transition duration-300">
                Login
              </Link>
            </div>
          ) : (
            <div id="user-nav" className="flex items-center space-x-6">
              <Link to="/profile" className="text-white hover:text-[#4A7FA7] transition duration-300">
                My Profile
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};
