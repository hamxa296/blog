import React from 'react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onSidebarToggle: () => void;
  user: any; // Will be connected to auth user later
}

export const Navbar: React.FC<NavbarProps> = ({ onSidebarToggle, user }) => {
  return (
    <header className="bg-[#1A3D63] shadow-sm sticky top-0 z-40">
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
            className="relative px-6 py-2.5 text-[#4A7FA7] font-semibold border-2 border-[#4A7FA7] rounded-full overflow-hidden hover:text-white transition-all duration-300 before:absolute before:top-0 before:left-0 before:w-0 before:h-full before:bg-[#4A7FA7] before:rounded-full before:transition-all before:duration-300 hover:before:w-full"
          >
            <span className="relative z-10">Gallery</span>
          </Link>

          <Link
            to="/guide"
            className="relative px-6 py-2.5 text-[#4A7FA7] font-semibold border-2 border-[#4A7FA7] rounded-full overflow-hidden hover:text-white transition-all duration-300 before:absolute before:top-0 before:left-0 before:w-0 before:h-full before:bg-[#4A7FA7] before:rounded-full before:transition-all before:duration-300 hover:before:w-full"
          >
            <span className="relative z-10">Freshmen Guide</span>
          </Link>

          <Link
            to="/calendar"
            className="relative px-6 py-2.5 text-[#4A7FA7] font-semibold border-2 border-[#4A7FA7] rounded-full overflow-hidden hover:text-white transition-all duration-300 before:absolute before:top-0 before:left-0 before:w-0 before:h-full before:bg-[#4A7FA7] before:rounded-full before:transition-all before:duration-300 hover:before:w-full"
          >
            <span className="relative z-10">Calendar</span>
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
