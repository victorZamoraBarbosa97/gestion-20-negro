// vite.config.js
// ✨ CONFIGURACIÓN ULTRA-SEGURA - Chunking Mínimo

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  darkMode: "class",
  plugins: [react(), tailwindcss()],

  build: {
    chunkSizeWarningLimit: 500,
    sourcemap: false,
    minify: "esbuild",

    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            // SOLO separar Firebase (grande y 100% independiente)
            if (id.includes("firebase") || id.includes("@firebase")) {
              return "vendor-firebase";
            }

            // SOLO separar Charts (lazy loaded, independiente)
            if (id.includes("recharts")) {
              return "vendor-charts";
            }
            // TODO LO DEMÁS junto en vendor
            return "vendor";
          }
        },

        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },

  server: {
    port: 5173,
    open: true,
    headers: {
      // Permite comunicación correcta con el popup de login
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "firebase/app",
      "firebase/auth",
      "firebase/firestore",
      "react-hot-toast",
    ],
  },

  esbuild: {
    drop: ["console", "debugger"],
  },
});
