/**
 * Sistema de logging estructurado
 * Captura y registra todos los eventos importantes de la aplicación
 */

const LOG_LEVELS = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
};

class Logger {
  constructor() {
    this.environment = import.meta.env.MODE;
    this.isDevelopment = this.environment === "development";
  }

  /**
   * Crea una entrada de log estructurada
   */
  createLogEntry(level, message, meta = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: this.environment,
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...meta,
    };
  }

  /**
   * Envía logs a un servicio externo en producción
   * Puedes integrar servicios como Sentry, LogRocket, etc.
   */
  sendToExternalService(logEntry) {
    // TODO: Integrar con servicio de logging externo
    // Ejemplos:
    // - Sentry.captureMessage(logEntry.message, { level: logEntry.level, extra: logEntry });
    // - fetch('/api/logs', { method: 'POST', body: JSON.stringify(logEntry) });

    // Por ahora, solo enviamos errores en producción a console
    if (!this.isDevelopment && logEntry.level === LOG_LEVELS.ERROR) {
      console.error("Production Error:", logEntry);
    }
  }

  /**
   * Log de nivel DEBUG (solo en desarrollo)
   */
  debug(message, meta = {}) {
    if (!this.isDevelopment) return;

    console.debug(`🔍 [DEBUG] ${message}`, meta);
  }

  /**
   * Log de nivel INFO
   */
  info(message, meta = {}) {
    const logEntry = this.createLogEntry(LOG_LEVELS.INFO, message, meta);

    if (this.isDevelopment) {
      // console.info(`ℹ️ [INFO] ${message}`, meta);
    }

    this.sendToExternalService(logEntry);
  }

  /**
   * Log de nivel WARN
   */
  warn(message, meta = {}) {
    const logEntry = this.createLogEntry(LOG_LEVELS.WARN, message, meta);

    console.warn(`⚠️ [WARN] ${message}`, meta);
    this.sendToExternalService(logEntry);
  }

  /**
   * Log de nivel ERROR
   */
  error(message, error, meta = {}) {
    const errorDetails = error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code,
          ...(error.response && { response: error.response }),
        }
      : {};

    const logEntry = this.createLogEntry(LOG_LEVELS.ERROR, message, {
      ...meta,
      error: errorDetails,
    });

    console.error(`❌ [ERROR] ${message}`, {
      error: errorDetails,
      meta,
    });

    this.sendToExternalService(logEntry);
  }
}

// Exportar instancia singleton
export const logger = new Logger();

// Exportar constantes
export { LOG_LEVELS };

export default logger;
