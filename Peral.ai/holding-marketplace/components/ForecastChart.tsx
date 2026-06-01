"use client";


interface ForecastPoint {
  year: number;
  month: number;
  amount: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

interface HistoricalPoint {
  month: number | null;
  year: number;
  amount: number;
}

interface Props {
  historical: HistoricalPoint[];
  forecast: ForecastPoint[];
  currency?: string;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const W = 680, H = 180, PAD = { t: 8, r: 8, b: 28, l: 8 };
const chartW = W - PAD.l - PAD.r;
const chartH = H - PAD.t - PAD.b;

export default function ForecastChart({ historical, forecast }: Props) {
  const hist = historical
    .filter((r) => r.month !== null)
    .sort((a, b) => a.year * 12 + (a.month ?? 0) - (b.year * 12 + (b.month ?? 0)))
    .slice(-12);

  const allAmounts = [
    ...hist.map((h) => h.amount),
    ...forecast.map((f) => f.upperBound),
  ];
  const maxVal = Math.max(...allAmounts) * 1.05;
  const total  = hist.length + forecast.length;
  if (total === 0) return null;

  const xStep  = chartW / (total - 1 || 1);
  const yScale = (v: number) => chartH - (v / maxVal) * chartH;

  const histPoints = hist.map((h, i) => ({
    x: PAD.l + i * xStep,
    y: PAD.t + yScale(h.amount),
    label: MONTHS[(h.month ?? 1) - 1],
    amount: h.amount,
  }));

  const fcPoints = forecast.map((f, i) => ({
    x: PAD.l + (hist.length + i) * xStep,
    y: PAD.t + yScale(f.amount),
    lo: PAD.t + yScale(f.lowerBound),
    hi: PAD.t + yScale(f.upperBound),
    label: MONTHS[f.month - 1],
    amount: f.amount,
    lowerBound: f.lowerBound,
    upperBound: f.upperBound,
  }));

  const histLine = histPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const fcLine   = fcPoints.length
    ? [`M ${histPoints.at(-1)?.x} ${histPoints.at(-1)?.y}`,
       ...fcPoints.map((p) => `L ${p.x} ${p.y}`)].join(" ")
    : "";

  // Confidence band path
  const bandPath = fcPoints.length
    ? [
        `M ${histPoints.at(-1)?.x} ${histPoints.at(-1)?.y}`,
        ...fcPoints.map((p) => `L ${p.x} ${p.hi}`),
        ...fcPoints.slice().reverse().map((p) => `L ${p.x} ${p.lo}`),
        "Z",
      ].join(" ")
    : "";

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 400 }}>
        {/* Confidence band */}
        {bandPath && <path d={bandPath} fill="var(--accent)" fillOpacity={0.12} />}

        {/* Historical line */}
        {histLine && (
          <path d={histLine} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Forecast line (dashed) */}
        {fcLine && (
          <path d={fcLine} fill="none" stroke="var(--accent)" strokeWidth={2}
            strokeDasharray="5 3" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
        )}

        {/* Historical dots */}
        {histPoints.map((p, i) => (
          <circle key={`h-${i}`} cx={p.x} cy={p.y} r={3} fill="var(--accent)" />
        ))}

        {/* Forecast dots */}
        {fcPoints.map((p, i) => (
          <circle key={`f-${i}`} cx={p.x} cy={p.y} r={3} fill="var(--accent)" fillOpacity={0.5} stroke="var(--accent)" strokeWidth={1} />
        ))}

        {/* X-axis labels — every 3rd point */}
        {[...histPoints, ...fcPoints].map((p, i) => {
          if (i % 3 !== 0) return null;
          const isForecast = i >= histPoints.length;
          return (
            <text key={`lbl-${i}`} x={p.x} y={H - 4} textAnchor="middle"
              fontSize={9} fill={isForecast ? "var(--accent)" : "var(--text-secondary)"} fillOpacity={isForecast ? 0.7 : 1}>
              {p.label}
            </text>
          );
        })}

        {/* "Forecast →" label */}
        {fcPoints.length > 0 && (
          <>
            <line x1={fcPoints[0].x} y1={PAD.t} x2={fcPoints[0].x} y2={chartH + PAD.t}
              stroke="var(--border)" strokeWidth={1} strokeDasharray="3 2" />
            <text x={fcPoints[0].x + 4} y={PAD.t + 10} fontSize={8} fill="var(--accent)" fillOpacity={0.8}>
              Forecast →
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
