/**
 * Advanced Logging & Monitoring
 * Structured logging, performance tracking, user session tracking
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: any;
  stack?: string;
}

/**
 * Advanced logger with multiple output channels
 */
class AdvancedLogger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 500;
  private isDevelopment: boolean = process.env.NODE_ENV === 'development';

  log(level: LogLevel, module: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data,
    };

    // Store in memory
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with color coding
    this.outputToConsole(entry);

    // In production, send errors to tracking service
    if (!this.isDevelopment && level === 'error') {
      this.sendToTrackingService(entry);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const prefix = `[${entry.module}]`;
    const colors = {
      debug: 'color: #666; font-size: 12px;',
      info: 'color: #0066cc; font-weight: bold;',
      warn: 'color: #ff9900; font-weight: bold;',
      error: 'color: #cc0000; font-weight: bold;',
    };

    const emoji = {
      debug: '🔍',
      info: '✓',
      warn: '⚠',
      error: '✗',
    };

    console.log(
      `%c${emoji[entry.level]} ${prefix} ${entry.message}`,
      colors[entry.level],
      entry.data || ''
    );

    if (entry.stack) {
      console.error(entry.stack);
    }
  }

  private sendToTrackingService(entry: LogEntry): void {
    // In production, send to error tracking service (e.g., Sentry, LogRocket)
    try {
      // Example: window.errorTracker?.captureException(entry);
      console.debug('[Tracking] Sent to service:', entry);
    } catch (e) {
      console.error('Failed to send log to tracking service', e);
    }
  }

  debug(module: string, message: string, data?: any): void {
    this.log('debug', module, message, data);
  }

  info(module: string, message: string, data?: any): void {
    this.log('info', module, message, data);
  }

  warn(module: string, message: string, data?: any): void {
    this.log('warn', module, message, data);
  }

  error(module: string, message: string, err?: Error | any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      module,
      message,
      data: err instanceof Error ? err.message : err,
      stack: err instanceof Error ? err.stack : undefined,
    };
    this.log('error', module, message, err);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    return level ? this.logs.filter(log => log.level === level) : this.logs;
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

/**
 * Performance monitor for tracking operations
 */
class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measurements: Array<{ name: string; duration: number; timestamp: string }> = [];
  private maxMeasurements: number = 100;

  start(label: string): void {
    this.marks.set(label, performance.now());
    logger.debug('Performance', `Started timer: ${label}`);
  }

  end(label: string): number {
    const startTime = this.marks.get(label);
    if (!startTime) {
      logger.warn('Performance', `Timer not started: ${label}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(label);

    this.measurements.push({
      name: label,
      duration,
      timestamp: new Date().toISOString(),
    });

    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift();
    }

    if (duration > 1000) {
      logger.warn('Performance', `Slow operation: ${label}`, { duration: `${duration.toFixed(2)}ms` });
    } else {
      logger.debug('Performance', `${label} completed`, { duration: `${duration.toFixed(2)}ms` });
    }

    return duration;
  }

  getMeasurements(): Array<{ name: string; duration: number; timestamp: string }> {
    return this.measurements;
  }

  getAverageDuration(label: string): number {
    const relevant = this.measurements.filter(m => m.name === label);
    if (relevant.length === 0) return 0;
    const total = relevant.reduce((sum, m) => sum + m.duration, 0);
    return total / relevant.length;
  }

  clearMeasurements(): void {
    this.measurements = [];
  }
}

/**
 * User session tracker
 */
class SessionTracker {
  private sessionId: string;
  private startTime: number;
  private events: Array<{ type: string; timestamp: string; data?: any }> = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    logger.info('Session', 'Session started', { sessionId: this.sessionId });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  trackEvent(type: string, data?: any): void {
    this.events.push({
      type,
      timestamp: new Date().toISOString(),
      data,
    });
    logger.debug('Session', `Event: ${type}`, data);
  }

  getSessionDuration(): number {
    return Date.now() - this.startTime;
  }

  getSessionInfo(): {
    sessionId: string;
    duration: number;
    eventCount: number;
    events: Array<{ type: string; timestamp: string; data?: any }>;
  } {
    return {
      sessionId: this.sessionId,
      duration: this.getSessionDuration(),
      eventCount: this.events.length,
      events: this.events,
    };
  }

  clearEvents(): void {
    this.events = [];
  }
}

// Export singleton instances
export const logger = new AdvancedLogger();
export const perfMonitor = new PerformanceMonitor();
export const sessionTracker = new SessionTracker();

/**
 * Utility function to log errors with context
 */
export function logErrorWithContext(
  module: string,
  context: string,
  error: Error | any
): void {
  logger.error(module, `${context}: ${error.message}`, error);
  perfMonitor.getMeasurements().slice(-5).forEach(m => {
    logger.debug('Performance', `Recent: ${m.name}`, { duration: m.duration });
  });
}

/**
 * Utility to measure async operations
 */
export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  perfMonitor.start(label);
  try {
    const result = await fn();
    perfMonitor.end(label);
    return result;
  } catch (error) {
    perfMonitor.end(label);
    throw error;
  }
}
