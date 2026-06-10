import React from 'react';

export const About: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-88px)]">
      <div className="max-w-3xl w-full">
        {/* About Card */}
        <div
          className="w-full bg-[#627fa1] p-6 md:p-10 rounded-xl shadow-lg relative mx-auto"
          style={{
            backgroundImage: "url('https://www.transparenttextures.com/patterns/white-linen.png')",
            backgroundClip: 'border-box',
          }}
        >
          {/* Barcode Indicator */}
          <div className="absolute top-5 right-8 text-xs tracking-widest text-white/80 select-none">
            ▌3|||| |||||| |8▐
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold m-0 uppercase text-white font-serif tracking-wide">
              ABOUT <span className="font-handwriting text-5xl md:text-6xl font-normal normal-case italic">Us</span>
            </h1>
          </div>

          {/* Image */}
          <div className="rounded-2xl overflow-hidden my-6 shadow-md hover-lift">
            <img src="/about.jpg" alt="GIKI Campus View" className="w-full block object-cover max-h-[400px]" />
          </div>

          {/* Text Content */}
          <div className="text-sm md:text-base leading-relaxed text-[#1a1a1a] text-justify font-sans select-text">
            <p className="font-medium bg-white/10 p-4 rounded-xl border border-white/20">
              GIKI Chronicles is where campus life comes alive. From pulling all-nighters in labs to celebrating big
              wins at events, we're capturing the moments that make GIKI unforgettable. Think of it as a living diary
              of our struggles, laughs, and milestones — told by students, for students. Every story matters, every
              voice deserves to be heard, and together we're building a community that celebrates what makes GIKI,
              GIKI.
            </p>
          </div>

          {/* Social Button Link */}
          <div className="mt-6 text-center md:text-left">
            <a
              href="https://www.instagram.com/giki.chronicles?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#70c0e8] to-[#364574] text-white font-semibold no-underline hover:opacity-90 transition-opacity shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3h10z" />
                <path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0 2.2A2.8 2.8 0 1112 15.8 2.8 2.8 0 0112 9.2z" />
                <circle cx="17.5" cy="6.5" r="1.3" />
              </svg>
              <span>GIKI Chronicles</span>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
};
