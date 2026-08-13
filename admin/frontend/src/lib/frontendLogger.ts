import envLoader from "@/utils/envLoader";

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  userAgent: string;
  url: string;
}

class RemoteLogger {
  private apiUrl: string;
  private isProduction: boolean;
  private queue: LogPayload[] = [];
  private flushInterval: number = 5000;
  private maxQueueSize: number = 50;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.apiUrl = envLoader.LOG_API_URL || "/api/logs";
    this.isProduction = true;

    if (this.isProduction) {
      this.startFlushTimer();
    }

    window.addEventListener("beforeunload", () => this.flush(true));
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
  }

  private createPayload(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
  ): LogPayload {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }

  private async sendLog(payload: LogPayload): Promise<void> {
    try {
      await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Failed to send log to server:", error);
    }
  }

  private async flush(sync: boolean = false): Promise<void> {
    if (this.queue.length === 0) return;

    const logsToSend = [...this.queue];
    this.queue = [];

    if (sync) {
      const blob = new Blob([JSON.stringify(logsToSend)], {
        type: "application/json",
      });
      navigator.sendBeacon(this.apiUrl, blob);
    } else {
      await Promise.all(logsToSend.map((log) => this.sendLog(log)));
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const payload = this.createPayload(level, message, context);

    if (this.isProduction) {
      this.queue.push(payload);

      // If queue is full then flush
      if (level === "error" || this.queue.length >= this.maxQueueSize) {
        this.flush();
      }
    }
  }

  public info(message: string, context?: Record<string, any>): void {
    this.log("info", message, context);
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.log("warn", message, context);
  }

  public error(message: string, context?: Record<string, any>): void {
    this.log("error", message, context);
  }

  public debug(message: string, context?: Record<string, any>): void {
    this.log("debug", message, context);
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

export const remoteLogger = new RemoteLogger();

// Map original console
const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
};

function argsToString(args: any[]): string {
  return args
    .map((arg) => {
      if (typeof arg === "object") {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(" ");
}

function argsToContext(args: any[]): Record<string, any> | undefined {
  const objects = args.filter((arg) => typeof arg === "object" && arg !== null);
  if (objects.length === 0) return undefined;

  try {
    return objects.length === 1 ? objects[0] : { args: objects };
  } catch {
    return undefined;
  }
}

// Override console methods
console.log = (...args: any[]) => {
  originalConsole.log(...args);
  remoteLogger.info(argsToString(args), argsToContext(args));
};

console.warn = (...args: any[]) => {
  originalConsole.warn(...args);
  remoteLogger.warn(argsToString(args), argsToContext(args));
};

console.error = (...args: any[]) => {
  originalConsole.error(...args);
  const error = args.find((a) => a instanceof Error);
  const context = error
    ? {
        stack: error.stack,
        name: error.name,
        ...argsToContext(args),
      }
    : argsToContext(args);

  remoteLogger.error(argsToString(args), context);
};

console.debug = (...args: any[]) => {
  originalConsole.debug(...args);
  remoteLogger.debug(argsToString(args), argsToContext(args));
};

// Capture unhandled errors
window.addEventListener("error", (event) => {
  remoteLogger.error("Unhandled error", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
  });
});

// Capture unhandled promise rejection
window.addEventListener("unhandledrejection", (event) => {
  remoteLogger.error("Unhandled promise rejection", {
    reason: String(event.reason),
    promise: String(event.promise),
  });
});

export const originalConsoleLog = originalConsole;
