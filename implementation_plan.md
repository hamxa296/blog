# Implementation Plan - HTML/CSS/JS to React Migration

This plan details the step-by-step process of converting the GIKI Chronicles blog application from static HTML/CSS/JS files into a modern, component-driven React application using Vite. 

To enable three team members to work simultaneously without blocking each other, the migration is split into **three distinct, independent portions**. Each developer can execute their portion independently using mock data and local components, with integration and final Firebase database hookup scheduled at the very end.

---

## User Review Required

> [!IMPORTANT]
> **No Database Changes:** We will not touch the database schemas, collection rules, or backend configurations. The React app will interface with the exact same Firebase Collections (`posts`, `users`, `events`) and fields currently in use.
>
> **Asset Preservation:** All static assets (e.g., `background.jpeg`, `logo.png`, map images, and profile pics) will be moved into the React `public/` folder to maintain identical visual branding.

---

## Open Questions

> [!NOTE]
> Please review and confirm the following technical recommendations:
>
> 1. **Framework & Package Manager:** We propose using **Vite + React + TypeScript** for maximum performance and type safety.
> 2. **Tailwind CSS Implementation:** We recommend installing Tailwind CSS as a devDependency in the project rather than loading it via a `<script>` tag. This enables PurgeCSS to optimize the bundle size.
> 3. **Routing Strategy:** We recommend using `react-router-dom` (hash or browser routing) to manage all page transitions smoothly in a single-page app (SPA) format.

---

## Migration Architecture Overview

The target codebase structure will follow a modular React folder structure:

```
src/
├── assets/            # Local images and fonts
├── components/        # Shared components (Navbar, Footer, Sidebar, Buttons, Modals)
├── context/           # Global states (ThemeContext, AuthContext)
├── hooks/             # Custom React hooks (useAuth, useTheme)
├── pages/             # Page views (Home, About, Calendar, Browse, Map, etc.)
├── services/          # API integrations (firebase.js, cloudinary.js)
├── styles/            # Tailwind CSS and global style overrides
├── App.jsx            # Main app router setup
└── main.jsx           # App entry point
```

---

## Proposed Changes & Portions

---

### Portion 1 (Developer A): Build Environment, Layout System, Shared Utilities, and Static Content

Developer A will establish the foundation of the project, creating the application shell, styling pipelines, layout systems, and porting the informational pages.

#### [NEW] [package.json](file:///c:/Users/hamzz/Desktop/Github/blog/package.json)
Initialize a new React app setup using Vite.
- Configure dependencies: `react`, `react-dom`, `react-router-dom`, `lucide-react`, `firebase`.
- Configure devDependencies: `typescript`, `@types/react`, `tailwindcss`, `postcss`, `autoprefixer`, `vite`.

#### [NEW] [vite.config.js](file:///c:/Users/hamzz/Desktop/Github/blog/vite.config.js)
- Configure path aliases (e.g. `@/*` pointing to `src/*`).
- Set up proxy settings if required for development.

#### [NEW] [src/context/ThemeContext.jsx](file:///c:/Users/hamzz/Desktop/Github/blog/src/context/ThemeContext.jsx)
- Port the immediate theme checking and local storage synchronizations from `theme-manager.js` into a React Context.
- Provide toggle functions and state (`theme-basic-dark`, `theme-basic-light`) that apply class names to the `document.documentElement` dynamically.

#### [NEW] [src/components/Navbar.jsx](file:///c:/Users/hamzz/Desktop/Github/blog/src/components/Navbar.jsx)
- Migrate the navbar layout from `index.html` (lines 396-451).
- Integrate hamburger toggle callbacks for the sidebar.
- Accept auth state parameters to toggle between Guest Links (Login) and User Links (My Profile, Logout).

#### [NEW] [src/components/Sidebar.jsx](file:///c:/Users/hamzz/Desktop/Github/blog/src/components/Sidebar.jsx)
- Migrate the sidebar layout from `index.html` (lines 453-644).
- Support slide-in/slide-out animation state and click-outside close handlers.
- Handle calendar sub-menus dynamically in React state.

#### [NEW] [src/pages/Home.jsx](file:///c:/Users/hamzz/Desktop/Github/blog/src/pages/Home.jsx)
- Migrate the visual sections of `index.html`: Hero Section, Section 01 (Freshman Guide teaser), Section 02 (Calendar teaser), and Section 03 (Gallery teaser).
- Implement the page scroll-snap/scroll-to navigation buttons (01, 02, 03 controls) using React refs.
- **Mock Connection:** Insert a placeholder/skeleton component for the "Featured Post" and "Recent Posts" list (to be wired to Firebase by Developer C later).

#### [NEW] [src/pages/About.jsx](file:///c:/Users/hamzz/Desktop/Github/blog/src/pages/About.jsx)
- Migrate all elements from `about.html` into a structured page component.

#### [NEW] [src/pages/Contact.jsx](file:///c:/Users/hamzz/Desktop/Github/blog/src/pages/Contact.jsx)
- Migrate all elements from `contact.html` into a structured page component.

#### [NEW] [src/pages/FreshmanGuide.jsx](file:///c:/Users/hamzz/Desktop/Github/blog/src/pages/FreshmanGuide.jsx)
- Migrate the entire Freshman Guide from `guide.html` including sub-menus, hostel tables, packing lists, and mess schedules.

#### [NEW] [src/styles/index.css](file:///c:/Users/hamzz/Desktop/Github/blog/src/styles/index.css)
- Import Tailwind layers (`base`, `components`, `utilities`).
- Add the custom fonts, gradient background classes, card overlays, and modal transitions currently defined in `styles.css`.

---

### Portion 2 (Developer B): Interactive Systems (Calendar, Photo Gallery, and Map View)

Developer B will focus on high-fidelity user interaction systems. These sections can be developed independently of the core framework by using local mock JSON files and temporary layout shells, which will be dropped into Developer A's router.

#### [NEW] [src/pages/Calendar.jsx](file:///c:/Users/hamzz/Desktop/Github/blog/src/pages/Calendar.jsx)
- Port custom CSS grid calendar from `calendar.html` into a React-based stateful calendar grid.
- Manage active date state, month transitions, and day detail modal triggers in React.
- Create modular components: `<EventCard />`, `<EventDetailsModal />`, and `<AddEventForm />`.
- Connect the logic for building Google Calendar links.
- **Data Hook:** Implement an internal `fetchEvents()` mock that resolves from a local file, later replaced by database imports.

#### [NEW] [src/pages/Gallery.jsx](file:///c:/Users/hamzz/Desktop/Github/blog/src/pages/Gallery.jsx)
- Port the gallery grid from `gallery.html`.
- Create a reusable `<Lightbox />` component for full-screen image slide views.
- Build the photo submit overlay (connecting to the Cloudinary client-side upload handler).
- **Data Hook:** Load initial image arrays via local mock data before database connections.

#### [NEW] [src/pages/CampusMap.jsx](file:///c:/Users/hamzz/Desktop/Github/blog/src/pages/CampusMap.jsx)
- Port the interactive map system from `newmap.html`.
- Render the base SVG map layer or image viewport.
- Implement canvas gesture controls (pan boundary clamping, wheel zoom, pinch-to-zoom for mobile).
- Import pin coordinates dynamically from a JSON module (parsed from `MAPPOSITIONS.JSON`).
- Build responsive info panels that animate on pin clicks and auto-dismiss on timer/outside click.

---

### Portion 3 (Developer C): Authentication, Blog System, User Profiles, and Administration

Developer C will handle state management, form submissions, page routing guards, and moderate/private dashboards.

#### [NEW] [src/services/firebase.js](file:///c:/Users/hamzz/Desktop/Github/blog/src/services/firebase.js)
- Extract the core client-side functions from `combined.min.js` (including `signUpUser`, `loginUser`, `signInWithGoogle`, `logoutUser`, `getApprovedPosts`, `getPostById`, `createPost`, `updateUserProfile`, etc.).
- Refactor calls to use the standard modular Firebase npm SDK structure.
- Initialize the application using Vite environment variables (`import.meta.env`).

#### [NEW] [src/context/AuthContext.jsx](file:///c:/Users/hamzz/Desktop/Github/blog/src/context/AuthContext.jsx)
- Create a central context that listens to `onAuthStateChanged`.
- Store the authenticated user's state, metadata, and role (admin flag).
- Export hooks like `useAuth()` to check authentication status and protect private views.

#### [NEW] [src/pages/Login.jsx] & [src/pages/Signup.jsx]
- Port the login and signup forms from `login.html` and `signup.html`.
- Integrate validations, loading indicators, and toast error messages (migrating alerts from `firebase-error-handler.js`).

#### [NEW] [src/pages/Profile.jsx](file:///c:/Users/hamzz/Desktop/Github/blog/src/pages/Profile.jsx)
- Port profile layouts from `profile.html`.
- Build the profile edit form (changing displayName, bio) and profile photo upload handler (connected to Firebase storage bucket).
- Render a tab showing only the logged-in user's own posts with dynamic draft/pending indicators.

#### [NEW] [src/pages/BlogBrowse.jsx](file:///c:/Users/hamzz/Desktop/Github/blog/src/pages/BlogBrowse.jsx)
- Port the article finder grid from `browse.html`.
- Implement full text search filtering, genre tag toggles, and date sorting inside React states.

#### [NEW] [src/pages/BlogPostDetail.jsx](file:///c:/Users/hamzz/Desktop/Github/blog/src/pages/BlogPostDetail.jsx)
- Port single post presentation from `post_display.html`.
- Handle routing parameters (e.g. `/posts/:id`) to fetch the corresponding Firestore post document.

#### [NEW] [src/pages/WritePost.jsx](file:///c:/Users/hamzz/Desktop/Github/blog/src/pages/WritePost.jsx)
- Port the form from `write.html`.
- Implement the title input, description, content textarea (or custom rich editor), genre dropdown, and tags compiler.

#### [NEW] [src/pages/AdminPortal.jsx](file:///c:/Users/hamzz/Desktop/Github/blog/src/pages/AdminPortal.jsx)
- Create an Admin control center panel.
- Implement post queues (pending approvals, rejects) and moderation buttons.
- Implement user lists for moderation (flagging/blocking accounts).

---

## Final Integration & Linking Steps

Once all three portions are completed independently, the integration phase links the components:

1. **Step 1: Mount the Router**
   - Register all completed page routes inside `src/App.jsx`.
2. **Step 2: Connect Shared Components**
   - Import the navigation elements from Portion 1 (`Navbar`, `Sidebar`, `Footer`) into `App.jsx` layout shell.
3. **Step 3: Connect Firebase Contexts**
   - Wrap the entire application with `ThemeProvider` and `AuthContext.Provider`.
   - Protect write, profile, and admin routes using `<ProtectedRoute>` elements.
4. **Step 4: Swap Mock Hooks with Real Firestore Queries**
   - Swap mock arrays in `Calendar.jsx` and `Gallery.jsx` with real collection queries imported from `src/services/firebase.js`.
   - Swap mock arrays in `Home.jsx` with real approved posts lists.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify webpack bundling is free of syntax errors, unused references, or TS compilation conflicts.
- Run `npm run lint` if configuring ESLint rules.

### Manual Verification
- **Theme Transitions:** Verify that switching themes correctly toggles HSL CSS variables and propagates dark/light classes down components.
- **Authentication Guards:** Attempt to navigate directly to `/write` or `/admin` when logged out, confirming the app redirects back to `/login`.
- **Dynamic Interactions:** 
  - Click Calendar slots and verify popup contents.
  - Test map zooming/panning gestures on mobile devices.
  - Upload sample images to the gallery and confirm lightbox presentation.
