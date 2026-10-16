import { DAY_MS } from '../lib/dates';

export interface Point {
  /** Epoch milliseconds. */
  t: number;
  v: number;
}

export interface Trend {
  slopePerDay: number;
  /** Goodness of fit (0–1): how well a straight line explains the readings. */
  r2: number;
  spanDays: number;
}

/** Least-squares straight line through the points. Needs at least three readings. */
export function linearTrend(points: Point[]): Trend | null {
  if (points.length < 3) return null;
  const t0 = points[0].t;
  const xs = points.map((p) => (p.t - t0) / DAY_MS);
  const ys = points.map((p) => p.v);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  if (sxx === 0) return null;
  return {
    slopePerDay: sxy / sxx,
    r2: syy === 0 ? 0 : (sxy * sxy) / (sxx * syy),
    spanDays: xs[xs.length - 1] - xs[0],
  };
}
