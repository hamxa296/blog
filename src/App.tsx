import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { logoutUser } from './services/firebase';

// Pages
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { FreshmanGuide } from './pages/FreshmanGuide';
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

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile } = useAuth();
  
  // Merge Firebase user and Firestore profile details
  const mergedUser = user ? {
    uid: user.uid,
    email: user.email,
    displayName: profile?.displayName || user.displayName || user.email?.split('@')[0],
    photoURL: profile?.photoURL || user.photoURL || '',
    isAdmin: profile?.isAdmin || false,
  } : null;

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <Router>
      <div className="flex flex-col h-screen relative z-10 overflow-hidden app-background bg-cover bg-center bg-no-repeat bg-fixed">
        {/* Background Overlay */}
        <div className="absolute inset-0 app-overlay -z-10 pointer-events-none" />
        
        {/* Navigation Header */}
        <Navbar 
          onSidebarToggle={() => setSidebarOpen(true)} 
          user={mergedUser} 
        />

        {/* Sidebar Drawer */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          user={mergedUser}
          onLogout={handleLogout}
        />

        {/* Dynamic Route Pages */}
        <div className="flex-grow min-h-0 overflow-y-auto relative z-30">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/guide" element={<FreshmanGuide />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/map" element={<CampusMap />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/write" 
              element={
                <ProtectedRoute>
                  <WritePost />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPortal />
                </ProtectedRoute>
              } 
            />
            <Route path="/browse" element={<BlogBrowse />} />
            <Route path="/posts/:id" element={<BlogPostDetail />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

