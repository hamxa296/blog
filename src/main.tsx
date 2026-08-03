import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Unregister Service Worker completely to fix caching issues and ensure users get the latest version
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister().then(() => {
        console.log('Unregistered service worker');
      });
    }
  });
  
  // Clear all caches
  if (window.caches) {
    caches.keys().then(names => {
      for (const name of names) {
        caches.delete(name);
      }
    });
  }
}
