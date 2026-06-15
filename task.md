# Migration Task List

## Portion 1: Environment, Layouts, & Static Content
- [x] Initialize Vite + React + TypeScript environment
- [x] Configure Tailwind CSS and postcss natively
- [x] Implement `ThemeContext` for light/dark mode persistence
- [x] Create shared layout components (Navbar, Sidebar, Footer)
- [x] Migrate Static Pages:
  - [/] Home Page structure (Home.tsx) with skeletons
  - [x] About Page (About.tsx) (Fully migrated for reference)
  - [x] Contact Page (Contact.tsx) (Fully migrated for reference)
  - [/] Freshman Guide Page (FreshmanGuide.tsx) (Skeletons created)

## Portion 2: Interactive Components
- [ ] Migrate Campus Calendar:
  - [ ] Calendar grid UI (month view layout)
  - [ ] Interactive event detail modals and forms
  - [ ] Local JSON mock integration for events
- [ ] Migrate Photo Gallery:
  - [ ] Responsive grid layout with filters
  - [ ] Lightbox slide view overlay
  - [ ] Cloudinary client-side upload handler integration
- [ ] Migrate Interactive Map Page:
  - [ ] SVG map viewport layer with zoom/pan gesture handlers
  - [ ] Pins loading from local MAPPOSITIONS.JSON
  - [ ] Info panels with dismiss timers

## Portion 3: Auth, Blog, & Dashboards
- [x] Refactor Firestore API definitions to standard npm packages
- [x] Create `AuthContext` with state listeners
- [x] Migrate auth views:
  - [x] Login screen UI & logic
  - [x] Signup screen UI & logic
- [x] Migrate Profile & Write features:
  - [x] Profile editing dashboard with profile pic uploader
  - [x] Browse posts directory with local state filtering
  - [x] Write post editor screen
- [x] Migrate Admin portal dashboard & moderation panel

## Final Integration & Verification
- [x] Connect all routes to Router in `App.tsx`
- [x] Replace mock JSON hooks with real Firebase collection queries
- [x] Test auth guards on private views
- [x] Verify PWA Service Worker caching
- [x] Production build and verification test runs
