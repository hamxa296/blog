# Delegation Guide - Developer A

**Role:** Core Layout, Styling Pipeline, and Static Pages Migration
**Assigned Portion:** Portion 1

Your primary responsibility is to maintain the foundation of the React application, establish the visual components of the landing page, and migrate the detailed Freshman Survival Guide.

---

## Technical Stack & Architecture

- **Build Tool:** Vite + React + TypeScript
- **Styling:** Native Tailwind CSS v4 (configured via `@tailwindcss/vite` in `vite.config.ts`)
- **Global Context:** Use [ThemeContext](file:///c:/Users/hamzz/Desktop/Github/blog/src/context/ThemeContext.tsx) for theme variables (`theme-basic-dark`, `theme-basic-light`).
- **Global Layout:** Use [Navbar](file:///c:/Users/hamzz/Desktop/Github/blog/src/components/Navbar.tsx) and [Sidebar](file:///c:/Users/hamzz/Desktop/Github/blog/src/components/Sidebar.tsx) to envelop page routers.

---

## Tasks & Walkthrough

### 1. Landing Page Migration (`src/pages/Home.tsx`)
- **Reference File:** [index.html](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/index.html) (Lines 650–890)
- **Action Items:**
  1. Open [Home.tsx](file:///c:/Users/hamzz/Desktop/Github/blog/src/pages/Home.tsx) and replace the stub with the complete HTML content of the main page sections.
  2. Implement the **Hero Section**, **Section 01 (Freshman Guide Teaser)**, **Section 02 (Calendar Teaser)**, and **Section 03 (Gallery Teaser)**.
  3. **Scroll Navigation System:** Port the scroll-to-section navigation sidebar. When a user clicks button `01`, `02`, or `03`, the viewport should smoothly scroll to that specific segment. Use React `useRef` hooks or `scrollIntoView` animations.
  4. **Dynamic Posts Teaser:** Create standard layout skeleton card structures for the *Featured Post* and *Recent Posts* elements. (Developer C will wire these up to the real Firebase backend later; keep them as mock/loading states for now).
  5. **Static Assets:** Place assets like `background.jpeg`, `fman.jpg`, `calendar.jfif`, and `camera.jpeg` from `legacy-site/` into the `public/` directory so they resolve natively.

### 2. Freshman Survival Guide Page (`src/pages/FreshmanGuide.tsx`)
- **Reference File:** [guide.html](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/guide.html)
- **Action Items:**
  1. Note that [guide.html](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/guide.html) was built as a React component running inside Babel Standalone. You can copy the state variables and core logic directly!
  2. Extract large static datasets (e.g., `essentialItems` packing items list, detailed categories structure `detailPackingData`, GIKI society directories `societiesData`, and hostel tour media links `dormMediaConfig`) into a separate TypeScript file `src/pages/FreshmanGuideData.ts` to keep the page component clean.
  3. **Packing List Tracker:** 
     - Port the interactive packing list checkmark checklist.
     - Implement the custom items adding/deleting state.
     - Save list checks locally via `localStorage` for guests, and coordinate with Developer C to sync list collections dynamically to Firestore (`users/<uid>/packing/list`) when a user signs in.
  4. **Society Browser:** Implement the category filters grid (Academic, Cultural, Social, Engineering Teams) which displays names and short descriptions dynamically when toggled.
  5. **Hostel Room Tour Viewers:** Port the Boys and Girls hostel video tab switcher that renders tours using HTML5 `<video>` components.

---

## Verification checklist
- [ ] Running `npm run dev` serves the Home landing page showing the Hero section, scrolling section indicators, and teaser panels.
- [ ] Freshman Guide loads all packing list elements, checkbox clicks persist in LocalStorage, and categories can be filtered.
- [ ] Society directory tags filter correctly.
- [ ] Clicking menu links switches pages smoothly via React Router without complete window refreshes.
- [ ] Running `npm run build` succeeds without compilation errors.
