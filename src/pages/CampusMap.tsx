import React, { useState, useEffect, useRef } from 'react';

interface Pin {
  id: string;
  label: string;
  left: string;
  top: string;
  type: string;
}

const PIN_COLORS: Record<string, string> = {
  hostel: '#FF1493',
  academic: '#4169E1',
  admin: '#FF8C00',
  medical: '#DC143C',
  residential: '#32CD32',
  facility: '#8A2BE2',
  special: '#00CED1',
  dining: '#FF6347'
};

const LOCATIONS: Record<string, { title: string; description: string }> = {
  'hostels-11-12': {
    title: 'Hostels 11 & 12',
    description: 'Two of the newest boys’ hostels at GIKI, primarily accommodating undergraduate freshmen. They feature spacious rooms, community washrooms, and common rooms.'
  },
  'senior-hostels': {
    title: 'Senior Hostels',
    description: 'Residential blocks designed for senior undergraduate students. These older hostels are usually allotted to undergraduates from 2nd year onwards.'
  },
  'new-girls-hostel': {
    title: 'New Girls Hostel (H13)',
    description: 'A modern residential facility for female students with state-of-the-art amenities and comfortable living spaces.'
  },
  'central-library': {
    title: 'Central Library',
    description: 'The main library of GIKI housing extensive collections of books, journals, and digital resources. Featuring quiet study rooms.'
  },
  'new-academic': {
    title: 'New Academic Block',
    description: 'A modern academic building with contemporary classrooms, state-of-the-art laboratories, and faculty offices equipped with the latest educational technology.'
  },
  'fbs': {
    title: 'Faculty of Basic Sciences (FBS)',
    description: 'Houses the departments of Mathematics, Physics, and Chemistry. Includes specialized laboratories and research facilities.'
  },
  'fcse': {
    title: 'Faculty of Computer Science & Engineering (FCSE)',
    description: 'A state-of-the-art facility for computer science programs, featuring computer labs and networking facilities.'
  },
  'fmce': {
    title: 'Faculty of Materials & Chemical Engineering (FMCE)',
    description: 'An advanced facility with modern laboratories, workshops, and testing facilities for hands-on learning.'
  },
  'fme': {
    title: 'Faculty of Mechanical Engineering (FME)',
    description: 'A specialized facility for mechanical engineering programs, featuring advanced laboratories and testing facilities.'
  },
  'giki-main': {
    title: 'AHA Auditorium',
    description: 'The central auditorium of the university, hosting major events.'
  },
  'oric': {
    title: 'ORIC',
    description: 'The Office of Research, Innovation and Commercialization, facilitating research projects and industry collaborations.'
  },
  'brabers': {
    title: 'Brabers Building',
    description: 'A multi-purpose academic building housing various departments of the MGS Faculty and exam halls.'
  },
  'medical-center': {
    title: 'Medical Center',
    description: 'A comprehensive on-campus healthcare facility providing medical services to students, faculty, and staff.'
  },
  'faculty-club': {
    title: 'Faculty Club',
    description: 'A recreational and dining facility for faculty members and staff, providing restaurant services and meeting rooms.'
  },
  'central-mess': {
    title: 'Central Mess',
    description: 'The main dining facility for students, offering breakfast, lunch, and dinner in spacious dining halls.'
  },
  'tuck': {
    title: 'Tuck Shop',
    description: 'Campus convenience stores and restaurants providing snacks, beverages, and daily essentials. A popular gathering spot.'
  },
  'residential-villas': {
    title: 'C-type Residential Villas',
    description: 'Premium housing facilities for faculty, offering comfortable living spaces.'
  },
  'residential-area': {
    title: 'Residential Area',
    description: 'A comprehensive residential complex for faculty and staff families, featuring various housing units and parks.'
  },
  'helipad': {
    title: 'Helipad',
    description: 'A helicopter landing facility used for official visits.'
  },
  'sports-complex': {
    title: 'Sports Complex',
    description: 'A multi-sport facility featuring indoor courts, a gymnasium, and a tennis court.'
  },
  'main-ground': {
    title: 'Main Ground',
    description: 'A large outdoor sports ground used for cricket, football, and athletics, and for hosting major university events.'
  },
  'student-mosque': {
    title: 'Student Mosque',
    description: 'A centrally located prayer facility for the student community.'
  },
  'tuck-mosque': {
    title: 'Tuck Mosque',
    description: 'A prayer facility located near the Tuck. This was the first building ever constructed in GIKI.'
  },
  'residential-mosque': {
    title: 'Residential Area Mosque',
    description: 'A community mosque serving the residential area for faculty and staff families.'
  },
  'hbl-bank': {
    title: 'HBL Bank',
    description: 'An on-campus banking facility providing financial services to the university community.'
  },
  'giki-school': {
    title: 'GIKI School and College',
    description: 'An educational institution affiliated with GIKI, providing quality education at school and college levels.'
  },
  'admin-block': {
    title: 'Admin Block',
    description: 'The central administrative building housing key offices such as student services and admissions.'
  },
  'logik': {
    title: 'LOGIK',
    description: "GIKI's very own clock tower and innovation hub."
  },
  'giki-guest-house': {
    title: 'GIKI Guest House',
    description: 'Accommodation for visiting scholars and official guests, featuring comfortable rooms and conference facilities.'
  }
};

export const CampusMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [hoverPinId, setHoverPinId] = useState<string | null>(null);

  // Dragging state
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });

  // Touch gesture state
  const touchStartDist = useRef<number | null>(null);
  const touchStartScale = useRef<number>(1);

  useEffect(() => {
    fetch('/MAPPOSITIONS.JSON')
      .then((res) => res.json())
      .then((data) => {
        setPins(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load map positions:', err);
        setLoading(false);
      });
  }, []);

  const getMinScale = () => {
    if (!containerRef.current) return 1;
    const { width, height } = containerRef.current.getBoundingClientRect();
    return Math.min(width / 1400, height / 933);
  };

  const resetView = () => {
    const minScale = getMinScale();
    setScale(minScale);
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setTranslate({
        x: (width - 1400 * minScale) / 2,
        y: (height - 933 * minScale) / 2
      });
    }
  };

  useEffect(() => {
    if (!loading) {
      resetView();
    }
    window.addEventListener('resize', resetView);
    return () => window.removeEventListener('resize', resetView);
  }, [loading]);

  // Zoom helpers
  const zoomIn = () => {
    setScale((prev) => Math.min(5, prev * 1.3));
  };

  const zoomOut = () => {
    const minScale = getMinScale();
    setScale((prev) => Math.max(minScale, prev / 1.3));
  };

  // Drag handler start
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.pin-element')) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    translateStart.current = { ...translate };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setTranslate({
      x: translateStart.current.x + dx,
      y: translateStart.current.y + dy
    });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const minScale = getMinScale();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.max(minScale, Math.min(5, prev * zoomFactor)));
  };

  // Touch handlers for mobile pan & pinch-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchStartDist.current = dist;
      touchStartScale.current = scale;
    } else if (e.touches.length === 1) {
      if ((e.target as HTMLElement).closest('.pin-element')) return;
      isDragging.current = true;
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      translateStart.current = { ...translate };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist.current !== null) {
      e.preventDefault();
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const minScale = getMinScale();
      const newScale = Math.max(minScale, Math.min(5, touchStartScale.current * (dist / touchStartDist.current)));
      setScale(newScale);
    } else if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      setTranslate({
        x: translateStart.current.x + dx,
        y: translateStart.current.y + dy
      });
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    touchStartDist.current = null;
  };

  const activeLocation = activePinId ? LOCATIONS[activePinId] : null;

  return (
    <main className="w-screen h-screen bg-[#0A1931] overflow-hidden select-none relative touch-none">
      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-3 z-50">
        <button
          onClick={zoomIn}
          className="w-12 h-12 bg-white/95 hover:bg-white rounded-full flex items-center justify-center text-2xl font-bold text-gray-800 shadow-xl transition active:scale-95"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          className="w-12 h-12 bg-white/95 hover:bg-white rounded-full flex items-center justify-center text-2xl font-bold text-gray-800 shadow-xl transition active:scale-95"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={resetView}
          className="w-12 h-12 bg-white/95 hover:bg-white rounded-full flex items-center justify-center text-lg text-gray-800 shadow-xl transition active:scale-95"
          title="Reset View"
        >
          🔄
        </button>
      </div>

      {/* Map Container Viewport */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white text-lg">Loading Campus Map...</p>
            </div>
          </div>
        )}

        <div
          className="relative origin-top-left transition-transform duration-75"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            width: '1400px',
            height: '933px'
          }}
        >
          {/* Background Map Image */}
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('/map.png')` }}
          />

          {/* Dynamic Pin Markers */}
          {pins.map((pin) => {
            const color = PIN_COLORS[pin.type] || '#FFFFFF';
            const isHovered = hoverPinId === pin.id;
            return (
              <div
                key={pin.id}
                className="pin-element absolute cursor-pointer z-10 transition-transform duration-200"
                style={{
                  left: pin.left,
                  top: pin.top,
                  transform: `translate(-50%, -100%) scale(${isHovered ? 1.25 : 1})`
                }}
                onMouseEnter={() => setHoverPinId(pin.id)}
                onMouseLeave={() => setHoverPinId(null)}
                onClick={() => setActivePinId(pin.id)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-xl border border-white/10 z-50">
                    {pin.label}
                  </div>
                )}
                {/* Custom SVG Pin */}
                <svg
                  width="32"
                  height="40"
                  viewBox="0 0 32 40"
                  className="drop-shadow-lg"
                  style={{ filter: `drop-shadow(0 4px 6px ${color}50)` }}
                >
                  <path
                    d="M16 0C8.268 0 2 6.268 2 14c0 8.5 12.053 24.11 12.553 24.71a1.5 1.5 0 0 0 2.894 0C17.947 38.11 30 22.5 30 14c0-7.732-6.268-14-14-14z"
                    fill={color}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <circle cx="16" cy="14" r="5" fill="#FFFFFF" />
                </svg>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Slide-in Drawer */}
      {activeLocation && (
        <div className="absolute bottom-6 left-6 right-6 md:left-8 md:right-auto md:w-96 bg-gray-900/95 border border-white/15 backdrop-blur-md p-6 rounded-2xl shadow-2xl z-[100] animate-slide-up text-white">
          <button
            onClick={() => setActivePinId(null)}
            className="absolute top-4 right-4 text-white/60 hover:text-white text-lg"
          >
            ✕
          </button>
          <h3 className="text-xl font-bold text-[#B3CFE5] mb-2">{activeLocation.title}</h3>
          <p className="text-sm text-gray-300 leading-relaxed">{activeLocation.description}</p>
        </div>
      )}
    </main>
  );
};
