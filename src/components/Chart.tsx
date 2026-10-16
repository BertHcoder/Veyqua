import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { PARAMS } from '../data/parameters';
import type { Target } from '../engine/targets';
import { useI18n } from '../i18n';
import { formatDateTime, locale } from '../lib/dates';
import { displayUnit, formatNumber, formatValue } from '../lib/units';
import type { ParamId, Range, Settings } from '../lib/types';
import type { ReadingLevel } from './Status';

export interface ChartPoint {
  t: number;
  /** Canonical units. */
  v: number;
  level: ReadingLevel;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Roughly `count` round numbers between min and max, for axis labels. */
function niceTicks(min: number, max: number, count = 4): number[] {
  const span = max - min || 1;
  const raw = span / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const ratio = raw / magnitude;
  const step = (ratio >= 7.5 ? 10 : ratio >= 3.5 ? 5 : ratio >= 1.5 ? 2 : 1) * magnitude;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) ticks.push(Number(v.toPrecision(12)));
  return ticks;
}

const decimalsOf = (step: number) => Math.max(0, Math.min(4, -Math.floor(Math.log10(step) + 1e-9)));

/** Converts a canonical range to display units. All unit conversions are increasing, so bounds map directly. */
function toDisplayRange(range: Range, toDisplay: (v: number) => number): Range {
  return [range[0] === null ? null : toDisplay(range[0]), range[1] === null ? null : toDisplay(range[1])];
}

interface ParamChartProps {
  param: ParamId;
  points: ChartPoint[];
  target?: Target;
  /** Times of water changes, drawn as dashed lines. */
  markers: number[];
  from: number;
  to: number;
  settings: Settings;
}

const HEIGHT = 170;
const PAD = { left: 46, right: 14, top: 10, bottom: 26 };

export function ParamChart({ param, points, target, markers, from, to, settings }: ParamChartProps) {
  const { lang, l, t } = useI18n();
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const unit = displayUnit(param, settings);
  if (points.length === 0) return null;

  const values = points.map((p) => unit.toDisplay(p.v));
  const ideal = target ? toDisplayRange(target.ideal, unit.toDisplay) : null;
  const acceptable = target ? toDisplayRange(target.acceptable, unit.toDisplay) : null;
  const domainValues = [...values, ...(ideal ?? [])].filter((v): v is number => v !== null);
  let lo = Math.min(...domainValues);
  let hi = Math.max(...domainValues);
  if (hi - lo < 1e-9) {
    const upper = acceptable?.[1];
    hi = upper !== null && upper !== undefined && upper > lo ? upper : lo + Math.max(Math.abs(lo) * 0.1, 1);
  }
  const padding = (hi - lo) * 0.12;
  lo = lo >= 0 && lo - padding < 0 ? 0 : lo - padding;
  hi += padding;

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const span = Math.max(1, to - from);
  const x = (time: number) => PAD.left + ((time - from) / span) * plotW;
  const y = (value: number) => PAD.top + (1 - (value - lo) / (hi - lo)) * plotH;
  const yClamped = (value: number | null, fallback: number) =>
    value === null ? fallback : Math.min(PAD.top + plotH, Math.max(PAD.top, y(value)));

  const band = (range: Range | null, className: string) => {
    if (!range) return null;
    const top = yClamped(range[1], PAD.top);
    const bottom = yClamped(range[0], PAD.top + plotH);
    if (bottom - top <= 0) return null;
    return <rect className={className} x={PAD.left} y={top} width={plotW} height={Math.max(bottom - top, 1.5)} />;
  };

  const ticks = niceTicks(lo, hi, 4).filter((v) => v >= lo && v <= hi);
  const tickDecimals = ticks.length > 1 ? decimalsOf(ticks[1] - ticks[0]) : unit.maxDecimals;
  const longRange = span > 200 * 86_400_000;
  const dateFormat = new Intl.DateTimeFormat(
    locale(lang),
    longRange ? { month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short' },
  );
  const xTicks = plotW > 0 ? [0, 1, 2, 3].map((i) => from + (span * i) / 3) : [];

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t).toFixed(1)},${y(values[i]).toFixed(1)}`).join('');
  const latest = points.at(-1);

  const onPointer = (event: PointerEvent<SVGSVGElement>) => {
    if (points.length === 0) return;
    const box = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - box.left;
    let best = 0;
    for (let i = 1; i < points.length; i++) {
      if (Math.abs(x(points[i].t) - px) < Math.abs(x(points[best].t) - px)) best = i;
    }
    setHover(best);
  };

  const hovered = hover !== null ? points[hover] : undefined;
  const label = latest
    ? t('charts.aria', {
        param: l(PARAMS[param].name),
        count: points.length,
        value: formatValue(param, latest.v, settings, lang),
      })
    : l(PARAMS[param].name);

  return (
    <div className="chart" ref={ref}>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={label}
          onPointerMove={onPointer}
          onPointerDown={onPointer}
          onPointerLeave={() => setHover(null)}
        >
          {band(acceptable, 'band-warn')}
          {band(ideal, 'band-ok')}
          {ticks.map((v) => (
            <g key={v}>
              <line className="grid" x1={PAD.left} x2={PAD.left + plotW} y1={y(v)} y2={y(v)} />
              <text className="axis" x={PAD.left - 6} y={y(v)} dy="0.32em" textAnchor="end">
                {formatNumber(v, lang, 0, Math.max(tickDecimals, 0))}
              </text>
            </g>
          ))}
          {xTicks.map((time, i) => (
            <text
              key={time}
              className="axis"
              x={x(time)}
              y={HEIGHT - 6}
              textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
            >
              {dateFormat.format(time)}
            </text>
          ))}
          {markers
            .filter((m) => m >= from && m <= to)
            .map((m, i) => (
              <line key={`${m}-${i}`} className="marker" x1={x(m)} x2={x(m)} y1={PAD.top} y2={PAD.top + plotH} />
            ))}
          <path className="line" d={path} />
          {points.map((p, i) => (
            <circle
              key={`${p.t}-${i}`}
              className={`dot dot-${p.level ?? 'none'}`}
              cx={x(p.t)}
              cy={y(values[i])}
              r={hover === i ? 5.5 : 3.5}
            />
          ))}
          {hovered && (
            <line className="cursor" x1={x(hovered.t)} x2={x(hovered.t)} y1={PAD.top} y2={PAD.top + plotH} />
          )}
        </svg>
      )}
      {hovered && (
        <div
          className="chart-tip"
          style={{ left: Math.min(Math.max(x(hovered.t), 70), width - 70), top: 0 }}
          aria-hidden="true"
        >
          <strong>{formatValue(param, hovered.v, settings, lang)}</strong>
          <span>{formatDateTime(new Date(hovered.t).toISOString(), lang)}</span>
        </div>
      )}
    </div>
  );
}

/** A tiny line of the most recent readings, with the ideal range as a band. */
export function Sparkline({ values, ideal }: { values: number[]; ideal?: Range }) {
  if (values.length < 2) return <span className="sparkline sparkline-empty" aria-hidden="true" />;
  const w = 72;
  const h = 22;
  const bounds = [...values, ...(ideal ?? [])].filter((v): v is number => v !== null);
  let lo = Math.min(...bounds);
  let hi = Math.max(...bounds);
  if (hi - lo < 1e-9) {
    lo -= 1;
    hi += 1;
  }
  const y = (v: number) => 2 + (1 - (v - lo) / (hi - lo)) * (h - 4);
  const step = w / (values.length - 1);
  const points = values.map((v, i) => `${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const bandTop = ideal ? y(Math.min(hi, ideal[1] ?? hi)) : 0;
  const bandBottom = ideal ? y(Math.max(lo, ideal[0] ?? lo)) : 0;
  return (
    <svg className="sparkline" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {ideal && bandBottom > bandTop && <rect className="band-ok" x="0" y={bandTop} width={w} height={bandBottom - bandTop} />}
      <polyline className="line" points={points} />
      <circle className="dot-last" cx={(values.length - 1) * step} cy={y(values[values.length - 1])} r="2.5" />
    </svg>
  );
}
