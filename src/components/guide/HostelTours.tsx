import React, { useState } from 'react';
import { dormMediaConfig, type DormMediaItem } from '../../data/freshmanGuideData';

type HostelKey = 'boys' | 'girls';

const hostelConfigKey = (hostel: HostelKey) =>
  hostel === 'boys' ? 'boysHostel' : 'girlsHostel';

const mediaSrc = (item: DormMediaItem) => {
  const folder = item.type === 'video' ? 'videos' : 'photos';
  return `/dorm-media/${folder}/${encodeURIComponent(item.filename)}`;
};

export const HostelTours: React.FC = () => {
  const [selectedHostel, setSelectedHostel] = useState<HostelKey | null>(null);
  const [mediaIndex, setMediaIndex] = useState(0);

  const openHostel = (hostel: HostelKey) => {
    setSelectedHostel(hostel);
    setMediaIndex(0);
  };

  const configKey = selectedHostel ? hostelConfigKey(selectedHostel) : null;
  const mediaList = configKey ? dormMediaConfig[configKey].media : [];
  const currentMedia = mediaList[mediaIndex];

  return (
    <div>
      <h3 className="text-xl sm:text-2xl font-semibold font-serif text-[#B3CFE5] mb-2">
        Room Tours & Videos
      </h3>
      <p className="text-sm text-[#B3CFE5] mb-6">
        Take a virtual tour of the hostel rooms and facilities to get a better idea of your new home.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          type="button"
          onClick={() => openHostel('boys')}
          className="bg-[#4A7FA7] hover:bg-[#1A3D63] cursor-pointer rounded-lg p-6 text-center transition-colors duration-200"
        >
          <div className="text-white text-lg font-semibold mb-2">Boys Hostel</div>
          <div className="text-blue-100 text-sm">Click to view room tour video</div>
        </button>

        <button
          type="button"
          onClick={() => openHostel('girls')}
          className="bg-[#1A3D63] hover:bg-[#4A7FA7] cursor-pointer rounded-lg p-6 text-center transition-colors duration-200"
        >
          <div className="text-white text-lg font-semibold mb-2">Girls Hostel</div>
          <div className="text-pink-100 text-sm">Click to view room tour video</div>
        </button>
      </div>

      {selectedHostel && currentMedia && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedHostel(null)}
        >
          <div
            className="bg-gradient-to-br from-[#0A1931] via-[#1A3D63] to-[#4A7FA7] rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-[#B3CFE5]/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-[#B3CFE5]/30 bg-gradient-to-r from-[#0A1931]/50 to-[#1A3D63]/50">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full shadow-lg ${
                    selectedHostel === 'boys' ? 'bg-[#4A7FA7]' : 'bg-[#B3CFE5]'
                  }`}
                />
                <h3 className="text-2xl font-bold text-white tracking-wide">
                  {selectedHostel === 'boys' ? 'Boys Hostel' : 'Girls Hostel'} Tour
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHostel(null)}
                className="w-10 h-10 rounded-full bg-[#0A1931]/50 hover:bg-[#4A7FA7]/20 flex items-center justify-center transition-all duration-300 border border-[#B3CFE5]/30"
                aria-label="Close tour"
              >
                <svg className="w-5 h-5 text-[#B3CFE5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8 text-center">
              {currentMedia.type === 'video' ? (
                <video
                  key={currentMedia.filename}
                  src={mediaSrc(currentMedia)}
                  controls
                  className="max-w-full max-h-[70vh] mx-auto rounded-lg shadow-lg bg-black"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={mediaSrc(currentMedia)}
                  alt={currentMedia.title}
                  className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg shadow-2xl"
                />
              )}

              <div className="mt-8 max-w-2xl mx-auto">
                <h4 className="text-2xl font-bold text-white mb-3">{currentMedia.title}</h4>
                <p className="text-[#B3CFE5] text-lg leading-relaxed">{currentMedia.description}</p>
              </div>

              {mediaList.length > 1 && (
                <div className="flex justify-center gap-4 mt-6">
                  <button
                    type="button"
                    disabled={mediaIndex === 0}
                    onClick={() => setMediaIndex((i) => i - 1)}
                    className="px-4 py-2 bg-[#4A7FA7] text-white rounded disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={mediaIndex >= mediaList.length - 1}
                    onClick={() => setMediaIndex((i) => i + 1)}
                    className="px-4 py-2 bg-[#4A7FA7] text-white rounded disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
