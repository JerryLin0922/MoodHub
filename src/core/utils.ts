/** Zero-pad a number to two digits. */
export function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Small unique id generator (not for security). */
let uidSeq = 0;
export function uid(prefix = 'id'): string {
  uidSeq += 1;
  return `${prefix}_${Date.now().toString(36)}_${uidSeq}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/** Format an ISO string / Date as YYYY-MM-DD in local time. */
export function fmtDate(d: string | Date): string {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

/** Today as YYYY-MM-DD in local time. */
export function today(): string {
  return fmtDate(new Date());
}

/** Debounce helper. */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number
): (...args: A) => void {
  let t: number | undefined;
  return (...args: A) => {
    if (t !== undefined) clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  };
}

/** Clamp a number between min and max. */
export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Parse a number, tolerating commas / spaces / units. */
export function toNum(s: unknown): number | null {
  if (typeof s === 'number') return Number.isFinite(s) ? s : null;
  if (typeof s !== 'string') return null;
  const v = parseFloat(s.replace(/[^\d.\-]/g, ''));
  return Number.isFinite(v) ? v : null;
}
