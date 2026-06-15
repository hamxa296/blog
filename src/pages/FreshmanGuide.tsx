import React, { useState } from 'react';
import { PackingChecklist } from '../components/guide/PackingChecklist';
import { SocietiesTabs } from '../components/guide/SocietiesTabs';
import { HostelTours } from '../components/guide/HostelTours';

type GuideTab = 'packing' | 'societies' | 'hostel';

const tabs: { id: GuideTab; label: string; icon: string }[] = [
  { id: 'packing', label: 'Packing List', icon: '🎒' },
  { id: 'societies', label: 'Societies', icon: '🎯' },
  { id: 'hostel', label: 'Hostel Tours', icon: '🏠' },
];

export const FreshmanGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GuideTab>('packing');

  return (
    <main className="min-h-[calc(100vh-88px)] text-white relative z-10 pt-8 pb-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-[#0A1931] to-[#1A3D63] text-white p-4 sm:p-8 mb-6 rounded-xl shadow-lg text-center border border-[#B3CFE5]/30">
          <h1 className="text-2xl sm:text-4xl font-bold font-serif handwriting-title">
            GIKI Freshman Guide
          </h1>
          <p className="mt-2 text-base sm:text-lg text-[#B3CFE5]">
            Your ultimate resource for a smooth start at GIKI.
          </p>
        </div>

        <div className="chronicle-container p-4 sm:p-8 lg:p-10 rounded-xl sm:rounded-2xl shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#B3CFE5] handwriting-title">
              Welcome to GIKI!
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#B3CFE5] max-w-2xl mx-auto">
              Use the tabs below to explore packing checklists, campus societies, and virtual hostel room tours.
            </p>
          </div>

          <nav className="flex flex-wrap gap-2 justify-center mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 sm:px-6 py-2.5 rounded-full font-semibold transition-colors text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'bg-[#4A7FA7] text-white shadow-md'
                    : 'text-[#B3CFE5] bg-[#0A1931] hover:bg-[#4A7FA7]/30 border border-[#4A7FA7]/30'
                }`}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="guide-section-panel p-4 sm:p-8 rounded-xl">
            {activeTab === 'packing' && <PackingChecklist />}
            {activeTab === 'societies' && <SocietiesTabs />}
            {activeTab === 'hostel' && <HostelTours />}
          </div>
        </div>
      </div>
    </main>
  );
};
