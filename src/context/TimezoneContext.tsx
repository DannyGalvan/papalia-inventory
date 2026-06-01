import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_TIMEZONE, KEY_TIMEZONE } from '../config/constants';
import { getConfigurationByKey, upsertConfiguration } from '../database/repository/ConfigurationRepository';

interface TimezoneContextValue {
  ianaTimezone: string;
  formatDate: (date: Date | string | null | undefined) => string;
  formatDateTime: (date: Date | string | null | undefined) => string;
  getTodayBounds: () => {fechaInicio: Date; fechaFin: Date};
  setTimezone: (ianaName: string) => Promise<void>;
}

const defaultContext: TimezoneContextValue = {
  ianaTimezone: DEFAULT_TIMEZONE,
  formatDate: () => '—',
  formatDateTime: () => '—',
  getTodayBounds: () => {
    const now = new Date();
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    return {fechaInicio: start, fechaFin: end};
  },
  setTimezone: async () => {},
};

const TimezoneContext = createContext<TimezoneContextValue>(defaultContext);

// ─── Core helper: UTC offset in ms for a given IANA timezone at a given moment ─
// Uses Intl.DateTimeFormat.formatToParts — reliable on Hermes and JSC.
// Avoids new Date(localeString) which returns Invalid Date on React Native.
function getUTCOffsetMs(ianaName: string, at: Date): number {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaName,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = fmt.formatToParts(at);
    const get = (type: string) =>
      parseInt(parts.find(p => p.type === type)?.value ?? '0', 10);

    const y = get('year');
    const mo = get('month') - 1;
    const d = get('day');
    const h = get('hour') % 24; // '24' → 0 for midnight edge case
    const m = get('minute');
    const s = get('second');

    // Interpret the local time components as if they were UTC,
    // then compute the difference to get the actual offset.
    const localAsUTC = Date.UTC(y, mo, d, h, m, s);
    return localAsUTC - at.getTime();
  } catch {
    return 0;
  }
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function partsInTz(date: Date, ianaName: string) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaName,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const get = (type: string) => parts.find(p => p.type === type)?.value ?? '00';
    return {
      day: get('day'),
      month: get('month'),
      year: get('year'),
      hour: get('hour') === '24' ? '00' : get('hour'),
      minute: get('minute'),
    };
  } catch {
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      day: pad(date.getDate()),
      month: pad(date.getMonth() + 1),
      year: String(date.getFullYear()),
      hour: pad(date.getHours()),
      minute: pad(date.getMinutes()),
    };
  }
}

function buildFormatDate(iana: string) {
  return (date: Date | string | null | undefined): string => {
    if (date == null) { return '—'; }
    // Guard against {isNitroSQLiteNull: true} or other non-Date objects from DB
    if (typeof date !== 'string' && !(date instanceof Date)) { return '—'; }
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) { return '—'; }
    const p = partsInTz(d, iana);
    return `${p.day}/${p.month}/${p.year}`;
  };
}

function buildFormatDateTime(iana: string) {
  return (date: Date | string | null | undefined): string => {
    if (date == null) { return '—'; }
    // Guard against {isNitroSQLiteNull: true} or other non-Date objects from DB
    if (typeof date !== 'string' && !(date instanceof Date)) { return '—'; }
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) { return '—'; }
    const p = partsInTz(d, iana);
    return `${p.day}/${p.month}/${p.year}   ${p.hour}:${p.minute}`;
  };
}

// ─── Today bounds ─────────────────────────────────────────────────────────────

function buildGetTodayBounds(iana: string) {
  return (): {fechaInicio: Date; fechaFin: Date} => {
    const now = new Date();
    const offsetMs = getUTCOffsetMs(iana, now);

    // Shift "now" to local calendar date in the target timezone
    const localNow = new Date(now.getTime() + offsetMs);
    const y = localNow.getUTCFullYear();
    const mo = localNow.getUTCMonth();
    const d = localNow.getUTCDate();

    // UTC time that corresponds to 00:00:00 in the target timezone
    const fechaInicio = new Date(Date.UTC(y, mo, d, 0, 0, 0, 0) - offsetMs);
    const fechaFin = new Date(fechaInicio.getTime() + 24 * 60 * 60 * 1000 - 1);

    return {fechaInicio, fechaFin};
  };
}

// ─── Provider ────────────────────────────────────────────────────────────────

export const TimezoneProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [ianaTimezone, setIanaTimezone] = useState(DEFAULT_TIMEZONE);

  useEffect(() => {
    getConfigurationByKey(KEY_TIMEZONE).then(config => {
      if (config?.value) { setIanaTimezone(config.value); }
    });
  }, []);

  const setTimezone = useCallback(async (ianaName: string) => {
    await upsertConfiguration(KEY_TIMEZONE, ianaName);
    setIanaTimezone(ianaName);
  }, []);

  const value = useMemo<TimezoneContextValue>(() => ({
    ianaTimezone,
    formatDate: buildFormatDate(ianaTimezone),
    formatDateTime: buildFormatDateTime(ianaTimezone),
    getTodayBounds: buildGetTodayBounds(ianaTimezone),
    setTimezone,
  }), [ianaTimezone, setTimezone]);

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
};

export const useTimezone = (): TimezoneContextValue => useContext(TimezoneContext);
