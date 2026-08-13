import { createBrowserRouter, RouterProvider, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import FloatingMenu from './components/nav/FloatingMenu';
import GlobalBackButton from './components/nav/GlobalBackButton';
import Footer from './components/nav/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CmsRoute } from './components/CmsRoute';
import { GuideErrorBoundary } from './components/guide/GuideErrorBoundary';

import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const About = lazy(() => import('./pages/About').then(module => ({ default: module.About })));
const Contact = lazy(() => import('./pages/Contact').then(module => ({ default: module.Contact })));
const FreshmanGuide = lazy(() => import('./pages/FreshmanGuide').then(module => ({ default: module.FreshmanGuide })));
const Gallery = lazy(() => import('./pages/Gallery').then(module => ({ default: module.Gallery })));
const CampusMap = lazy(() => import('./pages/CampusMap').then(module => ({ default: module.CampusMap })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Signup = lazy(() => import('./pages/Signup').then(module => ({ default: module.Signup })));
const Profile = lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const WritePost = lazy(() => import('./pages/WritePost').then(module => ({ default: module.WritePost })));
const CmsDashboard = lazy(() => import('./pages/CmsDashboard').then(module => ({ default: module.CmsDashboard })));
const BlogBrowse = lazy(() => import('./pages/BlogBrowse').then(module => ({ default: module.BlogBrowse })));
const BlogPostDetail = lazy(() => import('./pages/BlogPostDetail').then(module => ({ default: module.BlogPostDetail })));
const NotFound = lazy(() => import('./pages/NotFound').then(module => ({ default: module.NotFound })));

function AppShell() {
  const location = useLocation();
  const outlet = useOutlet();
  
  return (
    <div className="flex flex-col min-h-screen relative z-10 bg-[#08080a] text-foreground overflow-x-hidden">
      {/* Global Grainy Overlay */}
      <div 
        className="pointer-events-none fixed inset-0 z-[100] opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      <GlobalBackButton />
      <div className="flex-grow relative z-30 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex-grow flex flex-col w-full"
          >
            <Suspense fallback={<div className="flex-grow flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
              {outlet}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
      <Footer />
      <FloatingMenu />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      { path: 'contact', element: <Contact /> },
      { path: 'guide', element: <GuideErrorBoundary><FreshmanGuide /></GuideErrorBoundary> },
      { path: 'gallery', element: <Gallery /> },
      { path: 'map', element: <CampusMap /> },
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <Signup /> },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: 'write',
        element: (
          <ProtectedRoute>
            <WritePost />
          </ProtectedRoute>
        ),
      },
      {
        path: 'cms',
        element: (
          <CmsRoute>
            <CmsDashboard />
          </CmsRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <CmsRoute allowedRoles={['admin']}>
            <CmsDashboard />
          </CmsRoute>
        ),
      },
      { path: 'browse', element: <BlogBrowse /> },
      { path: 'posts/:id', element: <BlogPostDetail /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
