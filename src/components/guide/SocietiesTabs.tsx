import React, { useState } from 'react';
import { societiesData } from './guideData';

const societyKeys = Object.keys(societiesData);

export const SocietiesTabs: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div>
      <h3 className="text-xl sm:text-2xl font-semibold font-serif text-[#B3CFE5] mb-2">
        Campus Societies & Teams
      </h3>
      <p className="text-sm text-[#B3CFE5] mb-6">
        Explore GIKI&apos;s academic societies, cultural clubs, social initiatives, and competitive engineering teams.
      </p>

      <nav className="flex flex-wrap gap-2 mb-6">
        {societyKeys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelectedCategory(key)}
            className={`px-3 sm:px-6 py-2 rounded-full font-semibold transition-colors duration-200 text-sm sm:text-base ${
              selectedCategory === key
                ? 'bg-[#4A7FA7] text-white shadow-md'
                : 'text-[#B3CFE5] bg-[#1A3D63] hover:bg-[#4A7FA7]/30'
            }`}
          >
            {societiesData[key].title}
          </button>
        ))}
      </nav>

      <div>
        {selectedCategory ? (
          societiesData[selectedCategory].societies.map((item, index) => (
            <div
              key={`${selectedCategory}-${index}`}
              className="p-3 sm:p-4 bg-[#0A1931] rounded-lg mb-3 sm:mb-4 shadow-sm border border-[#4A7FA7]/40"
            >
              <h4 className="text-lg sm:text-xl font-semibold text-[#F6FAFD]">{item.name}</h4>
              <p className="mt-1 text-sm text-[#B3CFE5]">{item.description}</p>
            </div>
          ))
        ) : (
          <div className="text-center p-6 sm:p-8 text-[#B3CFE5] bg-[#0A1931] rounded-lg border border-[#4A7FA7]/40">
            <p className="text-base sm:text-lg">Please select a society category to view the details.</p>
          </div>
        )}
      </div>
    </div>
  );
};
