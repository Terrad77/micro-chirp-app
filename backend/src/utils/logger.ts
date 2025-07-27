enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

interface LogOptions {
  context?: string; // name of the file/function
  requestId?: string; // request ID for tracing
  userId?: number; // user ID
  [key: string]: any; // Additional data
}

const isProduction = process.env.NODE_ENV === "production";

function formatLog(level: LogLevel, message: string, options?: LogOptions) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...options, // additional options
  };

  if (isProduction) {
    // in production, log in JSON format
    console.log(JSON.stringify(logEntry));
  } else {
    // more readable format in development
    const context = options?.context ? `[${options.context}]` : "";
    const reqId = options?.requestId ? `[ReqID: ${options.requestId}]` : "";
    const usrId = options?.userId ? `[UserID: ${options.userId}]` : "";

    const baseLogMessage = `[${timestamp}] ${level} ${context} ${reqId} ${usrId} - ${message}`;

    if (options && Object.keys(options).length > 0) {
      // if options are provided, log them as well
      console.log(baseLogMessage, options);
    } else {
      // if no options, just log the base message
      console.log(baseLogMessage);
    }
  }
}

export const logger = {
  info: (message: string, options?: LogOptions) =>
    formatLog(LogLevel.INFO, message, options),
  warn: (message: string, options?: LogOptions) =>
    formatLog(LogLevel.WARN, message, options),
  error: (message: string, error: Error | any, options?: LogOptions) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    formatLog(LogLevel.ERROR, message, {
      ...options,
      error: errorMessage,
      stack,
    });
  },
  debug: (message: string, options?: LogOptions) => {
    if (!isProduction) {
      // Дебаг-логи тільки в розробці
      formatLog(LogLevel.DEBUG, message, options);
    }
  },
};
