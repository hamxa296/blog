import React, { useState } from 'react';
import { dormMediaConfig, getDormMediaUrl, type DormHostelKey } from './guideData';

type SelectedHostel = 'boys' | 'girls' | null;

const hostelConfigKey = (hostel: 'boys' | 'girls'): DormHostelKey =>
  hostel === 'boys' ? 'boysHostel' : 'girlsHostel';

export const HostelTours: React.FC = () => {
  const [selectedHostel, setSelectedHostel] = useState<SelectedHostel>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [mediaError, setMediaError] = useState(false);

  const openHostel = (hostel: 'boys' | 'girls') => {
    setSelectedHostel(hostel);
    setCurrentMediaIndex(0);
    setMediaError(false);
  };

  const closeViewer = () => {
    setSelectedHostel(null);
    setCurrentMediaIndex(0);
    setMediaError(false);
  };

  const currentMedia =
    selectedHostel &&
    dormMediaConfig[hostelConfigKey(selectedHostel)].media[currentMediaIndex];

  const mediaList = selectedHostel
    ? dormMediaConfig[hostelConfigKey(selectedHostel)].media
    : [];

  const nextMedia = () => {
    if (currentMediaIndex < mediaList.length - 1) {
      setCurrentMediaIndex((index) => index + 1);
      setMediaError(false);
    }
  };

  const previousMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex((index) => index - 1);
      setMediaError(false);
    }
  };

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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#0A1931] via-[#1A3D63] to-[#4A7FA7] rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-[#B3CFE5]/30">
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
                onClick={closeViewer}
                className="group relative w-10 h-10 rounded-full bg-[#0A1931]/50 hover:bg-[#4A7FA7]/20 flex items-center justify-center transition-all duration-300 border border-[#B3CFE5]/30 hover:border-[#B3CFE5]/60"
                aria-label="Close hostel tour"
              >
                <svg
                  className="w-5 h-5 text-[#B3CFE5] group-hover:text-white transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="relative">
              <div className="p-8">
                <div className="text-center">
                  {!mediaError ? (
                    currentMedia.type === 'image' ? (
                      <img
                        src={getDormMediaUrl(currentMedia)}
                        alt={currentMedia.title}
                        className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg shadow-2xl"
                        onError={() => setMediaError(true)}
                      />
                    ) : (
                      <video
                        key={getDormMediaUrl(currentMedia)}
                        src={getDormMediaUrl(currentMedia)}
                        controls
                        playsInline
                        preload="metadata"
                        className="max-w-full max-h-[70vh] mx-auto rounded-lg shadow-lg"
                        onError={() => setMediaError(true)}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )
                  ) : (
                    <div className="p-6 bg-gradient-to-r from-[#0A1931] to-[#1A3D63] text-[#B3CFE5] rounded-lg shadow-lg">
                      <svg
                        className="w-8 h-8 mx-auto mb-2 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                      {currentMedia.type === 'image' ? 'Image' : 'Video'} not available
                    </div>
                  )}

                  <div className="mt-8 max-w-2xl mx-auto">
                    <h4 className="text-2xl font-bold text-white mb-3 tracking-wide">{currentMedia.title}</h4>
                    <p className="text-[#B3CFE5] text-lg leading-relaxed">{currentMedia.description}</p>
                  </div>
                </div>
              </div>

              {mediaList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={previousMedia}
                    className="absolute left-6 top-1/2 -translate-y-1/2 group"
                    disabled={currentMediaIndex === 0}
                    aria-label="Previous media"
                  >
                    <div className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all duration-300 border border-[#B3CFE5]/30 hover:border-[#B3CFE5]/60 shadow-lg disabled:opacity-40">
                      <svg
                        className="w-6 h-6 text-[#B3CFE5] group-hover:scale-110 transition-transform duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={nextMedia}
                    className="absolute right-6 top-1/2 -translate-y-1/2 group"
                    disabled={currentMediaIndex === mediaList.length - 1}
                    aria-label="Next media"
                  >
                    <div className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all duration-300 border border-[#B3CFE5]/30 hover:border-[#B3CFE5]/60 shadow-lg disabled:opacity-40">
                      <svg
                        className="w-6 h-6 text-[#B3CFE5] group-hover:scale-110 transition-transform duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
