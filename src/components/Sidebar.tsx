import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: any; // Will be connected to auth user later
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, user, onLogout }) => {
  const [calendarDropdownOpen, setCalendarDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLinkClick = () => {
    onClose();
  };

  const handleLogoutClick = () => {
    onLogout();
    onClose();
    navigate('/');
  };

  const isAdmin = user?.isAdmin || false; // Standard admin check

  return (
    <>
      {/* Sidebar Panel */}
      <div
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#18181b] shadow-lg transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-bold text-white">Menu</h2>
          <button
            id="sidebar-close"
            onClick={onClose}
            className="text-white hover:text-[#4A7FA7] focus:outline-none cursor-pointer"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-6">
            {/* Main Navigation */}
            <div>
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Main</h3>
              <div className="space-y-2">
                <Link
                  to="/"
                  onClick={handleLinkClick}
                  className="flex items-center px-3 py-2 text-white hover:bg-white/20 hover:text-[#4A7FA7] rounded-lg transition duration-200"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Home
                </Link>
                <Link
                  to="/browse"
                  onClick={handleLinkClick}
                  className="flex items-center px-3 py-2 text-white hover:bg-white/20 hover:text-[#4A7FA7] rounded-lg transition duration-200"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                  All Posts
                </Link>
                <Link
                  to="/about"
                  onClick={handleLinkClick}
                  className="flex items-center px-3 py-2 text-white hover:bg-white/20 hover:text-[#4A7FA7] rounded-lg transition duration-200"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  About
                </Link>
                <Link
                  to="/contact"
                  onClick={handleLinkClick}
                  className="flex items-center px-3 py-2 text-white hover:bg-white/20 hover:text-[#4A7FA7] rounded-lg transition duration-200"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Contact
                </Link>
                <Link
                  to="/gallery"
                  onClick={handleLinkClick}
                  className="flex items-center px-3 py-2 text-white hover:bg-white/20 hover:text-[#4A7FA7] rounded-lg transition duration-200"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Gallery
                </Link>
                <Link
                  to="/map"
                  onClick={handleLinkClick}
                  className="flex items-center px-3 py-2 text-white hover:bg-white/20 hover:text-[#4A7FA7] rounded-lg transition duration-200"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-12v12.75m-3.75-6v6.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  Campus Map
                </Link>
              </div>
            </div>

            {/* Resources Section */}
            <div>
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Resources</h3>
              <div className="space-y-2">
                <Link
                  to="/guide"
                  onClick={handleLinkClick}
                  className="flex items-center px-3 py-2 text-white hover:bg-white/20 hover:text-[#4A7FA7] rounded-lg transition duration-200"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  Freshman Guide
                </Link>
                {/* Calendar Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setCalendarDropdownOpen(!calendarDropdownOpen)}
                    className="w-full flex items-center px-3 py-2 text-white hover:bg-white/20 hover:text-[#4A7FA7] rounded-lg transition duration-200 cursor-pointer"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Calendar
                    <svg
                      className={`w-4 h-4 ml-auto transition-transform duration-200 ${
                        calendarDropdownOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div
                    className={`${
                      calendarDropdownOpen ? 'block' : 'hidden'
                    } pl-8 mt-2 space-y-1`}
                  >
                    <Link
                      to="/calendar"
                      onClick={handleLinkClick}
                      className="block px-3 py-2 text-sm text-white/80 hover:bg-white/20 hover:text-[#4A7FA7] rounded-lg transition duration-200"
                    >
                      Calendar View
                    </Link>
                    <Link
                      to="/calendar#events"
                      onClick={handleLinkClick}
                      className="block px-3 py-2 text-sm text-white/80 hover:bg-white/20 hover:text-[#4A7FA7] rounded-lg transition duration-200"
                    >
                      View Events
                    </Link>
                    <Link
                      to="/calendar#submit"
                      onClick={handleLinkClick}
                      className="block px-3 py-2 text-sm text-white/80 hover:bg-white/20 hover:text-[#4A7FA7] rounded-lg transition duration-200"
                    >
                      Submit Event
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Management Section */}
            <div>
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">
                {user ? 'My Account' : 'Account'}
              </h3>
              <div className="space-y-2">
                {!user ? (
                  <>
                    <Link
                      to="/login"
                      onClick={handleLinkClick}
                      className="flex items-center px-3 py-2 text-white hover:bg-white/20 hover:text-[#4A7FA7] rounded-lg transition duration-200"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                        />
                      </svg>
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      onClick={handleLinkClick}
                      className="flex items-center px-3 py-2 text-white hover:bg-white/20 hover:text-[#4A7FA7] rounded-lg transition duration-200"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                        />
                      </svg>
                      Sign Up
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/profile"
                      onClick={handleLinkClick}
                      className="flex items-center px-3 py-2 text-white hover:bg-white/20 hover:text-[#4A7FA7] rounded-lg transition duration-200"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      My Profile
                    </Link>
                    <Link
                      to="/write"
                      onClick={handleLinkClick}
                      className="flex items-center px-3 py-2 text-white hover:bg-white/20 hover:text-[#4A7FA7] rounded-lg transition duration-200"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Write Post
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={handleLinkClick}
                        className="flex items-center px-3 py-2 text-white hover:bg-white/20 hover:text-[#4A7FA7] rounded-lg transition duration-200"
                      >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        🔐 Admin Portal
                      </Link>
                    )}
                    <button
                      onClick={handleLogoutClick}
                      className="w-full flex items-center px-3 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition duration-200 text-left cursor-pointer"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Overlay Backdrop */}
      {isOpen && (
        <div
          id="sidebar-overlay"
          onClick={onClose}
          className="fixed inset-0 bg-transparent z-40"
        />
      )}
    </>
  );
};
