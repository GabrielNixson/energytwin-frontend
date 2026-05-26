// @ts-nocheck
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";
import path from "path";

export default defineConfig(({ mode }) => ({
  base: "/",

  plugins: [
    react(),
    federation({
      name: "energyTwin",
      filename: "remoteEntry.js",

      exposes: {
        "./App": "./src/App.tsx",
      },

      shared: {
        react: {
          singleton: true,
          requiredVersion: "^18.2.0",
        },
        "react-dom": {
          singleton: true,
          requiredVersion: "^18.2.0",
        },
        "react-router-dom": {
          singleton: true,
          requiredVersion: "^6.20.0",
          eager: true,
        },
        three: {
          singleton: true,
        },
        "framer-motion": {
          singleton: true,
        },
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    host: true,
    port: 5003,
    strictPort: true,
    cors: true,
    open: true,
    proxy: {
      // ── Backend API ────────────────────────────────────────────────
      // All /api/* calls are forwarded to the backend.
      // From the browser's perspective everything comes from localhost:5003,
      // so httpOnly cookies are stored and re-sent without any CORS issues.
      '/api': {
        target: 'http://192.168.21.114:3000',
        changeOrigin: true,
        secure: false,
        // Strip the domain attribute from cookies so they are stored on the current requesting host (works for localhost and local network IPs like 192.168.1.100)
        cookieDomainRewrite: {
          '*': '',
        },
      },
      // ── WebSocket (Socket.io) ──────────────────────────────────────
      '/socket.io': {
        target: 'http://192.168.21.114:3500',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      // ── Existing proxies ───────────────────────────────────────────
      '/otlp': {
        target: 'http://185.100.212.76:4318',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/otlp/, ''),
      },
      '/sentry-proxy': {
        target: 'https://sentry.aalai.ai',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/sentry-proxy/, ''),
      },
    }
  },

  css: {
    preprocessorOptions: {
      scss: {
        api: "modern",
      },
    },
  },

  build: {
    target: "esnext",
    minify: mode === "production" ? "esbuild" : false,
    sourcemap: mode === "production" ? "hidden" : true,
    modulePreload: false,
    cssCodeSplit: false,
  },

  preview: {
    host: true,
    port: 5002,
    strictPort: true,
    cors: true,
  },

}));
