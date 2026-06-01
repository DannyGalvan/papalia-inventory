/**
 * Unit tests for LogService.
 *
 * Verifies timestamp generation, newest-first ordering, FIFO eviction at the
 * 100-entry cap, and retrieval bounds.
 *
 * Requirements: 10.5
 */

import { LogEntry, LogServiceImpl } from './LogService';

describe('LogServiceImpl', () => {
  const sampleEntry: Omit<LogEntry, 'timestamp'> = {
    errorType: 'DatabaseError',
    source: 'ProductListScreen',
    operation: 'loadProducts',
    message: 'No se pudo cargar la lista',
  };

  it('adds an ISO 8601 timestamp to logged entries', () => {
    const service = new LogServiceImpl();
    service.logError(sampleEntry);

    const [entry] = service.getRecentLogs(1);
    expect(entry.timestamp).toBe(new Date(entry.timestamp).toISOString());
    expect(entry.errorType).toBe(sampleEntry.errorType);
    expect(entry.source).toBe(sampleEntry.source);
    expect(entry.operation).toBe(sampleEntry.operation);
    expect(entry.message).toBe(sampleEntry.message);
  });

  it('returns the most recent entries first', () => {
    const service = new LogServiceImpl();
    service.logError({ ...sampleEntry, message: 'first' });
    service.logError({ ...sampleEntry, message: 'second' });
    service.logError({ ...sampleEntry, message: 'third' });

    const recent = service.getRecentLogs(3);
    expect(recent.map(e => e.message)).toEqual(['third', 'second', 'first']);
  });

  it('caps the buffer at 100 entries using FIFO eviction', () => {
    const service = new LogServiceImpl();
    for (let i = 0; i < 150; i++) {
      service.logError({ ...sampleEntry, message: `entry-${i}` });
    }

    // Requesting more than the cap returns only what is retained.
    const all = service.getRecentLogs(1000);
    expect(all).toHaveLength(100);

    // The newest entry is at the front, the oldest retained is entry-50.
    expect(all[0].message).toBe('entry-149');
    expect(all[all.length - 1].message).toBe('entry-50');
  });

  it('returns at most the requested number of entries', () => {
    const service = new LogServiceImpl();
    for (let i = 0; i < 10; i++) {
      service.logError({ ...sampleEntry, message: `entry-${i}` });
    }

    expect(service.getRecentLogs(5)).toHaveLength(5);
  });

  it('returns an empty array for non-positive counts', () => {
    const service = new LogServiceImpl();
    service.logError(sampleEntry);

    expect(service.getRecentLogs(0)).toEqual([]);
    expect(service.getRecentLogs(-1)).toEqual([]);
  });
});
