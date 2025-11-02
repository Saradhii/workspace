// Structured logging system for development and production

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown> | undefined;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        ...(error.stack && { stack: error.stack }),
      };
    }

    return entry;
  }

  private log(entry: LogEntry) {
    // In production, we might send logs to a service like Datadog, LogRocket, etc.
    if (!this.isDevelopment) {
      // Production logging - could send to external service
      // For now, we'll only log errors in production
      if (entry.level === 'error') {
        // Send to error tracking service
        if (typeof window !== 'undefined') {
          console.error(JSON.stringify(entry));
        }
      }
      return;
    }

    // Development logging
    const logMethod = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
    }[entry.level];

    if (entry.context) {
      logMethod(`[${entry.level.toUpperCase()}] ${entry.message}`, entry.context);
    } else {
      logMethod(`[${entry.level.toUpperCase()}] ${entry.message}`);
    }

    if (entry.error) {
      console.error(entry.error);
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log(this.createLogEntry('debug', message, context));
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log(this.createLogEntry('info', message, context));
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log(this.createLogEntry('warn', message, context));
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log(this.createLogEntry('error', message, context, error));
  }

  // Specific logging methods for common operations
  apiRequest(method: string, url: string, context?: Record<string, unknown>) {
    this.debug(`API Request: ${method} ${url}`, {
      method,
      url,
      ...context,
    });
  }

  apiResponse(method: string, url: string, status: number, duration: number) {
    this.debug(`API Response: ${method} ${url} - ${status} (${duration}ms)`, {
      method,
      url,
      status,
      duration,
    });
  }

  userAction(action: string, context?: Record<string, unknown>) {
    this.info(`User Action: ${action}`, context);
  }

  performance(operation: string, duration: number, context?: Record<string, unknown>) {
    this.info(`Performance: ${operation} took ${duration}ms`, context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  debug: (message: string, context?: Record<string, unknown>) => logger.debug(message, context),
  info: (message: string, context?: Record<string, unknown>) => logger.info(message, context),
  warn: (message: string, context?: Record<string, unknown>) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: Record<string, unknown>) => logger.error(message, error, context),
  api: {
    request: (method: string, url: string, context?: Record<string, unknown>) => logger.apiRequest(method, url, context),
    response: (method: string, url: string, status: number, duration: number) => logger.apiResponse(method, url, status, duration),
  },
  user: (action: string, context?: Record<string, unknown>) => logger.userAction(action, context),
  perf: (operation: string, duration: number, context?: Record<string, unknown>) => logger.performance(operation, duration, context),
};