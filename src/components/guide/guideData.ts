export const essentialItems = [
  'Bedsheets',
  'Pillow Cover',
  'Blanket/Chadar',
  'Toiletries',
  'Towels',
  'Water Bottle',
  'Bug Spray',
  'Umbrella',
  'Cleaning Cloth',
  'Laptop',
  'Phone Charger',
  'Backpack (for classes)',
  'Handcarry suitcase (for weekend travel, depends)',
  'Laundry Basket',
  'Nail cutter',
  'Stapler',
  'Hangers',
  'Tissues',
  'Snacks',
  'Prayer Mat',
  'Plates, Cup, Glass, Utensils, Bowl',
  'Deodorant, Body Spray or Perfume',
  'Sewing Kit',
  'Washing powder',
  'Dishwashing Items',
  'CNIC and Registration Info',
  'Scissors',
  'Knife',
  'Slippers',
  'Clothes (casual + formal for presentations)',
  'Mirror',
  'Calculator',
  'Kettle',
  'Iron',
  'Medicines',
];

export const detailPackingData = {
  clothing: [
    'Casual everyday wear (shirts, trousers, shalwar kameez)',
    'Formal attire for presentations',
    'Sweaters/Jackets for winter',
    'Sleepwear',
    'Undergarments and socks',
    'Towels (at least 2)',
    'Sportswear for gym/sports',
    'Flip-flops/slippers',
    'Deodorant, body spray, or perfume',
    'Sewing kit',
  ],
  bedding: [
    'Bed sheets (at least 2 sets)',
    'Pillow and pillowcases',
    'Blanket or comforter',
    'Mattress protector (optional but recommended)',
    'Bug spray',
    'Cleaning cloth',
    'Laundry basket',
  ],
  academics: [
    'Laptop and charger',
    'Phone charger',
    'Backpack (for classes)',
    'Stationery (pens, notebooks, etc.)',
    'Scientific calculator',
    'USB flash drive',
    'Extension cord/power strip',
    'Stapler',
  ],
  misc: [
    'Toiletries (soap, shampoo, toothpaste, etc.)',
    'Mug, plate, glass, bowl, and utensils',
    'Water bottle',
    'Padlock for your cupboard',
    'Basic first-aid kit',
    'Any personal medications',
    'Prayer mat (if needed)',
    'Umbrella',
    'Handcarry suitcase (for weekend travel, optional)',
    'Nail cutter',
    'Tissues',
    'Snacks',
    'Washing powder',
    'Dishwashing items',
    'CNIC and registration info',
    'Scissors',
    'Knife',
    'Kettle',
    'Iron',
    'Mirror',
    'Hangers',
  ],
};

export type PackingCategoryKey = 'clothing' | 'bedding' | 'academics' | 'misc';

export const packingCategories: { key: PackingCategoryKey; title: string }[] = [
  { key: 'clothing', title: 'Clothing & Personal Items' },
  { key: 'bedding', title: 'Bedding & Room Essentials' },
  { key: 'academics', title: 'Academics & Electronics' },
  { key: 'misc', title: 'Miscellaneous' },
];

const normalizeItem = (s: string) => s.toLowerCase().trim();

export const getDedupedPackingData = () => {
  const addUnique = (list: string[], seen: Set<string>) =>
    list.filter((item) => {
      const normalized = normalizeItem(item);
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });

  const seen = new Set<string>();
  return {
    clothing: addUnique(detailPackingData.clothing, seen),
    bedding: addUnique(detailPackingData.bedding, seen),
    academics: addUnique(detailPackingData.academics, seen),
    misc: addUnique(detailPackingData.misc, seen),
    essentials: addUnique(essentialItems, seen),
  };
};

export const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const buildItemId = (categoryKey: string, itemLabel: string) =>
  `${categoryKey}-${slugify(itemLabel)}`;

export type SocietyEntry = { name: string; description: string };

export type SocietyCategory = {
  title: string;
  societies: SocietyEntry[];
};

export const societiesData: Record<string, SocietyCategory> = {
  academic: {
    title: '🎯 Academic & Technical Societies',
    societies: [
      {
        name: 'ACM (Association for Computing Machinery)',
        description:
          'Focuses on programming, software development, and CS-related competitions, workshops, and hackathons.',
      },
      {
        name: 'AIAA (American Institute of Aeronautics and Astronautics)',
        description:
          'An aerospace-focused society supporting projects like UAV design and participation in the Design/Build/Fly competition.',
      },
      {
        name: 'IEEE (Institute of Electrical and Electronics Engineers)',
        description:
          'Covers electronics, robotics, embedded systems, and electrical innovation through events and hands-on projects.',
      },
      {
        name: 'GMS (GIKI Mathematics Society)',
        description:
          'Promotes analytical thinking and math literacy through competitions, puzzles, and problem-solving events.',
      },
      {
        name: 'NETRONiX',
        description:
          "GIKI's network and gaming society; manages campus LAN infrastructure and organizes e-sports and tech events like Über.GameX.",
      },
      {
        name: 'Science Society (GIKI Science Society)',
        description:
          'Encourages scientific research and experimentation through exhibitions, science fairs, and DIY projects.',
      },
    ],
  },
  cultural: {
    title: '🎭 Cultural, Media & Literary Societies',
    societies: [
      {
        name: 'Naqsh (Naqsh Arts Society)',
        description:
          'Promotes visual arts, including painting, calligraphy, and sketching, while celebrating cultural expression.',
      },
      {
        name: 'LDS (Literary and Debating Society)',
        description:
          "GIKI's official platform for debates, MUNs, declamations, and creative writing competitions.",
      },
      {
        name: 'Media Club',
        description:
          'Handles photography, videography, and media coverage of campus events; creates multimedia content for the student body.',
      },
      {
        name: 'CDeS (Comedy and Dramatics Entertainment Society)',
        description:
          "Performs comedy skits, plays, and theatre productions; GIKI's center for dramatics and stage acting.",
      },
    ],
  },
  social: {
    title: '📢 Social Impact & Professional Development Societies',
    societies: [
      {
        name: 'SOPHEP (Society for the Promotion of Higher Education in Pakistan)',
        description:
          'Offers career counseling, professional development, and alumni networking opportunities.',
      },
      {
        name: 'LES (Leadership and Entrepreneurship Society)',
        description:
          'Promotes entrepreneurial thinking and leadership through startup competitions, business simulations, and guest talks.',
      },
      {
        name: 'Project Topi',
        description:
          "GIKI's community outreach initiative that supports education, health, and welfare programs in the local Topi area.",
      },
    ],
  },
  teams: {
    title: '🚀 GIKI Competitive & Engineering Teams',
    societies: [
      {
        name: 'Team Invictus (AIAA)',
        description:
          'Designs, builds, and flies remote-controlled aircraft for the AIAA Design/Build/Fly competition in the U.S. Represents GIKI internationally in aerospace design.',
      },
      {
        name: 'Team Foxtrot (Independent)',
        description:
          'Builds fully autonomous UAVs for global competitions like the IMechE UAS Challenge. Focuses on drone engineering, embedded systems, and AI-based navigation.',
      },
      {
        name: 'Team Infinity (Formula Student / Mechanical Engineering)',
        description:
          "GIKI's Formula SAE team that designs and fabricates a formula-style electric race car for international motorsport engineering contests like FSUK.",
      },
      {
        name: 'Team Urban (Shell Eco-marathon)',
        description:
          'Develops ultra energy-efficient urban concept vehicles. Competes in Shell Eco-marathon Asia and Pakistan, focusing on innovation in sustainable transport.',
      },
      {
        name: 'Team Hammerhead (Shell Eco-marathon)',
        description:
          'Specializes in electric prototype vehicles for Shell Eco-marathon. Focuses on lightweight design, battery optimization, and aerodynamic performance.',
      },
      {
        name: 'Team Swift (Independent)',
        description:
          'An engineering design team dedicated to building performance drones and UAVs, participating in aerial tech competitions and advancing drone innovation on campus.',
      },
    ],
  },
};

export type DormMediaItem = {
  filename: string;
  type: 'image' | 'video';
  title: string;
  description: string;
};

export type DormHostelKey = 'boysHostel' | 'girlsHostel';

export const dormMediaConfig: Record<DormHostelKey, { media: DormMediaItem[] }> = {
  boysHostel: {
    media: [
      {
        filename: 'boys-room-tour copy.mp4',
        type: 'video',
        title: 'Boys Hostel Room Tour',
        description: 'A complete tour of a typical boys hostel room',
      },
    ],
  },
  girlsHostel: {
    media: [
      {
        filename: 'girls-room-tour.mp4',
        type: 'video',
        title: 'Girls Hostel Room Tour',
        description: 'A complete tour of a typical girls hostel room',
      },
    ],
  },
};

export const getDormMediaUrl = (item: DormMediaItem) =>
  item.type === 'video'
    ? `/dorm-media/videos/${item.filename}`
    : `/dorm-media/photos/${item.filename}`;
