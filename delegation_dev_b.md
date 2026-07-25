# Delegation Guide - Developer B

**Role:** Interactive Visual Components (Calendar, Gallery, and Maps)
**Assigned Portion:** Portion 2

Your primary responsibility is to migrate GIKI Chronicles' rich visual and interactive systems. These pages can be developed modularly using mock files/states and dropped directly into the layout shell.

---

## Technical Stack & Architecture

- **Build Tool:** Vite + React + TypeScript
- **Styling:** Native Tailwind CSS v4 and inline CSS classes where custom visual overlays/gestures are required.
- **Data Integrations:** Use local JSON mock files for development (e.g. `src/pages/CalendarData.json` or `MAPPOSITIONS.JSON`). Developer C will replace these mock loaders with Firestore query callbacks during final integration.

---

## Tasks & Walkthrough

### 1. Interactive Campus Calendar (`src/pages/Calendar.tsx`)
- **Reference Files:** [calendar.html](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/calendar.html) and [calendar_styles.css](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/calendar_styles.css)
- **Action Items:**
  1. Port the custom monthly grid layout. It should render days correctly based on selected month/year.
  2. Implement state triggers for **Month Forward/Back** transitions.
  3. **Event Card Modals:** On selecting/clicking an event day slot, trigger a detailed modal showing the Event Title, Date, Description, and action buttons.
  4. **Submit Event Form:** Port the user submission form inside a modal where users can input event metadata (title, category, date, description).
  5. **Calendar Synchronizer:** Port the helper utility that compiles and creates a Google Calendar appointment link from event details.
  6. **Mock Hookups:** Maintain a local events JSON list to verify the grid renders event highlights on corresponding calendar days.

### 2. Photo Gallery & Lightbox (`src/pages/Gallery.tsx`)
- **Reference File:** [gallery.html](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/gallery.html)
- **Action Items:**
  1. Build a responsive picture masonry layout grid.
  2. Implement category search toggles (e.g. "All", "Campus", "Events", "Sports").
  3. **Lightbox View:** Build a full-screen slider modal that opens on image click. Support previous/next keyboard arrows and close buttons.
  4. **Image Upload Integrations:**
     - Port the image submit modal overlay.
     - Integrate the client-side Cloudinary upload handler (refer to upload functions in `legacy-site/combined.min.js` and `gallery.html`).
     - Upload files directly to Cloudinary and return secure URLs to be saved in the database.

### 3. Interactive Zoomable Map (`src/pages/CampusMap.tsx`)
- **Reference Files:** [newmap.html](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/newmap.html) and [MAPPOSITIONS.JSON](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/MAPPOSITIONS.JSON)
- **Action Items:**
  1. Render the SVG campus map or high-resolution map image layout.
  2. **Canvas Gesture Controls:** Implement a drag-to-pan boundary constraint box and scroll/pinch zoom handlers. Keep pan boundary bounds confined so the user cannot drag the map completely off the screen.
  3. **Pins Loading:** Parse markers coordinates from `MAPPOSITIONS.JSON` and plot them dynamically over the map canvas.
  4. **Information Panels:** On clicking a location pin, display a side slide-in panel or popup bubble showing details. The panel should close on outside click or trigger a dismiss timeout.

---

## Verification Checklist
- [ ] Calendar renders dates accurately, responds to month navigation, and displays event dots on correct days.
- [ ] Gallery displays photos, switches categories correctly, and opens a fully responsive slideshow lightbox on click.
- [ ] Map pans and zooms smoothly on both desktop (mouse) and mobile (touch/pinch), displaying correct location details when pin items are clicked.
- [ ] All pages compile under `npm run build` without TypeScript type errors.
