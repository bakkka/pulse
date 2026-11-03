"use client";

import { useId, useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import { cn } from "@/components/ui";

type Point = { label: string; value: number };

const W = 720;
const H = 230;

function moneyShort(cents: number): string {
  const value = cents / 100;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
}

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length < 3) return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export function AreaChart({
  data,
  color = "#4F46E5",
  height = 240,
  showY = true,
  format = "money",
}: {
  data: Point[];
  color?: string;
  height?: number;
  showY?: boolean;
  format?: "money" | "percent" | "number";
}) {
  const gradientId = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);

  const pad = { top: 16, right: 10, bottom: 26, left: showY ? 46 : 10 };

  const fmtShort = (value: number) =>
    format === "percent" ? `${Math.round(value)}%` : format === "number" ? `${Math.round(value)}` : moneyShort(value);

  const { points, linePath, areaPath, labels, yTicks } = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => d.value)) * 1.12;
    const innerW = W - pad.left - pad.right;
    const innerH = H - pad.top - pad.bottom;

    const pts = data.map((d, i) => ({
      x: pad.left + (data.length === 1 ? innerW / 2 : (i * innerW) / (data.length - 1)),
      y: pad.top + (1 - d.value / max) * innerH,
    }));

    const linePath = smoothPath(pts);
    const areaPath =
      pts.length > 0
        ? `${linePath} L${pts[pts.length - 1].x},${H - pad.bottom} L${pts[0].x},${H - pad.bottom} Z`
        : "";

    const ticks = [0, 0.5, 1].map((ratio) => ({
      y: pad.top + innerH * ratio,
      label: fmtShort(max * (1 - ratio)),
    }));

    const maxLabels = 7;
    const step = Math.max(1, Math.ceil(data.length / maxLabels));
    const labels = data
      .map((point, index) => ({ index, text: point.label, x: pts[index]?.x ?? 0 }))
      .filter((_, index) => index % step === 0 || index === data.length - 1);

    return { points: pts, linePath, areaPath, labels, yTicks: ticks };
  }, [data, pad.left, pad.right, format]);

  const active = hover !== null ? data[hover] : null;
  const activePoint = hover !== null ? points[hover] : null;

  return (
    <div className="relative w-full" style={{ height }} onMouseLeave={() => setHover(null)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        role="img"
        aria-label="Revenue chart"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const ratio = (event.clientX - rect.left) / rect.width;
          const index = Math.round(ratio * (data.length - 1));
          setHover(Math.max(0, Math.min(data.length - 1, index)));
        }}
      >
        <defs>
          <linearGradient id={`area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={pad.left}
              x2={W - pad.right}
              y1={tick.y}
              y2={tick.y}
              stroke="#EEF0F5"
              strokeWidth="1"
            />
            {showY ? (
              <text x={pad.left - 10} y={tick.y + 3.5} textAnchor="end" fontSize="10" fill="#98A2B3">
                {tick.label}
              </text>
            ) : null}
          </g>
        ))}

        <path d={areaPath} fill={`url(#area-${gradientId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />

        {activePoint ? (
          <g>
            <line
              x1={activePoint.x}
              x2={activePoint.x}
              y1={pad.top}
              y2={H - pad.bottom}
              stroke={color}
              strokeOpacity="0.25"
              strokeDasharray="4 4"
            />
            <circle cx={activePoint.x} cy={activePoint.y} r="9" fill={color} fillOpacity="0.12" />
            <circle cx={activePoint.x} cy={activePoint.y} r="4" fill="#fff" stroke={color} strokeWidth="2.5" />
          </g>
        ) : null}

        {labels.map((label) => (
          <text
            key={`${label.index}-${label.text}`}
            x={label.x}
            y={H - 6}
            fontSize="10"
            fill="#98A2B3"
            textAnchor={label.x < 50 ? "start" : label.x > W - 40 ? "end" : "middle"}
          >
            {label.text}
          </text>
        ))}
      </svg>

      {active && activePoint ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] shadow-pop"
          style={{ left: `${(activePoint.x / W) * 100}%`, top: `${(activePoint.y / H) * 100}%`, marginTop: -12 }}
        >
          <span className="block font-semibold text-ink">
            {format === "percent"
              ? `${Math.round(active.value)}%`
              : format === "number"
                ? Math.round(active.value)
                : formatMoney(active.value)}
          </span>
          <span className="block text-slate-400">{active.label}</span>
        </div>
      ) : null}
    </div>
  );
}

type MovementPoint = { label: string; new: number; expansion: number; contraction: number; churn: number };

const MOVEMENT_COLORS = {
  new: "#12B76A",
  expansion: "#6366F1",
  contraction: "#F79009",
  churn: "#F04438",
};

export function MovementBars({ data, height = 240 }: { data: MovementPoint[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);

  const pad = { top: 16, right: 10, bottom: 26, left: 46 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const maxPos = Math.max(1, ...data.map((d) => d.new + d.expansion));
  const maxNeg = Math.max(1, ...data.map((d) => d.contraction + d.churn));
  const scale = Math.max(maxPos, maxNeg);
  const baseline = pad.top + innerH * (maxPos / (maxPos + maxNeg));

  const slot = innerW / Math.max(1, data.length);
  const barWidth = Math.min(46, slot * 0.52);

  const active = hover !== null ? data[hover] : null;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full" role="img" aria-label="MRR movement">
        {[
          { y: pad.top, value: maxPos },
          { y: baseline, value: 0 },
          { y: H - pad.bottom, value: -maxNeg },
        ].map((tick) => (
          <g key={tick.y}>
            <line x1={pad.left} x2={W - pad.right} y1={tick.y} y2={tick.y} stroke="#EEF0F5" />
            <text x={pad.left - 10} y={tick.y + 3.5} textAnchor="end" fontSize="10" fill="#98A2B3">
              {tick.value < 0 ? "-" : ""}
              {moneyShort(Math.abs(tick.value))}
            </text>
          </g>
        ))}

        {data.map((point, index) => {
          const x = pad.left + slot * index + (slot - barWidth) / 2;
          const newH = (point.new / scale) * (baseline - pad.top);
          const expH = (point.expansion / scale) * (baseline - pad.top);
          const conH = (point.contraction / scale) * (H - pad.bottom - baseline);
          const churnH = (point.churn / scale) * (H - pad.bottom - baseline);

          return (
            <g
              key={point.label}
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
              opacity={hover === null || hover === index ? 1 : 0.55}
            >
              <rect x={x - 6} y={pad.top} width={barWidth + 12} height={innerH} fill="transparent" />
              <rect
                x={x}
                y={baseline - newH}
                width={barWidth}
                height={Math.max(0.5, newH)}
                rx="3"
                fill={MOVEMENT_COLORS.new}
              />
              <rect
                x={x}
                y={baseline - newH - expH}
                width={barWidth}
                height={Math.max(0.5, expH)}
                rx="3"
                fill={MOVEMENT_COLORS.expansion}
              />
              <rect
                x={x}
                y={baseline}
                width={barWidth}
                height={Math.max(0.5, conH)}
                rx="3"
                fill={MOVEMENT_COLORS.contraction}
              />
              <rect
                x={x}
                y={baseline + conH}
                width={barWidth}
                height={Math.max(0.5, churnH)}
                rx="3"
                fill={MOVEMENT_COLORS.churn}
              />
              <text
                x={x + barWidth / 2}
                y={H - 6}
                textAnchor="middle"
                fontSize="10"
                fill="#98A2B3"
              >
                {point.label}
              </text>
            </g>
          );
        })}

        <line
          x1={pad.left}
          x2={W - pad.right}
          y1={baseline}
          y2={baseline}
          stroke="#D0D5DD"
          strokeWidth="1"
        />
      </svg>

      {active ? (
        <div
          className="pointer-events-none absolute top-0 z-10 w-40 -translate-x-1/2 rounded-xl border border-line bg-white p-2.5 text-[11px] shadow-pop"
          style={{ left: `${((pad.left + slot * (hover ?? 0) + slot / 2) / W) * 100}%` }}
        >
          <p className="mb-1 font-semibold text-ink">{active.label}</p>
          {(
            [
              ["New", active.new, MOVEMENT_COLORS.new],
              ["Expansion", active.expansion, MOVEMENT_COLORS.expansion],
              ["Contraction", active.contraction, MOVEMENT_COLORS.contraction],
              ["Churn", active.churn, MOVEMENT_COLORS.churn],
            ] as const
          ).map(([label, value, color]) => (
            <div key={label} className="flex items-center justify-between gap-2 py-0.5">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </span>
              <span className="font-medium text-ink-700">{formatMoney(value)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Donut({
  slices,
  centerValue,
  centerLabel,
  size = 150,
}: {
  slices: { label: string; value: number; color: string }[];
  centerValue: string;
  centerLabel: string;
  size?: number;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 130 130" className="h-full w-full -rotate-90">
        <circle cx="65" cy="65" r={radius} fill="none" stroke="#F2F4F7" strokeWidth="14" />
        {slices.map((slice) => {
          const length = (slice.value / total) * circumference;
          const dash = `${Math.max(0, length - 3)} ${circumference - Math.max(0, length - 3)}`;
          const element = (
            <circle
              key={slice.label}
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth="14"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += length;
          return element;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold text-ink">{centerValue}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400">{centerLabel}</span>
      </div>
    </div>
  );
}

export function Sparkline({
  values,
  color = "#4F46E5",
  width = 92,
  height = 32,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const points = values.map((value, index) => ({
    x: (index / Math.max(1, values.length - 1)) * width,
    y: height - 3 - ((value - min) / range) * (height - 6),
  }));
  const path = smoothPath(points);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={cn("overflow-visible")}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
