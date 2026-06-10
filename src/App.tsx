import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

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
  
  // Mock User State - to be connected to Firebase AuthContext later by Developer C
  const [mockUser, setMockUser] = useState<any>({
    uid: 'mock-uid-123',
    email: 'student@giki.edu.pk',
    displayName: 'GIKian Student',
    isAdmin: true, // Toggles Admin Portal visibility
  });

  const handleLogout = () => {
    setMockUser(null);
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen relative z-10">
        {/* Navigation Header */}
        <Navbar 
          onSidebarToggle={() => setSidebarOpen(true)} 
          user={mockUser} 
        />

        {/* Sidebar Drawer */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          user={mockUser}
          onLogout={handleLogout}
        />

        {/* Dynamic Route Pages */}
        <div className="flex-grow">
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
            <Route path="/profile" element={<Profile />} />
            <Route path="/write" element={<WritePost />} />
            <Route path="/admin" element={<AdminPortal />} />
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
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
