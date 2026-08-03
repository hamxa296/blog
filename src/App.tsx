import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import FloatingMenu from './components/nav/FloatingMenu';
import GlobalBackButton from './components/nav/GlobalBackButton';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Home } from './pages/Home';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { FreshmanGuide } from './pages/FreshmanGuide';
import { GuideErrorBoundary } from './components/guide/GuideErrorBoundary';
import { Gallery } from './pages/Gallery';
import { CampusMap } from './pages/CampusMap';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Profile } from './pages/Profile';
import { WritePost } from './pages/WritePost';
import { CmsDashboard } from './pages/CmsDashboard';
import { CmsRoute } from './components/CmsRoute';
import { BlogBrowse } from './pages/BlogBrowse';
import { BlogPostDetail } from './pages/BlogPostDetail';

function AppShell() {
  return (
    <div className="flex flex-col min-h-screen relative z-10 bg-background text-foreground">
      <GlobalBackButton />
      <div className="flex-grow relative z-30">
        <Outlet />
      </div>
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
