import React, { useEffect, useRef, useState } from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import mapbg from '../assets/homepc.webp';
import { MobileFooter } from '../components/nav/MobileFooter';

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
  dining: '#FF6347',
};

const LOCATIONS: Record<
  string,
  { title: string; description: string }
> = {
  'hostels-11-12': {
    title: 'Hostels 11 & 12',
    description:
      'Two of the newest boys’ hostels at GIKI, primarily accommodating undergraduate freshmen. They feature spacious rooms, community washrooms, and common rooms.',
  },

  'senior-hostels': {
    title: 'Senior Hostels',
    description:
      'Residential blocks designed for senior undergraduate students. These older hostels are usually allotted to undergraduates from 2nd year onwards.',
  },

  'new-girls-hostel': {
    title: 'New Girls Hostel (H13)',
    description:
      'A modern residential facility for female students with state-of-the-art amenities and comfortable living spaces.',
  },

  'central-library': {
    title: 'Central Library',
    description:
      'The main library of GIKI housing extensive collections of books, journals, and digital resources. Featuring quiet study rooms.',
  },

  'new-academic': {
    title: 'New Academic Block',
    description:
      'A modern academic building with contemporary classrooms, state-of-the-art laboratories, and faculty offices equipped with the latest educational technology.',
  },

  fbs: {
    title: 'Faculty of Basic Sciences (FBS)',
    description:
      'Houses the departments of Mathematics, Physics, and Chemistry. Includes specialized laboratories and research facilities.',
  },

  fcse: {
    title: 'Faculty of Computer Science & Engineering (FCSE)',
    description:
      'A state-of-the-art facility for computer science programs, featuring computer labs and networking facilities.',
  },

  fmce: {
    title: 'Faculty of Materials & Chemical Engineering (FMCE)',
    description:
      'An advanced facility with modern laboratories, workshops, and testing facilities for hands-on learning.',
  },

  fme: {
    title: 'Faculty of Mechanical Engineering (FME)',
    description:
      'A specialized facility for mechanical engineering programs, featuring advanced laboratories and testing facilities.',
  },

  'giki-main': {
    title: 'AHA Auditorium',
    description:
      'The central auditorium of the university, hosting major events.',
  },

  oric: {
    title: 'ORIC',
    description:
      'The Office of Research, Innovation and Commercialization, facilitating research projects and industry collaborations.',
  },

  brabers: {
    title: 'Brabers Building',
    description:
      'A multi-purpose academic building housing various departments of the MGS Faculty and exam halls.',
  },

  'medical-center': {
    title: 'Medical Center',
    description:
      'A comprehensive on-campus healthcare facility providing medical services to students, faculty, and staff.',
  },

  'faculty-club': {
    title: 'Faculty Club',
    description:
      'A recreational and dining facility for faculty members and staff, providing restaurant services and meeting rooms.',
  },

  'central-mess': {
    title: 'Central Mess',
    description:
      'The main dining facility for students, offering breakfast, lunch, and dinner in spacious dining halls.',
  },

  tuck: {
    title: 'Tuck Shop',
    description:
      'Campus convenience stores and restaurants providing snacks, beverages, and daily essentials. A popular gathering spot.',
  },

  'residential-villas': {
    title: 'C-type Residential Villas',
    description:
      'Premium housing facilities for faculty, offering comfortable living spaces.',
  },

  'residential-area': {
    title: 'Residential Area',
    description:
      'A comprehensive residential complex for faculty and staff families, featuring various housing units and parks.',
  },

  helipad: {
    title: 'Helipad',
    description:
      'A helicopter landing facility used for official visits.',
  },

  'sports-complex': {
    title: 'Sports Complex',
    description:
      'A multi-sport facility featuring indoor courts, a gymnasium, and a tennis court.',
  },

  'main-ground': {
    title: 'Main Ground',
    description:
      'A large outdoor sports ground used for cricket, football, and athletics, and for hosting major university events.',
  },

  'student-mosque': {
    title: 'Student Mosque',
    description:
      'A centrally located prayer facility for the student community.',
  },

  'tuck-mosque': {
    title: 'Tuck Mosque',
    description:
      'A prayer facility located near the Tuck. This was the first building ever constructed in GIKI.',
  },

  'residential-mosque': {
    title: 'Residential Area Mosque',
    description:
      'A community mosque serving the residential area for faculty and staff families.',
  },

  'hbl-bank': {
    title: 'HBL Bank',
    description:
      'An on-campus banking facility providing financial services to the university community.',
  },

  'giki-school': {
    title: 'GIKI School and College',
    description:
      'An educational institution affiliated with GIKI, providing quality education at school and college levels.',
  },

  'admin-block': {
    title: 'Admin Block',
    description:
      'The central administrative building housing key offices such as student services and admissions.',
  },

  logik: {
    title: 'LOGIK',
    description: "GIKI's very own clock tower and innovation hub.",
  },

  'giki-guest-house': {
    title: 'GIKI Guest House',
    description:
      'Accommodation for visiting scholars and official guests, featuring comfortable rooms and conference facilities.',
  },
};

export const CampusMap: React.FC = () => {
  // ==========================================================
  // DATA
  // ==========================================================

  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);

  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [hoverPinId, setHoverPinId] = useState<string | null>(null);

  // ==========================================================
  // DESKTOP / TABLET STATE
  // ==========================================================

  const desktopContainerRef = useRef<HTMLDivElement>(null);

  const [desktopScale, setDesktopScale] = useState(1);

  const [desktopTranslate, setDesktopTranslate] = useState({
    x: 0,
    y: 0,
  });

  const desktopDragging = useRef(false);

  const desktopDragStart = useRef({
    x: 0,
    y: 0,
  });

  const desktopTranslateStart = useRef({
    x: 0,
    y: 0,
  });

  // ==========================================================
  // MOBILE STATE
  // ==========================================================

  const mobileContainerRef = useRef<HTMLDivElement>(null);

  const [mobileScale, setMobileScale] = useState(1);

  const [mobileTranslate, setMobileTranslate] = useState({
    x: 0,
    y: 0,
  });

  const mobileDragging = useRef(false);

  const mobileDragStart = useRef({
    x: 0,
    y: 0,
  });

  const mobileTranslateStart = useRef({
    x: 0,
    y: 0,
  });

  const mobileTouchStartDist = useRef<number | null>(null);

  const mobileTouchStartScale = useRef(1);

  // ==========================================================
  // LOAD PINS
  // ==========================================================

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

  // ==========================================================
  // DESKTOP MIN SCALE
  // ==========================================================

  const getDesktopMinScale = () => {
    if (!desktopContainerRef.current) return 1;

    const { width, height } =
      desktopContainerRef.current.getBoundingClientRect();

    return Math.min(width / 1400, height / 933);
  };

  // ==========================================================
  // MOBILE MIN SCALE
  // ==========================================================

  const getMobileMinScale = () => {
    if (!mobileContainerRef.current) return 1;

    const { width, height } =
      mobileContainerRef.current.getBoundingClientRect();

    return Math.min(width / 1400, height / 933);
  };

  // ==========================================================
  // DESKTOP RESET
  // ==========================================================

  const resetDesktopView = () => {
    if (!desktopContainerRef.current) return;

    const { width, height } =
      desktopContainerRef.current.getBoundingClientRect();

    const minScale = Math.min(
      width / 1400,
      height / 933
    );

    setDesktopScale(minScale);

    setDesktopTranslate({
      x: (width - 1400 * minScale) / 2,
      y: (height - 933 * minScale) / 2,
    });
  };

  // ==========================================================
  // MOBILE RESET
  // ==========================================================

  const resetMobileView = () => {
    if (!mobileContainerRef.current) return;

    const { width, height } =
      mobileContainerRef.current.getBoundingClientRect();

    const minScale = Math.min(
      width / 1400,
      height / 933
    );

    setMobileScale(minScale);

    setMobileTranslate({
      x: (width - 1400 * minScale) / 2,
      y: (height - 933 * minScale) / 2,
    });
  };

  // ==========================================================
  // INITIAL RESET
  // ==========================================================

  useEffect(() => {
    if (loading) return;

    const frame = requestAnimationFrame(() => {
      resetDesktopView();
      resetMobileView();
    });

    return () => cancelAnimationFrame(frame);
  }, [loading]);

  // ==========================================================
  // RESIZE OBSERVER
  // ==========================================================

  useEffect(() => {
    const desktopElement = desktopContainerRef.current;
    const mobileElement = mobileContainerRef.current;

    const observer = new ResizeObserver(() => {
      resetDesktopView();
      resetMobileView();
    });

    if (desktopElement) {
      observer.observe(desktopElement);
    }

    if (mobileElement) {
      observer.observe(mobileElement);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // ==========================================================
  // DESKTOP ZOOM IN
  // ==========================================================

  const desktopZoomIn = () => {
    setDesktopScale((prev) =>
      Math.min(5, prev * 1.3)
    );
  };

  // ==========================================================
  // DESKTOP ZOOM OUT
  // ==========================================================

  const desktopZoomOut = () => {
    const minScale = getDesktopMinScale();

    setDesktopScale((prev) =>
      Math.max(minScale, prev / 1.3)
    );
  };

  // ==========================================================
  // MOBILE ZOOM IN
  // ==========================================================

  const mobileZoomIn = () => {
    setMobileScale((prev) =>
      Math.min(5, prev * 1.3)
    );
  };

  // ==========================================================
  // MOBILE ZOOM OUT
  // ==========================================================

  const mobileZoomOut = () => {
    const minScale = getMobileMinScale();

    setMobileScale((prev) =>
      Math.max(minScale, prev / 1.3)
    );
  };

  // ==========================================================
  // DESKTOP MOUSE DOWN
  // ==========================================================

  const handleDesktopMouseDown = (
    e: React.MouseEvent
  ) => {
    if (
      (e.target as HTMLElement).closest('.pin-element') ||
      (e.target as HTMLElement).closest('.map-control')
    ) {
      return;
    }

    desktopDragging.current = true;

    desktopDragStart.current = {
      x: e.clientX,
      y: e.clientY,
    };

    desktopTranslateStart.current = {
      ...desktopTranslate,
    };
  };

  // ==========================================================
  // DESKTOP MOUSE MOVE
  // ==========================================================

  const handleDesktopMouseMove = (
    e: React.MouseEvent
  ) => {
    if (!desktopDragging.current) return;

    const dx =
      e.clientX - desktopDragStart.current.x;

    const dy =
      e.clientY - desktopDragStart.current.y;

    setDesktopTranslate({
      x: desktopTranslateStart.current.x + dx,
      y: desktopTranslateStart.current.y + dy,
    });
  };

  // ==========================================================
  // DESKTOP MOUSE UP
  // ==========================================================

  const handleDesktopMouseUp = () => {
    desktopDragging.current = false;
  };

  // ==========================================================
  // DESKTOP WHEEL
  // ==========================================================

  const handleDesktopWheel = (
    e: React.WheelEvent
  ) => {
    e.preventDefault();

    const minScale = getDesktopMinScale();

    const zoomFactor =
      e.deltaY > 0 ? 0.9 : 1.1;

    setDesktopScale((prev) =>
      Math.max(
        minScale,
        Math.min(5, prev * zoomFactor)
      )
    );
  };

  // ==========================================================
  // MOBILE TOUCH START
  // ==========================================================

  const handleMobileTouchStart = (
    e: React.TouchEvent
  ) => {
    if (e.touches.length === 2) {
      const [t1, t2] = [
        e.touches[0],
        e.touches[1],
      ];

      const distance = Math.hypot(
        t1.clientX - t2.clientX,
        t1.clientY - t2.clientY
      );

      mobileTouchStartDist.current = distance;

      mobileTouchStartScale.current =
        mobileScale;

      mobileDragging.current = false;

      return;
    }

    if (e.touches.length === 1) {
      if (
        (e.target as HTMLElement).closest(
          '.pin-element'
        ) ||
        (e.target as HTMLElement).closest(
          '.map-control'
        )
      ) {
        return;
      }

      mobileDragging.current = true;

      mobileDragStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };

      mobileTranslateStart.current = {
        ...mobileTranslate,
      };
    }
  };

  // ==========================================================
  // MOBILE TOUCH MOVE
  // ==========================================================

  const handleMobileTouchMove = (
    e: React.TouchEvent
  ) => {
    // Pinch zoom
    if (
      e.touches.length === 2 &&
      mobileTouchStartDist.current !== null
    ) {
      e.preventDefault();

      const [t1, t2] = [
        e.touches[0],
        e.touches[1],
      ];

      const distance = Math.hypot(
        t1.clientX - t2.clientX,
        t1.clientY - t2.clientY
      );

      const minScale = getMobileMinScale();

      const newScale = Math.max(
        minScale,
        Math.min(
          5,
          mobileTouchStartScale.current *
            (distance / mobileTouchStartDist.current)
        )
      );

      setMobileScale(newScale);

      return;
    }

    // Single finger pan
    if (
      e.touches.length === 1 &&
      mobileDragging.current
    ) {
      const dx =
        e.touches[0].clientX -
        mobileDragStart.current.x;

      const dy =
        e.touches[0].clientY -
        mobileDragStart.current.y;

      setMobileTranslate({
        x: mobileTranslateStart.current.x + dx,
        y: mobileTranslateStart.current.y + dy,
      });
    }
  };

  // ==========================================================
  // MOBILE TOUCH END
  // ==========================================================

  const handleMobileTouchEnd = () => {
    mobileDragging.current = false;
    mobileTouchStartDist.current = null;
  };

  // ==========================================================
  // ACTIVE LOCATION
  // ==========================================================

  const activeLocation = activePinId
    ? LOCATIONS[activePinId]
    : null;

  // ==========================================================
  // PIN RENDERER
  // ==========================================================

  const renderPins = () => {
    return pins.map((pin) => {
      const color =
        PIN_COLORS[pin.type] || '#FFFFFF';

      const isHovered =
        hoverPinId === pin.id;

      return (
        <div
          key={pin.id}
          className="
            pin-element
            absolute
            cursor-pointer
            z-10
            transition-transform
            duration-200
          "
          style={{
            left: pin.left,
            top: pin.top,
            transform: `
              translate(-50%, -100%)
              scale(${isHovered ? 1.25 : 1})
            `,
          }}
          onMouseEnter={() =>
            setHoverPinId(pin.id)
          }
          onMouseLeave={() =>
            setHoverPinId(null)
          }
          onClick={() =>
            setActivePinId(pin.id)
          }
        >
          {/* Tooltip */}

          {isHovered && (
            <div
              className="
                absolute
                bottom-full
                mb-2
                left-1/2
                -translate-x-1/2
                bg-gray-900/95
                text-white
                px-3
                py-1.5
                rounded-lg
                text-xs
                font-semibold
                whitespace-nowrap
                shadow-xl
                border
                border-white/10
                z-50
                pointer-events-none
              "
            >
              {pin.label}
            </div>
          )}

          {/* Pin */}

          <svg
            width="32"
            height="40"
            viewBox="0 0 32 40"
            className="drop-shadow-lg"
            style={{
              filter:
                `drop-shadow(0 4px 6px ${color}50)`,
            }}
          >
            <path
              d="
                M16 0
                C8.268 0 2 6.268 2 14
                C2 22.5 14.053 38.11 14.553 38.71
                A1.5 1.5 0 0 0 17.447 38.71
                C17.947 38.11 30 22.5 30 14
                C30 6.268 23.732 0 16 0Z
              "
              fill={color}
              stroke="#FFFFFF"
              strokeWidth="2"
            />

            <circle
              cx="16"
              cy="14"
              r="5"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      );
    });
  };

  // ==========================================================
  // RETURN
  // ==========================================================

  return (
    <main
      className="
        w-full
        min-h-screen
        bg-[#08080a]
        flex
        items-center
        justify-center
        overflow-hidden
      "
      style={{
        backgroundImage: `url(${mapbg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >

      {/* ======================================================
          DESKTOP / TABLET VERSION
      ====================================================== */}

      <div
        className="
          hidden
          md:flex
          w-full
          min-h-screen
          flex-col
          items-center
          justify-center
          p-4
          md:p-8
          gap-8
        "
      >

        {/* ======================================================
            DESKTOP / TABLET HEADING
        ====================================================== */}

        <div className="text-center max-w-3xl">
          <h1
            className="
              text-4xl
              md:text-5xl
              lg:text-6xl
              font-bold
              text-white
              tracking-tight
            "
          >
            GIKI Campus Map
          </h1>

          <p
            className="
              mt-3
              text-sm
              md:text-base
              text-white/60
            "
          >
            Explore the campus, buildings, facilities, and student spaces.
          </p>
        </div>

        {/* Tablet Body */}

        <div
          className="
            relative
            w-full
            max-w-[1200px]
            aspect-[16/10]
            bg-[#151518]
            rounded-[28px]
            md:rounded-[40px]
            p-[8px]
            md:p-[14px]
            border
            border-white/10
            shadow-[0_30px_100px_rgba(0,0,0,0.75)]
          "
        >

          {/* Tablet Highlight */}

          <div
            className="
              absolute
              inset-0
              rounded-[28px]
              md:rounded-[40px]
              pointer-events-none
              border
              border-white/5
            "
          />

          {/* Tablet Screen */}

          <div
            className="
              relative
              w-full
              h-full
              overflow-hidden
              rounded-[21px]
              md:rounded-[30px]
              bg-black
              shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]
            "
          >

            {/* Camera */}

            <div
              className="
                absolute
                top-2
                left-1/2
                -translate-x-1/2
                z-[300]
                pointer-events-none
              "
            >
              <div
                className="
                  w-[7px]
                  h-[7px]
                  rounded-full
                  bg-black
                  border
                  border-white/10
                "
              />
            </div>

            {/* Desktop Map Container */}

            <div
              ref={desktopContainerRef}
              className="
                absolute
                inset-0
                overflow-hidden
                cursor-grab
                active:cursor-grabbing
                select-none
                touch-none
              "
              onMouseDown={handleDesktopMouseDown}
              onMouseMove={handleDesktopMouseMove}
              onMouseUp={handleDesktopMouseUp}
              onMouseLeave={handleDesktopMouseUp}
              onWheel={handleDesktopWheel}
            >

              {/* Loading */}

              {loading && (
                <div
                  className="
                    absolute
                    inset-0
                    flex
                    items-center
                    justify-center
                    bg-gray-900/90
                    z-[250]
                  "
                >
                  <div className="text-center">
                    <div
                      className="
                        animate-spin
                        rounded-full
                        h-14
                        w-14
                        border-b-2
                        border-white
                        mx-auto
                        mb-4
                      "
                    />

                    <p className="text-white text-lg">
                      Loading Campus Map...
                    </p>
                  </div>
                </div>
              )}

              {/* Desktop Map */}

              <div
                className="
                  absolute
                  origin-top-left
                "
                style={{
                  transform: `
                    translate(${desktopTranslate.x}px, ${desktopTranslate.y}px)
                    scale(${desktopScale})
                  `,
                  width: '1400px',
                  height: '933px',
                }}
              >
                <div
                  className="
                    absolute
                    inset-0
                    w-full
                    h-full
                    bg-cover
                    bg-center
                    bg-no-repeat
                  "
                  style={{
                    backgroundImage:
                      `url('/map.webp')`,
                  }}
                />

                {renderPins()}
              </div>

              {/* Desktop Controls */}

              <div
                className="
                  map-control
                  absolute
                  top-5
                  right-5
                  z-[200]
                "
              >
                <div
                  className="
                    flex
                    gap-2
                    rounded-full
                    bg-black/45
                    backdrop-blur-xl
                    border
                    border-white/10
                    p-2
                    shadow-2xl
                  "
                >
                  <button
                    onClick={desktopZoomIn}
                    className="
                      w-10
                      h-10
                      rounded-full
                      hover:bg-white/10
                      transition-all
                      duration-200
                      active:scale-95
                      flex
                      items-center
                      justify-center
                    "
                    title="Zoom In"
                  >
                    <Plus
                      size={18}
                      className="text-white"
                    />
                  </button>

                  <button
                    onClick={desktopZoomOut}
                    className="
                      w-10
                      h-10
                      rounded-full
                      hover:bg-white/10
                      transition-all
                      duration-200
                      active:scale-95
                      flex
                      items-center
                      justify-center
                    "
                    title="Zoom Out"
                  >
                    <Minus
                      size={18}
                      className="text-white"
                    />
                  </button>

                  <button
                    onClick={resetDesktopView}
                    className="
                      w-10
                      h-10
                      rounded-full
                      hover:bg-white/10
                      transition-all
                      duration-200
                      active:scale-95
                      flex
                      items-center
                      justify-center
                    "
                    title="Reset View"
                  >
                    <RotateCcw
                      size={18}
                      className="text-white"
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Info Drawer */}

            {activeLocation && (
              <div
                className="
                  absolute
                  bottom-5
                  left-5
                  right-5
                  md:left-6
                  md:right-auto
                  md:w-96
                  bg-gray-900/95
                  border
                  border-white/15
                  backdrop-blur-md
                  p-6
                  rounded-2xl
                  shadow-2xl
                  z-[220]
                  text-white
                "
              >
                <button
                  onClick={() =>
                    setActivePinId(null)
                  }
                  className="
                    absolute
                    top-4
                    right-4
                    text-white/60
                    hover:text-white
                    text-lg
                  "
                >
                  ✕
                </button>

                <h3
                  className="
                    text-xl
                    font-bold
                    text-[#B3CFE5]
                    mb-2
                    pr-6
                  "
                >
                  {activeLocation.title}
                </h3>

                <p
                  className="
                    text-sm
                    text-gray-300
                    leading-relaxed
                  "
                >
                  {activeLocation.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================
          MOBILE PHONE VERSION
      ====================================================== */}

      <div
        className="
          flex
          md:hidden
          w-full
          min-h-screen
          flex-col
          items-center
          justify-center
          px-3
          py-8
          gap-6
        "
      >

        {/* ======================================================
            MOBILE HEADING
        ====================================================== */}

        <div className="text-center px-4">
          <h1
            className="
              text-3xl
              font-bold
              text-white
              tracking-tight
            "
          >
            GIKI Campus Map
          </h1>

          <p
            className="
              mt-2
              text-xs
              text-white/60
            "
          >
            Explore the campus and find important locations.
          </p>
        </div>

        {/* Phone Body */}

        <div
          className="
            relative
            w-full
            max-w-[430px]
            h-[calc(100vh-180px)]
            max-h-[850px]
            bg-[#111113]
            rounded-[42px]
            p-[8px]
            border
            border-white/10
            shadow-[0_25px_80px_rgba(0,0,0,0.8)]
          "
        >

          {/* Phone Highlight */}

          <div
            className="
              absolute
              inset-0
              rounded-[42px]
              pointer-events-none
              border
              border-white/5
            "
          />

          {/* Phone Screen */}

          <div
            className="
              relative
              w-full
              h-full
              overflow-hidden
              rounded-[35px]
              bg-black
            "
          >

            {/* Dynamic Island */}

            <div
              className="
                absolute
                top-3
                left-1/2
                -translate-x-1/2
                z-[300]
                w-[90px]
                h-[24px]
                rounded-full
                bg-black
                border
                border-white/5
                shadow-lg
                pointer-events-none
              "
            >
              <div
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  w-[6px]
                  h-[6px]
                  rounded-full
                  bg-[#111]
                  border
                  border-white/10
                "
              />
            </div>

            {/* Mobile Map Container */}

            <div
              ref={mobileContainerRef}
              className="
                absolute
                inset-0
                overflow-hidden
                cursor-grab
                active:cursor-grabbing
                select-none
                touch-none
              "
              onTouchStart={handleMobileTouchStart}
              onTouchMove={handleMobileTouchMove}
              onTouchEnd={handleMobileTouchEnd}
            >

              {/* Loading */}

              {loading && (
                <div
                  className="
                    absolute
                    inset-0
                    flex
                    items-center
                    justify-center
                    bg-gray-900/90
                    z-[250]
                  "
                >
                  <div className="text-center">
                    <div
                      className="
                        animate-spin
                        rounded-full
                        h-12
                        w-12
                        border-b-2
                        border-white
                        mx-auto
                        mb-4
                      "
                    />

                    <p className="text-white text-sm">
                      Loading Campus Map...
                    </p>
                  </div>
                </div>
              )}

              {/* Mobile Map */}

              <div
                className="
                  absolute
                  origin-top-left
                "
                style={{
                  transform: `
                    translate(${mobileTranslate.x}px, ${mobileTranslate.y}px)
                    scale(${mobileScale})
                  `,
                  width: '1400px',
                  height: '933px',
                }}
              >
                <div
                  className="
                    absolute
                    inset-0
                    w-full
                    h-full
                    bg-cover
                    bg-center
                    bg-no-repeat
                  "
                  style={{
                    backgroundImage:
                      `url('/map.webp')`,
                  }}
                />

                {renderPins()}
              </div>

              {/* Mobile Controls */}

              <div
                className="
                  map-control
                  absolute
                  top-14
                  right-4
                  z-[200]
                "
              >
                <div
                  className="
                    flex
                    flex-col
                    gap-1.5
                    rounded-2xl
                    bg-black/45
                    backdrop-blur-xl
                    border
                    border-white/10
                    p-1.5
                    shadow-2xl
                  "
                >
                  <button
                    onClick={mobileZoomIn}
                    className="
                      w-9
                      h-9
                      rounded-xl
                      hover:bg-white/10
                      active:scale-95
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <Plus
                      size={17}
                      className="text-white"
                    />
                  </button>

                  <button
                    onClick={mobileZoomOut}
                    className="
                      w-9
                      h-9
                      rounded-xl
                      hover:bg-white/10
                      active:scale-95
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <Minus
                      size={17}
                      className="text-white"
                    />
                  </button>

                  <button
                    onClick={resetMobileView}
                    className="
                      w-9
                      h-9
                      rounded-xl
                      hover:bg-white/10
                      active:scale-95
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <RotateCcw
                      size={16}
                      className="text-white"
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Info Card */}

            {activeLocation && (
              <div
                className="
                  absolute
                  bottom-4
                  left-4
                  right-4
                  bg-gray-900/95
                  border
                  border-white/15
                  backdrop-blur-xl
                  p-5
                  rounded-2xl
                  shadow-2xl
                  z-[220]
                  text-white
                "
              >
                <button
                  onClick={() =>
                    setActivePinId(null)
                  }
                  className="
                    absolute
                    top-3
                    right-3
                    w-8
                    h-8
                    rounded-full
                    bg-white/5
                    text-white/60
                    hover:text-white
                    flex
                    items-center
                    justify-center
                  "
                >
                  ✕
                </button>

                <h3
                  className="
                    text-lg
                    font-bold
                    text-[#B3CFE5]
                    mb-2
                    pr-8
                  "
                >
                  {activeLocation.title}
                </h3>

                <p
                  className="
                    text-xs
                    text-gray-300
                    leading-relaxed
                  "
                >
                  {activeLocation.description}
                </p>
              </div>
            )}
          </div>

          {/* Phone Bottom Gesture Bar */}

          <div
            className="
              absolute
              bottom-[-2px]
              left-1/2
              -translate-x-1/2
              w-20
              h-[3px]
              rounded-full
              bg-white/15
            "
          />
        </div>
      </div>
    </main>
    <MobileFooter />
  );
};

