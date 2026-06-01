/**
 * Centralized in-memory error logging service.
 *
 * The `LogService` records structured error entries (timestamp, error type,
 * source screen/component, operation, and message) so that caught errors can
 * be inspected during a debugging session.
 *
 * Logs are kept in-memory only — they are NOT persisted to the database since
 * they are primarily useful for debugging the current session. The internal
 * buffer is capped at {@link MAX_ENTRIES} entries using FIFO eviction (the
 * oldest entry is dropped when the cap is exceeded).
 *
 * A singleton instance ({@link logService}) is exported so that services and
 * components share a single log buffer.
 *
 * Requirements: 10.5
 */

/**
 * A single structured error log record.
 */
export interface LogEntry {
  /** ISO 8601 timestamp of when the error was logged. */
  timestamp: string;
  /** The category/name of the error (e.g. the Error subclass name). */
  errorType: string;
  /** The screen or component where the error originated. */
  source: string;
  /** The operation being performed when the error occurred. */
  operation: string;
  /** A human-readable description of the error. */
  message: string;
}

/**
 * Contract for recording and retrieving error log entries.
 */
export interface LogService {
  /**
   * Record an error. The `timestamp` is generated automatically.
   */
  logError(entry: Omit<LogEntry, 'timestamp'>): void;
  /**
   * Return up to `count` of the most recent log entries, newest first.
   */
  getRecentLogs(count: number): LogEntry[];
}

/**
 * Default in-memory implementation of {@link LogService}.
 */
export class LogServiceImpl implements LogService {
  /** Newest entries are stored at the front of the array (index 0). */
  private logs: LogEntry[] = [];

  /** Maximum number of entries retained before FIFO eviction kicks in. */
  private readonly MAX_ENTRIES = 100;

  logError(entry: Omit<LogEntry, 'timestamp'>): void {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    // Newest first.
    this.logs.unshift(logEntry);

    // FIFO eviction: drop the oldest entry once the cap is exceeded.
    if (this.logs.length > this.MAX_ENTRIES) {
      this.logs.pop();
    }

    // Mirror to the console during development to aid debugging.
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error(
        `[${logEntry.source}] ${logEntry.operation}: ${logEntry.message}`,
      );
    }
  }

  getRecentLogs(count: number): LogEntry[] {
    if (count <= 0) {
      return [];
    }
    return this.logs.slice(0, count);
  }
}

/**
 * Shared singleton instance. Import this to log/read errors anywhere in the
 * app so that all consumers share the same in-memory buffer.
 */
export const logService: LogService = new LogServiceImpl();
