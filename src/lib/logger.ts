type Level = 'debug' | 'info' | 'warn' | 'error';

const env = 'dev' // (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) ? process.env.NODE_ENV : 'production';
const isDev = env !== 'production';

function format(level: Level, args: unknown[]): unknown[] {
  const prefix = `[SkapAuto:${level}]`;
  return [prefix, ...args];
}

export function debug(...args: unknown[]): void {
  if (!isDev) return;
  // eslint-disable-next-line no-console
  console.debug(...format('debug', args));
}

export function info(...args: unknown[]): void {
  // eslint-disable-next-line no-console
  console.info(...format('info', args));
}

export function warn(...args: unknown[]): void {
  // eslint-disable-next-line no-console
  console.warn(...format('warn', args));
}

export function error(...args: unknown[]): void {
  // eslint-disable-next-line no-console
  console.error(...format('error', args));
}