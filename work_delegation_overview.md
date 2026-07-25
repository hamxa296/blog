# React Migration - Developer Work Delegation Overview

To execute the GIKI Chronicles blog migration smoothly and avoid code/merge conflicts, the project is divided into **three independent portions**. Each developer can work concurrently on their portion using mock data/states. Integration and final database bindings will take place at the end.

Review the summary of each portion below to choose the path that best matches your interests and skills:

---

## 🎨 Developer A: Core Layout, Styling Shell, & Static Content
*Ideal for developers who enjoy UI layout, CSS animations, responsive styling, and building navigation shells.*

* **Key Focus:** Establishing the visual look and feel, layouts, static pages, and the large Freshman Survival Guide.
* **Core Responsibilities:**
  1. **Landing Page (`src/pages/Home.tsx`):** Port visual hero sections and setup page scroll snap sections. Add scroll section dots navigation.
  2. **Freshman Guide (`src/pages/FreshmanGuide.tsx`):** Port detailed packing lists checklists (using LocalStorage for guest users), societies information tabs, and boy/girl hostel video tour frames.
* **Files to Reference:** [index.html](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/index.html), [guide.html](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/guide.html)
* **Skills Involved:** Tailwind CSS, React layout architecture, React refs/scroll behaviors, client-side local storage.
* **Full Guide:** [delegation_dev_a.md](file:///c:/Users/hamzz/Desktop/Github/blog/delegation_dev_a.md)

---

## ⚡ Developer B: Stateful & Interactive Media Components
*Ideal for developers who love mathematical UI logic, canvas or SVG gesture controls, and complex state interaction models.*

* **Key Focus:** Re-implementing high-fidelity interactive pages with mock data layers.
* **Core Responsibilities:**
  1. **Interactive Calendar (`src/pages/Calendar.tsx`):** Build a monthly grid day-tracker with modal popups for viewing and creating events. Add Google Calendar link generation.
  2. **Photo Gallery (`src/pages/Gallery.tsx`):** Build a photo masonry grid, category filter tabs, a full-screen slide lightbox, and connect file uploads to Cloudinary.
  3. **Interactive Map (`src/pages/CampusMap.tsx`):** Render the SVG map. Implement touch/mouse pan gestures, mouse-wheel zoom boundary clamps, and plot pin details from a JSON coordinates file.
* **Files to Reference:** [calendar.html](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/calendar.html), [gallery.html](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/gallery.html), [newmap.html](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/newmap.html), [MAPPOSITIONS.JSON](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/MAPPOSITIONS.JSON)
* **Skills Involved:** CSS Math/Transforms, gesture event handlers, SVG manipulation, visual grid structures, Cloudinary API integration.
* **Full Guide:** [delegation_dev_b.md](file:///c:/Users/hamzz/Desktop/Github/blog/delegation_dev_b.md)

---

## 🔐 Developer C: Authentication, Database Services, & Final Integration
*Ideal for developers who excel at state management, backend-to-frontend api orchestration, secure routing, database structures, and overall integration.*

* **Key Focus:** Backend integration, user profile features, search filters, and coordinating the final merge.
* **Core Responsibilities:**
  1. **Firebase Services Configuration (`src/services/firebase.ts`):** Transition database calls to modular modern Firebase SDK rules using environment files.
  2. **Auth Context & Guards (`src/context/AuthContext.tsx`):** Build a central session hook and `<ProtectedRoute>` route wrappers.
  3. **Authentication Screens (`Login.tsx`, `Signup.tsx`, `Profile.tsx`):** Port login/signup panels (Google Sign-In) and profile edit page (with avatar upload to Firebase Storage bucket).
  4. **Blog Feeds & Editing (`BlogBrowse.tsx`, `BlogPostDetail.tsx`, `WritePost.tsx`):** Create the blog feed with keyword search, genre tag filters, dynamic route readers, and post editor screens.
  5. **Admin Portal (`src/pages/AdminPortal.tsx`):** Create moderation queues for approving/rejecting user posts.
  6. **Final Linkage:** Merge Developer A and B paths, replace mock JSON events/images with real Firestore collections.
* **Files to Reference:** [combined.min.js](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/combined.min.js), [write.html](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/write.html), [browse.html](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/browse.html), [login.html](file:///c:/Users/hamzz/Desktop/Github/blog/legacy-site/login.html)
* **Skills Involved:** Firebase SDK (Firestore, Auth, Storage), React Context state, routing authorization guards, Git merge coordination.
* **Full Guide:** [delegation_dev_c.md](file:///c:/Users/hamzz/Desktop/Github/blog/delegation_dev_c.md)
