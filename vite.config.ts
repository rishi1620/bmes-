import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "0.0.0.0",
    port: 3000,
    hmr: {
      overlay: false,
    },
  },
  css: {
    postcss: "./postcss.config.js",
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "placeholder.svg",
        "robots.txt",
        "sitemap.xml",
      ],
      manifest: {
        id: "/",
        name: "CUET BMES Portal",
        short_name: "BMES",
        description: "Official portal for the CUET Biomedical Engineering Society.",
        theme_color: "#0f766e",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,woff,woff2}"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          // 1. Cache-first strategy for static images & visual assets
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache-v1",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
                purgeOnQuotaError: true,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 2. Cache-first strategy for web fonts (Google Fonts & static assets)
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache-v1",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 Year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 3. Cache-first strategy for compiled static styles, scripts, and fonts
          {
            urlPattern: ({ request }) =>
              request.destination === "script" ||
              request.destination === "style" ||
              request.destination === "font",
            handler: "CacheFirst",
            options: {
              cacheName: "static-resources-cache-v1",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 Days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 4. Background Sync policy for offline form submissions & persistent registrations
          {
            urlPattern: ({ url, request }) =>
              request.method === "POST" &&
              (url.pathname.includes("/api/send-confirmation") ||
                url.pathname.includes("/api/send-membership-confirmation") ||
                url.hostname.includes("supabase.co")),
            handler: "NetworkOnly",
            options: {
              backgroundSync: {
                name: "offline-form-submissions-queue",
                options: {
                  maxRetentionTime: 24 * 60, // Retry offline submissions for up to 24 hours (in minutes)
                },
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
}));
