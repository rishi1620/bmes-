import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Global resilience handler: gracefully handle stale refresh token rejections before they bubble as fatal errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = (
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
        ? reason
        : (reason as { message?: string })?.message || ''
    ).toLowerCase();

    if (
      msg.includes('refresh token') ||
      msg.includes('failed to refresh token') ||
      msg.includes('invalid_grant') ||
      msg.includes('session_not_found')
    ) {
      event.preventDefault();
      console.warn('[Session Notice] Handled expired auth session gracefully.');
    }
  });
}

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
