/**
 * Error Boundary Component
 * Captura errores en cualquier componente hijo y muestra un fallback UI
 * 
 * Uso:
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */

import React from 'react';
import ErrorFallback from './ErrorFallback';
import { logger } from '../utils/logger';
import { isOperationalError } from '../utils/errorHandler';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Este método se llama cuando un error es lanzado en un componente hijo
   */
  static getDerivedStateFromError(error) {
    // Actualizar el estado para mostrar el fallback UI
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Este método se llama después de que un error ha sido capturado
   * Aquí podemos hacer logging o enviar el error a un servicio externo
   */
  componentDidCatch(error, errorInfo) {
    // Log del error
    logger.error('Error capturado por ErrorBoundary', error, {
      componentStack: errorInfo.componentStack,
      isOperational: isOperationalError(error),
    });

    // Guardar información adicional del error
    this.setState({
      errorInfo,
    });

    // Aquí podrías enviar el error a un servicio como Sentry
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  /**
   * Resetea el error boundary para intentar de nuevo
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Si hay un callback de reset, ejecutarlo
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Usar el componente de fallback custom si se proporciona
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          resetError: this.resetError,
        });
      }

      // Usar el componente de fallback por defecto
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
        />
      );
    }

    // Si no hay error, renderizar los children normalmente
    return this.props.children;
  }
}

/**
 * Hook para usar error boundaries de forma funcional
 * Útil para errores asíncronos que no son capturados por ErrorBoundary
 */
export function useErrorHandler() {
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}

/**
 * Componente wrapper que proporciona un error boundary con configuración específica
 */
export function withErrorBoundary(Component, errorBoundaryProps = {}) {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

export default ErrorBoundary;
