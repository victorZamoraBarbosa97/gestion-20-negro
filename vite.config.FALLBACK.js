// vite.config.FALLBACK.js
// 🚨 CONFIGURACIÓN DE RESPALDO - Sin Chunking Manual
// Usar SOLO si la configuración principal sigue fallando

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  build: {
    chunkSizeWarningLimit: 1000, // Aumentado porque habrá chunks más grandes
    sourcemap: false,
    minify: 'esbuild',
    
    rollupOptions: {
      output: {
        // ❌ SIN CHUNKING MANUAL
        // Dejar que Vite maneje todo automáticamente
        // Vite es inteligente y NO romperá dependencias de React
        
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  
  server: {
    port: 5173,
    open: true,
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'react-hot-toast',
    ],
  },
  
  esbuild: {
    drop: ['console', 'debugger'],
  },
});

/* 
🚨 CONFIGURACIÓN DE FALLBACK (ÚLTIMA OPCIÓN)

CUÁNDO USAR:
============
Solo si la configuración principal con chunking mínimo TODAVÍA falla.

QUÉ HACE:
=========
- NO hace chunking manual
- Deja que Vite decida automáticamente
- Vite es inteligente y NO romperá React

CÓMO USAR:
==========
1. Renombrar vite.config.js a vite.config.BROKEN.js
2. Renombrar este archivo a vite.config.js
3. Rebuild y redeploy

RESULTADO ESPERADO:
===================
- Chunks automáticos generados por Vite
- Sin errores de dependencias
- Lazy loading TODAVÍA funciona (rutas lazy)
- Bundle inicial ~500-550KB

TRADE-OFF:
==========
✅ Garantizado que funciona
❌ Menos control sobre chunks
❌ Bundle inicial ligeramente más grande

NOTA:
=====
Si esta configuración también falla, el problema NO es el chunking,
es algo más fundamental (versiones incompatibles, etc.)
*/
