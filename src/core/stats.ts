/** Arithmetic mean of finite numbers; null when empty. */
export function average(values: number[]): number | null {
  const v = values.filter(Number.isFinite);
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

/** Pearson correlation coefficient; null when either series is too short. */
export function pearson(xs: number[], ys: number[]): number | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return null;

  const mx = average(xs.slice(0, n)) ?? 0;
  const my = average(ys.slice(0, n)) ?? 0;

  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }

  const den = Math.sqrt(dx2 * dy2);
  if (den === 0) return null;
  return num / den;
}

/** Simple moving average (trailing window). */
export function movingAverage(values: number[], window = 7): (number | null)[] {
  return values.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    return average(slice);
  });
}

/** Standard deviation of finite numbers; null when fewer than 2 values. */
export function stdev(values: number[]): number | null {
  const v = values.filter(Number.isFinite);
  if (v.length < 2) return null;
  const m = average(v)!;
  const variance = v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1);
  return Math.sqrt(variance);
}
