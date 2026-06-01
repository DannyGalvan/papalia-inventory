import { DEFAULT_TIMEZONE } from '../config/constants';

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

    const localAsUTC = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour') % 24,
      get('minute'),
      get('second'),
    );
    return localAsUTC - at.getTime();
  } catch {
    return -at.getTimezoneOffset() * 60000;
  }
}

/**
 * Returns start and end of today in the given IANA timezone as UTC Date objects.
 * Used to initialize date filter state in list/dashboard screens.
 */
export const dateNow = (ianaTimezone: string = DEFAULT_TIMEZONE) => {
  const now = new Date();
  const offsetMs = getUTCOffsetMs(ianaTimezone, now);

  // Shift now to the local calendar date in the target timezone
  const localNow = new Date(now.getTime() + offsetMs);
  const y = localNow.getUTCFullYear();
  const mo = localNow.getUTCMonth();
  const d = localNow.getUTCDate();

  // UTC time that corresponds to 00:00:00 in the target timezone
  const fechaInicio = new Date(Date.UTC(y, mo, d, 0, 0, 0, 0) - offsetMs);
  const fechaFin = new Date(fechaInicio.getTime() + 24 * 60 * 60 * 1000 - 1);

  return {fechaInicio, fechaFin};
};

/**
 * Returns the current datetime for a log creation timestamp.
 */
export const dateNowCreate = (): Date => new Date();

export const generateRandomColor = () => {
  const randomColor = Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, '0');
  return `#${randomColor}`;
};
