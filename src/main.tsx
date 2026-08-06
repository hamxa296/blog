import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found — ensure index.html contains <div id="root"></div>')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

async function clearLegacyServiceWorkerAndCaches() {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      const unregisterResults = await Promise.allSettled(
        registrations.map((registration) => registration.unregister()),
      )
      unregisterResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn('Failed to unregister service worker:', registrations[index]?.scope, result.reason)
        }
      })
    } catch (err) {
      console.warn('Failed to enumerate service worker registrations:', err)
    }
  }

  if ('caches' in window) {
    try {
      const names = await caches.keys()
      const deleteResults = await Promise.allSettled(names.map((name) => caches.delete(name)))
      deleteResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`Failed to delete cache "${names[index]}":`, result.reason)
        } else if (result.value === false) {
          console.warn(`Cache "${names[index]}" was not found during deletion`)
        }
      })
    } catch (err) {
      console.warn('Failed to clear caches:', err)
    }
  }
}

void clearLegacyServiceWorkerAndCaches()
