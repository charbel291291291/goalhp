import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'icon-192.svg',
        'icon-512.svg',
        'icon-192.png',
        'icon-512.png',
        'apple-touch-icon.png',
      ],
      manifest: {
        name: 'QuizGoal 2026 - World Cup Quiz & Predictions',
        short_name: 'QuizGoal',
        description: 'Battle. Predict. Share. Win. - World Cup 2026 Quiz Battle, Predictions & Social Arena',
        theme_color: '#0a1628',
        background_color: '#0a1628',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'en',
        dir: 'ltr',
        categories: ['games', 'sports', 'entertainment', 'social'],
        id: 'com.quizgoal2026.app',
        prefer_related_applications: false,
        shortcuts: [
          { name: 'Arena', short_name: 'Arena', description: 'Social Arena Wall', url: '/arena', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
          { name: 'Battle', short_name: 'Battle', description: 'Start a Quiz Battle', url: '/battle', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
          { name: 'Schedule', short_name: 'Schedule', description: 'Match Schedule', url: '/schedule', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
        ],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
        ],
        screenshots: [
          { src: '/screenshot-home.png', sizes: '1080x1920', type: 'image/png', form_factor: 'narrow', label: 'Home Dashboard' },
          { src: '/scheduler-wide.png', sizes: '1920x1080', type: 'image/png', form_factor: 'wide', label: 'Arena Wall' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /^https?:\/\/.*\.supabase\.co\/storage\/v1\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https?:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
