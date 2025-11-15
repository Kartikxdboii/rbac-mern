export interface LogContext {
  correlationId?: string;
  userId?: number;
  userRole?: string;
  requestId?: string;
  timestamp?: Date;
}
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}
export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  data?: Record<string, any>;
  error?: Error;
  timestamp: Date;
}
export class Logger {
  private context: LogContext;
  constructor(context?: LogContext) {
    this.context = context || {};
  }
  private formatLog(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const correlationId = entry.context?.correlationId || "N/A";
    const userId = entry.context?.userId || "N/A";
    const role = entry.context?.userRole || "N/A";
    let log = `[${timestamp}] [${entry.level}] [${correlationId}] [User: ${userId}/${role}] ${entry.message}`;
    if (entry.data) {
      log += ` ${JSON.stringify(entry.data)}`;
    }
    if (entry.error) {
      log += `\n${entry.error.stack}`;
    }
    return log;
  }
  private log(level: LogLevel, message: string, data?: Record<string, any>, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      context: this.context,
      data,
      error,
      timestamp: new Date(),
    };
    const formatted = this.formatLog(entry);
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }
  }
  debug(message: string, data?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, data);
  }
  info(message: string, data?: Record<string, any>) {
    this.log(LogLevel.INFO, message, data);
  }
  warn(message: string, data?: Record<string, any>) {
    this.log(LogLevel.WARN, message, data);
  }
  error(message: string, error?: Error, data?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, data, error);
  }
  logAuthorizationEvent(
    action: string,
    resource: string,
    allowed: boolean,
    reason?: string
  ) {
    const message = `Authorization ${allowed ? "granted" : "denied"}: ${action} on ${resource}`;
    const data = {
      action,
      resource,
      allowed,
      reason,
    };
    if (allowed) {
      this.info(message, data);
    } else {
      this.warn(message, data);
    }
  }
  logRequest(method: string, path: string, statusCode: number, duration: number) {
    this.info(`${method} ${path} ${statusCode}`, {
      method,
      path,
      statusCode,
      duration,
    });
  }
  logRequestError(method: string, path: string, error: Error, statusCode: number) {
    this.error(`${method} ${path} ${statusCode}`, error, {
      method,
      path,
      statusCode,
    });
  }
  child(additionalContext: LogContext): Logger {
    return new Logger({
      ...this.context,
      ...additionalContext,
    });
  }
}
export const logger = new Logger();
export function createLoggerWithCorrelationId(correlationId: string): Logger {
  return logger.child({ correlationId });
}

