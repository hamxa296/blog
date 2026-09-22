# 🏔️ GIKI Chronicles

**GIKI Chronicles** is an all-in-one digital campus platform, survival guide, content management system (CMS), media gallery, and interactive exploration hub engineered specifically for students, freshmen, and alumni of Ghulam Ishaq Khan Institute of Engineering Sciences and Technology (GIKI).

The project combines modern web technologies (React 19, Vite 8, TypeScript 6, Tailwind CSS 4) with real-time cloud services (Firebase Auth, Firestore, Cloud Storage) and media delivery platforms (Cloudinary) to deliver a high-performance, aesthetically rich single-page application (SPA).

---

## 1. Project Overview & Architecture

### Core Purpose
* **Freshman Survival Guide**: Dynamic, CMS-backed onboarding hub containing packing lists, hostel tours, society directories, academic navigation, and interactive FAQs.
* **Student Publishing & Blog Engine**: Multi-role publishing ecosystem with a custom block-based rich content editor (Headings, Callouts, Blockquotes, Images, CTAs, Dividers) supporting editorial review workflows (`pending`, `approved`, `rejected`, `draft`).
* **Interactive Campus Map**: An interactive, vector/canvas-styled spatial map detailing key campus landmarks, faculty buildings, hostels, sports complexes, and utility hubs.
* **Campus Media Gallery & Lightbox**: High-resolution gallery featuring Cloudinary image uploads, category filtering, and modal lightbox browsing.
* **Admin & Role-Based Content Management System (CMS)**: Fine-grained access control (`admin`, `editor`, `moderator`, `author`, `user`) allowing admins and moderators to review post submissions, manage user roles, update freshman guide sections, and sanitize media.

---

### High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React 19 + Vite 8 SPA)"]
        UI["React UI Components & Pages"]
        Router["React Router v7 (AppShell & Lazy Routes)"]
        AuthCtx["AuthContext (State & Session Manager)"]
        ThemeCtx["Theme Context & Grain Overlay"]
        BlockEdit["Block Rich Editor / Renderer"]
    end

    subgraph Services ["Service & Data Access Layer"]
        FB_Auth["Firebase Auth Service"]
        FB_Store["Firestore DB (Real-time onSnapshot)"]
        FB_Storage["Firebase Storage Service"]
        Cloudinary["Cloudinary Upload API (Unsigned Presets)"]
        GuideSvc["Guide Service (Artifact Preloader)"]
    end

    subgraph Backend ["Backend & Cloud Ecosystem"]
        Firebase_Cloud["Firebase Project: giki-chronicles"]
        Cloudinary_CDN["Cloudinary CDN (Image Optimization)"]
    end

    UI --> Router
    Router --> AuthCtx
    UI --> BlockEdit

    AuthCtx --> FB_Auth
    UI --> FB_Store
    UI --> GuideSvc
    GuideSvc --> FB_Store
    BlockEdit --> Cloudinary

    FB_Auth --> Firebase_Cloud
    FB_Store --> Firebase_Cloud
    FB_Storage --> Firebase_Cloud
    Cloudinary --> Cloudinary_CDN
```

---

### Core Tech Stack

| Domain | Technology / Library | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework & Runtime** | [React](https://react.dev/) | `^19.2.6` | Component UI framework with Concurrent React support |
| **Build Tooling** | [Vite](https://vitejs.dev/) | `^8.0.12` | Next-generation frontend tooling and ESM dev server |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `~6.0.2` | Strict static typing and interface definitions |
| **Routing** | [React Router DOM](https://reactrouter.com/) | `^7.17.0` | Client-side routing, lazy module loading & navigation guard routes |
| **Styling & CSS** | [Tailwind CSS](https://tailwindcss.com/) | `^4.3.0` | Utility-first CSS framework via `@tailwindcss/vite` plugin |
| **Animations** | [Framer Motion](https://motion.dev/) & [AnimeJS](https://animejs.com/) & [GSAP](https://gsap.com/) | `^12.42.2` / `^4.5.0` / `^3.15.0` | Smooth page transitions, micro-interactions & hero animations |
| **3D Rendering** | [Three.js](https://threejs.org/) & `@paper-design/shaders-react` | `^0.185.1` | WebGL canvas effects and background shader visuals |
| **Icons & UI Primitives** | [Lucide React](https://lucide.dev/) & Radix UI (`@radix-ui/react-avatar`, `react-slot`) | `^1.24.0` / `^1.2.3` | Accessible UI primitives and iconography |
| **Smooth Scroll** | [Lenis](https://lenis.darkroom.engineering/) | `^1.3.23` | Kinetic smooth scrolling engine |
| **Notifications** | [Sonner](https://sonner.emilkowal.ski/) | `^2.0.8` | Toast notification system |
| **Backend & Database** | [Firebase SDK](https://firebase.google.com/) | `^12.14.0` | Authentication, Firestore NoSQL DB, and Cloud Storage |
| **Media Host** | [Cloudinary REST API](https://cloudinary.com/) | Direct REST | Image upload, CDN delivery, and automatic media optimization |

---

## 2. Repository & Directory Structure

```
blog/
├── .env.example                # Template for environment variables
├── .env.local                  # Local development environment overrides
├── .firebaserc                 # Firebase CLI project binding configuration
├── .github/                    # GitHub repository configurations
├── .live-server.json           # Live Server local development settings
├── .vscode/                    # Editor workspace settings and recommendations
├── dist/                       # Production build distribution output
├── docs/                       # Project documentation assets
├── eslint.config.js            # Flat ESLint configuration rules
├── firebase.json               # Firebase Hosting rewrite and headers config
├── firestore.rules             # Production security rules for Firestore collections
├── index.html                  # Main HTML entrypoint with font preloads
├── package.json                # Dependencies, scripts, and package metadata
├── public/                     # Static public assets (favicons, static images)
├── scripts/                    # Maintenance & automation scripts
│   └── fetch-waitlist.js       # Admin script to export Firestore waitlist data
├── security-utils.js           # Server-side HTML sanitization utilities
├── setup-env.bat               # Windows batch script for automated .env configuration
├── setup-env.js                # Cross-platform Node.js script for .env configuration
├── setup-env.ps1               # PowerShell setup script for .env configuration
├── storage.rules              # Firebase Storage bucket access control rules
├── tsconfig.app.json           # TypeScript configuration for application code
├── tsconfig.json               # Root TypeScript project reference configuration
├── tsconfig.node.json          # TypeScript configuration for Node.js build tooling
├── vercel.json                 # Vercel deployment routing and SPA rewrites
├── vite.config.ts              # Vite configuration with path aliases (@ -> /src)
└── src/                        # Main application source code
    ├── App.tsx                 # Root router provider, AppShell layout, routing matrix
    ├── index.css               # Global Tailwind CSS definitions and custom utilities
    ├── main.tsx                # Application mounting point with React StrictMode
    ├── vite-env.d.ts           # Client type declarations for Vite env variables
    ├── assets/                 # SVGs, images, static media files
    ├── components/             # Component library divided by domain
    │   ├── CmsRoute.tsx        # Route guard checking admin/editor role permissions
    │   ├── ProtectedRoute.tsx  # Route guard requiring authenticated user session
    │   ├── about/              # About page sub-components (Team cards, stats)
    │   ├── auth/               # Auth modal forms and sign-in widgets
    │   ├── blog/               # Blog cards, featured post carousels, lists
    │   ├── editor/             # Custom block-based rich text editor components
    │   │   ├── BlockEditor.tsx # Core block editor controller
    │   │   ├── BlockPicker.tsx # Block type selection palette
    │   │   └── blocks/         # Block editors (Heading, Paragraph, Image, Callout, etc.)
    │   ├── feature/            # Feature highlights and landing page sections
    │   ├── gallery/            # Media surfer and image lightbox modals
    │   ├── guide/              # Freshman guide UI (Bento grid, checklist, tours, tabs)
    │   ├── hero/               # Hero sections and intro animations
    │   ├── nav/                # Navigation bars, floating menus, footers
    │   ├── profile/            # User profile header and post management cards
    │   ├── renderer/           # Content block renderer components
    │   └── ui/                 # Reusable atomic UI components (Button, Card, Avatar, etc.)
    ├── context/                # React Context Providers
    │   ├── AuthContext.tsx     # Firebase Auth subscriber & user state provider
    │   └── ThemeContext.tsx    # Theme provider and visual modes
    ├── hooks/                  # Custom React Hooks
    │   └── useMediaQuery.ts    # Responsive breakpoint media query listener
    ├── lib/                    # Core library utilities
    │   └── utils.ts            # Class merging utility (clsx + tailwind-merge)
    ├── pages/                  # Page view components (React Router views)
    │   ├── About.tsx           # Institutional overview, mission, and team profile
    │   ├── AdminPortal.tsx     # Dedicated administrative user management hub
    │   ├── BlogBrowse.tsx      # Filterable article catalog and tag search
    │   ├── BlogPostDetail.tsx  # Full article viewer with sanitized block renderer
    │   ├── CampusMap.tsx       # Interactive spatial map with location markers
    │   ├── CmsDashboard.tsx    # Multi-tab CMS for post review, user roles, & guide edits
    │   ├── Contact.tsx         # Contact form and feedback channel
    │   ├── FreshmanGuide.tsx   # Comprehensive freshman guide hub
    │   ├── Gallery.tsx         # Photo gallery with upload integration
    │   ├── Home.tsx            # Landing view aggregating hero, features, and posts
    │   ├── Login.tsx           # Authentication sign-in screen
    │   ├── NotFound.tsx        # Custom 404 page handler
    │   ├── Profile.tsx         # User profile editor and user submission history
    │   ├── Signup.tsx          # Account registration screen
    │   └── WritePost.tsx       # Article creation/editing view with block editor
    ├── services/               # External service integration drivers
    │   ├── cloudinary.ts       # Cloudinary REST image upload client
    │   ├── firebase.ts         # Firebase Auth, Firestore, and Storage initialization & queries
    │   └── guideService.ts     # Real-time Freshman Guide & Packing List data service
    ├── types/                  # TypeScript interface and type declarations
    │   ├── blockTypes.ts       # Rich editor content block type definitions
    │   └── guide.ts            # Freshman guide and packing checklist data structures
    └── utils/                  # Utility helper functions
        ├── imageOptimization.ts# Cloudinary URL transformation and image sizing helper
        └── sanitize.ts         # Client-side HTML/String sanitizer for security
```

---

### Detailed File Breakdown

#### Configuration & Root Scripts
* [`package.json`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/package.json): Project dependencies, scripts (`dev`, `build`, `lint`, `preview`), dev-dependencies, and metadata.
* [`vite.config.ts`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/vite.config.ts): Vite build configuration with React plugin, Tailwind CSS v4 plugin, and `@` path aliasing pointing to `./src`.
* [`firestore.rules`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/firestore.rules): Enterprise-grade Firestore security rules enforcing role-based authorization for `users`, `posts`, `gallery_photos`, `artifacts`, and `waitlist`.
* [`storage.rules`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/storage.rules): Access control rules for Firebase Storage buckets, allowing public reads while restricting writes to authenticated owners and admins.
* [`vercel.json`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/vercel.json): Vercel routing configuration enforcing SPA rewrites (`/*` -> `/index.html`) and security response headers.
* [`setup-env.js`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/setup-env.js): Interactive setup script guiding developers through configuring `.env.local` parameters.

#### Services (`src/services/`)
* [`firebase.ts`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/src/services/firebase.ts): Central Firebase SDK configuration. Exports Firebase Auth, Firestore, and Storage instances. Defines data interfaces (`UserProfile`, `Post`, `GalleryPhoto`), admin UID list (`ADMIN_UIDS`), and database queries (CRUD for posts, gallery items, users, reviews).
* [`cloudinary.ts`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/src/services/cloudinary.ts): Unsigned REST uploader interacting with Cloudinary API (`dfkpmldma` cloud namespace). Performs size validation (max 10MB) and returns secure CDN image URLs.
* [`guideService.ts`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/src/services/guideService.ts): Firestore real-time wrapper for Freshman Guide sections (`onSnapshot`) and student packing lists (`savePackingList`, `loadPackingList`).

#### Utilities & Types (`src/utils/`, `src/types/`, `src/lib/`)
* [`sanitize.ts`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/src/utils/sanitize.ts): Sanitizes raw user string inputs to block XSS attacks before injection into rendered blocks.
* [`imageOptimization.ts`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/src/utils/imageOptimization.ts): Injects Cloudinary image transformation parameters (width, quality, format conversion) into image URLs for bandwidth optimization.
* [`blockTypes.ts`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/src/types/blockTypes.ts): TypeScript interface specs for block types (`heading`, `paragraph`, `image`, `quote`, `callout`, `cta`, `divider`).
* [`guide.ts`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/src/types/guide.ts): Data contracts for `GuideSection`, `FAQItem`, `PackingCategory`, and `CheckedItems`.

---

## 3. Frontend Implementation & Feature Walkthrough

### 1. Freshman Survival Guide (`/guide`)
* **Interactive Bento Grid** ([`BentoGrid.tsx`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/src/components/guide/BentoGrid.tsx)): Visual grid displaying category cards (Academics, Hostels, Campus Life, Mess & Food, Societies, Packing).
* **Persistent Packing Checklist** ([`PackingChecklist.tsx`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/src/components/guide/PackingChecklist.tsx)): Personal packing item manager with category accordions and item state persistence connected to Firestore (`users/{uid}/packing/list`).
* **Hostel Virtual Tours** ([`HostelTours.tsx`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/src/components/guide/HostelTours.tsx)): Interactive hostel overview featuring room specifications, amenities, and hostel rules.
* **Societies Directory** ([`SocietiesTabs.tsx`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/src/components/guide/SocietiesTabs.tsx)): Categorized showcase of GIKI student societies, technical teams, and extracurricular clubs.

### 2. Interactive Campus Map (`/map`)
* **Spatial Landmark Navigation** ([`CampusMap.tsx`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/src/pages/CampusMap.tsx)): Map UI displaying interactive location nodes (Faculty of Computer Science & Engineering, Clock Tower, Central Library, Sports Complex, Hostels). Features category filtering, landmark search, detail popovers, and directions.

### 3. Student Blog Publishing Engine (`/browse`, `/posts/:id`, `/write`)
* **Rich Block-Based Editor** ([`BlockEditor.tsx`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/src/components/editor/BlockEditor.tsx)): Modular post creation system allowing writers to add, reorder, edit, and delete structured block elements (Headings, Paragraphs, Images with Cloudinary integration, Quotes, Callouts, CTAs, Dividers).
* **Block Renderer** ([`BlockRenderer.tsx`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/src/components/renderer/BlockRenderer.tsx)): Safe, structured component renderer turning block JSON objects into responsive HTML layouts.
* **Catalog & Filter Browse** ([`BlogBrowse.tsx`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/src/pages/BlogBrowse.tsx)): Grid of published articles with search, genre tags, featured tags, and author details.

### 4. Campus Media Gallery (`/gallery`)
* **Photo Grid & Upload** ([`Gallery.tsx`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/src/pages/Gallery.tsx)): Filterable image showcase categorized by events, campus views, and student life. Includes modal upload window pushing photos to Cloudinary and recording references in the `gallery_photos` collection.
* **Collection Surfer** ([`CollectionSurfer.tsx`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/src/components/gallery/CollectionSurfer.tsx)): High-resolution lightbox image reader.

### 5. CMS Dashboard & Administration (`/cms`, `/admin`)
* **Content Moderation & Review** ([`CmsDashboard.tsx`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/src/pages/CmsDashboard.tsx)): Editorial portal for admins and moderators to inspect pending posts, approve articles for publication, reject submissions with reviewer feedback, or edit existing guide content.
* **Role & User Management** ([`AdminPortal.tsx`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/src/pages/AdminPortal.tsx)): Admin-exclusive page to view registered users, modify permissions (`user`, `author`, `moderator`, `editor`, `admin`), and block/unblock accounts.

---

### Component Tree Overview

```
App (AuthProvider, RouterProvider, Toaster)
 └── AppShell (Layout wrapper with SVG noise overlay & AnimatePresence)
      ├── FloatingMenu (Global floating navigation bar)
      ├── GlobalBackButton (Contextual top-left navigation button)
      └── Suspense / Lazy Routes:
           ├── Home (HeroSection, IntroAnimation, FeatureSection, FeaturedPosts)
           ├── FreshmanGuide (BentoGrid, PackingChecklist, HostelTours, SocietiesTabs, GuideSectionDetail)
           ├── CampusMap (Map Canvas, Filter Bar, Landmark Drawer)
           ├── BlogBrowse (Search Header, Genre Filters, GlassBlogCard Grid)
           ├── BlogPostDetail (Post Header, Author Metadata, BlockRenderer)
           ├── WritePost (Post Meta Form, BlockEditor, Image Uploader)
           ├── Gallery (Category Tabs, Photo Grid, Upload Modal, CollectionSurfer)
           ├── CmsDashboard (Post Moderation Queue, Guide Section Editor, User Role Table)
           ├── AdminPortal (User Role Matrix, System Controls)
           ├── Profile (ProfileCard, User Submission Tabs, Account Settings)
           ├── Login / Signup (AuthSection, Google OAuth, Email Auth Forms)
           ├── About (TeamMemberCard, Institutional History, Core Stats)
           └── Contact (Contact Form, FAQ Accordion)
```

---

### State Management & Data Flow

* **Global Session State** ([`AuthContext.tsx`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/src/context/AuthContext.tsx)): Listens to Firebase Auth changes via `onAuthStateChanged`. Fetches the matching user document from the `users` Firestore collection to sync user roles, bio, profile photo, and admin status.
* **Real-time Subscriptions**: Uses Firestore `onSnapshot` listeners in `guideService.ts` and `CmsDashboard.tsx` for real-time updates without manual page refreshes.
* **Local UI State**: Form controls, modal visibility, block list manipulation, and map filters are managed via native React `useState`, `useReducer`, and custom hooks (`useMediaQuery`).

---

## 4. Backend, Data Layer & Integrations

### Database Services (Firebase Firestore)

The platform relies on Firebase Firestore for data storage. Security is strictly controlled at the database level via [`firestore.rules`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/firestore.rules).

#### Data Schemas & Collections

##### 1. `users` Collection
* **Document ID**: User UID (`auth.uid`)
```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  bio?: string;
  badge?: string;
  isAdmin?: boolean;
  isBlocked?: boolean;
  role?: 'admin' | 'editor' | 'moderator' | 'author' | 'user';
  createdAt?: Timestamp;
  lastUpdated?: Timestamp;
  instagramUrl?: string;
  twitterUrl?: string;
  threadsUrl?: string;
}
```

##### 2. `posts` Collection
* **Document ID**: Auto-generated string
```typescript
interface Post {
  id?: string;
  title: string;
  content: string; // JSON string representation of Block[]
  description: string;
  photoUrl: string;
  genre: string;
  tags: string[];
  authorId: string;
  authorName: string;
  createdAt: Timestamp | null;
  status: 'pending' | 'approved' | 'rejected' | 'draft';
  isFeatured: boolean;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  rejectionReason?: string;
}
```

##### 3. `gallery_photos` Collection
* **Document ID**: Auto-generated string
```typescript
interface GalleryPhoto {
  id?: string;
  imageUrl: string;
  fullSizeUrl: string;
  caption: string;
  category: string;
  uploaderName: string;
  uploaderId: string;
  cloudinaryId?: string;
  createdAt?: Timestamp;
}
```

##### 4. `artifacts/{APP_ID}/public/data/freshmanGuide` Collection
* **Document ID**: Section ID (e.g., `what-to-pack`, `academics`, `hostel-life`)
```typescript
interface GuideSection {
  id: string;
  tag: string;
  shortDescription: string;
  fullContent: string;
  faqs: Array<{ question: string; answer: string }>;
  warnings: string[];
}
```

##### 5. `users/{uid}/packing/list` Document
```typescript
interface PackingListData {
  checkedItems: Record<string, boolean>; // e.g. { "bedding-pillow": true }
  lastUpdated: string;
}
```

---

### External Media Integration (Cloudinary API)

Image uploads from the Rich Editor and Media Gallery interact directly with Cloudinary's Unsigned Upload API:
* **Endpoint**: `POST https://api.cloudinary.com/v1_1/dfkpmldma/image/upload`
* **Payload**: `FormData` containing `file` and `upload_preset: "giki-chronicles"`.
* **Transformations**: [`imageOptimization.ts`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/src/utils/imageOptimization.ts) dynamically formats Cloudinary URLs with parameters such as `f_auto,q_auto,w_800` to deliver modern WebP/AVIF images tailored to the user's screen size.

---

## 5. Environment Configuration

To run GIKI Chronicles locally or in production, populate the following environment variables in `.env.local`:

| Variable Name | Purpose | Required | Sample Value |
| :--- | :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Authorization Key | **Yes** | `AIzaSyC1Q9tIEHLqAKZj6IjJN8aPiQCAPYbsi7I` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Authentication Domain | **Yes** | `giki-chronicles.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project Identifier | **Yes** | `giki-chronicles` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket URI | **Yes** | `giki-chronicles.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Cloud Messaging Sender ID | **Yes** | `80968785263` |
| `VITE_FIREBASE_APP_ID` | Firebase Application Web ID | **Yes** | `1:80968785263:web:666d2e69fef2ef6f5a5c9a` |
| `VITE_GUIDE_ARTIFACT_ID` | Custom Artifact namespace for Freshman Guide Firestore collection | No | `default-app-id` |

---

## 6. Local Development Setup

### Prerequisites
* **Node.js**: `v18.0.0` or higher (Recommended: `v20.x` or `v22.x`)
* **Package Manager**: `npm` (`v9+` or `v10+`), `pnpm`, or `yarn`

---

### Step-by-Step Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/hamxa296/blog.git
   cd blog
   ```

2. **Configure Environment Variables**
   Run the interactive setup tool or copy `.env.example` directly:
   ```bash
   node setup-env.js
   # or manually:
   cp .env.example .env.local
   ```
   *Fill in your Firebase credentials in `.env.local`.*

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Launch Local Development Server**
   ```bash
   npm run dev
   ```
   The application will boot up at **`http://localhost:5173`** (or the next available port).

---

### Code Quality & Validation Scripts

* **Run ESLint Checker**:
  ```bash
  npm run lint
  ```
* **Run TypeScript Type Verification**:
  ```bash
  npx tsc -b
  ```

---

## 7. Production Build & Deployment

### Building for Production

To compile the TypeScript project and generate optimized assets for production:

```bash
npm run build
```

This runs:
1. `tsc -b`: Strict cross-file TypeScript type checking.
2. `vite build`: Minification, tree-shaking, chunk splitting, and production bundle generation in the `dist/` directory.

To preview the built production bundle locally:
```bash
npm run preview
```

---

### Deployment Target Configurations

#### Option A: Vercel Deployment (Recommended)
The repository includes a custom [`vercel.json`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/vercel.json) configuration:
* Handles single-page app route rewriting (`/*` -> `/index.html`).
* Sets security headers (X-Frame-Options, X-Content-Type-Options).

```bash
npx vercel --prod
```

#### Option B: Firebase Hosting
The repository includes [`firebase.json`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/firebase.json) and [`.firebaserc`](file:///c:/Users/Lenovo/Desktop/Zed%20Uni/Sem%204/Projects/v3/blog/.firebaserc):
```bash
npx firebase-tools deploy --only hosting
```

To update database or storage security rules on Firebase:
```bash
npx firebase-tools deploy --only firestore:rules,storage
```

---

## 📄 License & Attribution

Developed with ❤️ for the GIKI Student & Alumni Community. All rights reserved.
