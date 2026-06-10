import React from 'react';

export const Home: React.FC = () => {
  return (
    <main className="container mx-auto px-6 py-20 text-center text-white min-h-[calc(100vh-88px)] flex flex-col justify-center items-center">
      <div className="max-w-2xl bg-black/40 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
        <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
          Be Prepared For The<br />
          <span className="text-[#B3CFE5]">Valley & Beyond!</span>
        </h1>
        <p className="text-lg text-white/80 mb-8">
          Welcome to GIKI Chronicles. This page is ready for Developer A's landing page migration.
        </p>
      </div>
    </main>
  );
};
