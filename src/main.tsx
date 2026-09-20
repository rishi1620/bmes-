import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ensure any stale service worker is immediately unregistered to avoid intercepting /api requests
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  }).catch(() => {});
}

// Clear any Workbox caches that might have cached broken responses
if (typeof window !== 'undefined' && 'caches' in window) {
  caches.keys().then((names) => {
    for (const name of names) {
      if (name.includes('workbox') || name.includes('offline-form')) {
        caches.delete(name);
      }
    }
  }).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
