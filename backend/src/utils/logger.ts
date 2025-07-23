enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

interface LogOptions {
  context?: string; // назва файлу/функції
  requestId?: string; // ID запиту для трасування
  userId?: number; // ID користувача
  [key: string]: any; // Додаткові дані
}

const isProduction = process.env.NODE_ENV === "production";

function formatLog(level: LogLevel, message: string, options?: LogOptions) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...options, // додаткові опції
  };

  if (isProduction) {
    // У продакшені виводимо JSON для легшого парсингу лог-агрегаторами
    console.log(JSON.stringify(logEntry));
  } else {
    // більш читабельний формат у розробці
    const context = options?.context ? `[${options.context}]` : "";
    const reqId = options?.requestId ? `[ReqID: ${options.requestId}]` : "";
    const usrId = options?.userId ? `[UserID: ${options.userId}]` : "";

    const baseLogMessage = `[${timestamp}] ${level} ${context} ${reqId} ${usrId} - ${message}`;

    if (options && Object.keys(options).length > 0) {
      // Якщо є опції, виводимо їх як другий аргумент
      console.log(baseLogMessage, options);
    } else {
      // Якщо опцій немає або вони порожні, виводимо тільки базове повідомлення
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
