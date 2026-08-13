import React, { useState } from 'react';
import { societiesData } from './guideData';
import type { SocietyCategory } from '../../types/guide';

interface SocietiesTabsProps {
  categories?: Record<string, SocietyCategory>;
}

export const SocietiesTabs: React.FC<SocietiesTabsProps> = ({ categories = societiesData }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const societyKeys = Object.keys(categories);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <nav className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        {societyKeys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelectedCategory(key)}
            className={`px-3 sm:px-6 py-2 rounded-full font-semibold transition-all duration-200 text-sm sm:text-base border ${
              selectedCategory === key
                ? 'bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-500/20'
                : 'text-muted-foreground bg-card border-border hover:bg-muted hover:border-pink-500/30'
            }`}
          >
            <span>{categories[key].title}</span>
          </button>
        ))}
      </nav>

      <div className="flex-grow">
        {selectedCategory ? (
          categories[selectedCategory].societies.map((item, index) => (
            <div
              key={`${selectedCategory}-${index}`}
              className="p-3 sm:p-4 bg-card rounded-lg mb-3 sm:mb-4 shadow-sm border border-border hover:border-pink-500/30 transition-colors"
            >
              <h4 className="text-lg sm:text-xl font-semibold text-foreground">{item.name}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))
        ) : (
          <div className="text-center p-6 sm:p-8 text-muted-foreground bg-card rounded-lg border border-border">
            <p className="text-base sm:text-lg">Please select a society category to view the details.</p>
          </div>
        )}
      </div>
    </div>
  );
};
