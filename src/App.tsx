import { useState } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { logoutUser } from './services/firebase';

import { Home } from './pages/Home';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { FreshmanGuide } from './pages/FreshmanGuide';
import { GuideErrorBoundary } from './components/guide/GuideErrorBoundary';
import { Calendar } from './pages/Calendar';
import { Gallery } from './pages/Gallery';
import { CampusMap } from './pages/CampusMap';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Profile } from './pages/Profile';
import { WritePost } from './pages/WritePost';
import { AdminPortal } from './pages/AdminPortal';
import { BlogBrowse } from './pages/BlogBrowse';
import { BlogPostDetail } from './pages/BlogPostDetail';

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile } = useAuth();

  const mergedUser = user
    ? {
        uid: user.uid,
        email: user.email,
        displayName: profile?.displayName || user.displayName || user.email?.split('@')[0],
        photoURL: profile?.photoURL || user.photoURL || '',
        isAdmin: profile?.isAdmin || false,
      }
    : null;

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <div className="flex flex-col h-screen relative z-10 overflow-hidden app-background bg-cover bg-center bg-no-repeat bg-fixed">
      <div className="absolute inset-0 app-overlay -z-10 pointer-events-none" />

      <Navbar onSidebarToggle={() => setSidebarOpen(true)} user={mergedUser} />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={mergedUser}
        onLogout={handleLogout}
      />

      <div className="flex-grow min-h-0 overflow-y-auto relative z-30">
        <Outlet />
      </div>
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
      { path: 'calendar', element: <Calendar /> },
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
        path: 'admin',
        element: (
          <ProtectedRoute requireAdmin={true}>
            <AdminPortal />
          </ProtectedRoute>
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
