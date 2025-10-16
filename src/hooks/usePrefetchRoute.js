// src/hooks/usePrefetchRoute.js
// ✨ HOOK PARA PRELOADING INTELIGENTE DE RUTAS LAZY

import { useEffect, useRef } from 'react';

/**
 * Hook para precargar chunks de rutas lazy de forma inteligente
 * 
 * @param {Function} lazyImport - Función de import() del lazy component
 * @param {Object} options - Opciones de configuración
 * @param {number} options.delay - Delay antes de precargar (ms)
 * @param {boolean} options.onHover - Precargar en hover de link (futuro)
 * @param {boolean} options.onIdle - Precargar cuando el navegador está idle
 * 
 * @example
 * // En DashboardPage.jsx
 * import usePrefetchRoute from '../hooks/usePrefetchRoute';
 * 
 * function DashboardPage() {
 *   // Precargar ReportsPage después de 2 segundos
 *   usePrefetchRoute(() => import('../pages/ReportsPage'), { delay: 2000 });
 *   
 *   return <div>Dashboard Content</div>;
 * }
 */
const usePrefetchRoute = (lazyImport, options = {}) => {
  const {
    delay = 2000,
    onIdle = true,
    enabled = true,
  } = options;
  
  const hasPrefetched = useRef(false);
  
  useEffect(() => {
    if (!enabled || hasPrefetched.current) return;
    
    let timeoutId;
    let idleCallbackId;
    
    const prefetch = () => {
      if (hasPrefetched.current) return;
      
      console.log('[Prefetch] Precargando ruta...');
      lazyImport()
        .then(() => {
          console.log('[Prefetch] Ruta precargada exitosamente ✓');
          hasPrefetched.current = true;
        })
        .catch((error) => {
          console.warn('[Prefetch] Error al precargar ruta:', error);
        });
    };
    
    // Estrategia 1: Delay simple
    if (!onIdle) {
      timeoutId = setTimeout(prefetch, delay);
    }
    
    // Estrategia 2: requestIdleCallback (más inteligente)
    if (onIdle && 'requestIdleCallback' in window) {
      // Espera a que el navegador esté idle
      idleCallbackId = window.requestIdleCallback(
        () => {
          timeoutId = setTimeout(prefetch, delay);
        },
        { timeout: delay + 1000 }
      );
    } else if (onIdle) {
      // Fallback si requestIdleCallback no está disponible
      timeoutId = setTimeout(prefetch, delay);
    }
    
    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (idleCallbackId && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
    };
  }, [lazyImport, delay, onIdle, enabled]);
  
  return hasPrefetched.current;
};

export default usePrefetchRoute;

/* 
📝 CÓMO USAR ESTE HOOK:

CASO 1: Precargar ReportsPage desde DashboardPage
===================================================

// src/pages/DashboardPage.jsx
import usePrefetchRoute from '../hooks/usePrefetchRoute';

const DashboardPage = () => {
  // Precargar ReportsPage después de 2 segundos
  // Solo si el usuario está idle (no interactuando)
  usePrefetchRoute(
    () => import('../pages/ReportsPage'),
    { delay: 2000, onIdle: true }
  );
  
  return (
    // ... tu componente
  );
};


CASO 2: Precargar múltiples rutas
==================================

const DashboardPage = () => {
  // Precargar Reports
  usePrefetchRoute(
    () => import('../pages/ReportsPage'),
    { delay: 2000 }
  );
  
  // Precargar Settings (si existe)
  usePrefetchRoute(
    () => import('../pages/SettingsPage'),
    { delay: 4000 }
  );
  
  return (
    // ... tu componente
  );
};


CASO 3: Precargar condicionalmente
===================================

const DashboardPage = () => {
  const { user } = useAuth();
  const hasAccessToReports = user?.role === 'admin';
  
  // Solo precargar si el usuario tiene acceso
  usePrefetchRoute(
    () => import('../pages/ReportsPage'),
    { 
      delay: 2000,
      enabled: hasAccessToReports 
    }
  );
  
  return (
    // ... tu componente
  );
};


ESTRATEGIAS DE PREFETCH:
========================

1. DELAY CORTO (1-2 segundos):
   ✅ Para rutas que el usuario probablemente visitará
   ✅ Dashboard → Reports (alta probabilidad)
   ⚠️ Usa bandwidth incluso si el usuario no navega

2. DELAY LARGO (4-5 segundos):
   ✅ Para rutas secundarias
   ✅ Mejor para usuarios que se quedan en una página
   ⚠️ Puede ser demasiado tarde si el usuario navega rápido

3. ON IDLE (Recomendado):
   ✅ Espera a que el navegador no esté ocupado
   ✅ No interfiere con interacciones del usuario
   ✅ Mejor balance entre UX y performance
   ⚠️ No disponible en todos los navegadores (usa fallback)

4. CONDICIONAL:
   ✅ Solo precarga si tiene sentido
   ✅ Basado en rol, permisos, o comportamiento
   ✅ Ahorra bandwidth innecesario


IMPACTO EN PERFORMANCE:
=======================

Sin Prefetch:
  - Primera navegación a Reports: 200-400ms delay
  - Usuario nota un pequeño loading

Con Prefetch:
  - Primera navegación a Reports: ~0ms delay
  - Transición instantánea
  - Mejor UX

Trade-off:
  - Usa ~180KB de bandwidth extra
  - Solo si el usuario no navega a Reports, es "desperdicio"
  - Generalmente vale la pena para rutas frecuentes


CUANDO USAR:
============

✅ USA PREFETCH PARA:
  - Rutas que el 70%+ de usuarios visitan
  - Transiciones críticas del flujo principal
  - Rutas desde páginas donde los usuarios pasan tiempo

❌ NO USES PREFETCH PARA:
  - Rutas que pocos usuarios visitan
  - Features opcionales o avanzadas
  - Páginas de settings o configuración
  - Si tienes limitaciones de bandwidth

MONITOREO:
==========

Para verificar que el prefetch funciona:

1. Abre DevTools → Network tab
2. Navega a Dashboard
3. Espera 2 segundos
4. Verás que ReportsPage se descarga automáticamente
5. Al hacer click en "Reports", carga instantánea

En la consola verás:
  [Prefetch] Precargando ruta...
  [Prefetch] Ruta precargada exitosamente ✓


MEJORAS FUTURAS:
================

Podrías extender este hook para:

1. Prefetch on hover (cuando el mouse pasa sobre el link)
2. Prefetch on viewport (cuando el link es visible)
3. Prefetch basado en ML (predecir navegación del usuario)
4. Prefetch adaptativo (basado en connection speed)

*/
