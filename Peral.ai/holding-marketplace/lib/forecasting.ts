import type { RevenueRecord } from "@prisma/client";

export interface ForecastPoint {
  year: number;
  month: number;
  amount: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

// Holt's Double Exponential Smoothing (handles level + trend)
function holtSmooth(values: number[], alpha = 0.4, beta = 0.3) {
  if (values.length === 0) return { level: 0, trend: 0, smoothed: [] as number[] };

  let level = values[0];
  let trend = values.length > 1 ? values[1] - values[0] : 0;
  const smoothed: number[] = [level];

  for (let i = 1; i < values.length; i++) {
    const prevLevel = level;
    level = alpha * values[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    smoothed.push(level);
  }

  return { level, trend, smoothed };
}

// Residual std dev → confidence band
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function generateForecast(
  records: RevenueRecord[],
  monthsAhead = 6
): ForecastPoint[] {
  const monthly = records
    .filter((r) => r.month !== null)
    .sort((a, b) => a.year * 12 + (a.month ?? 0) - (b.year * 12 + (b.month ?? 0)));

  if (monthly.length < 3) return [];

  const values = monthly.map((r) => r.amount);
  const { level, trend, smoothed } = holtSmooth(values);

  // Residuals for confidence interval
  const residuals = values.map((v, i) => v - smoothed[i]);
  const sd = stdDev(residuals);
  const zScore = 1.28; // 80% CI

  const lastRecord = monthly[monthly.length - 1];
  let year = lastRecord.year;
  let month = lastRecord.month ?? 12;

  const points: ForecastPoint[] = [];
  for (let h = 1; h <= monthsAhead; h++) {
    month++;
    if (month > 12) { month = 1; year++; }

    const projected = Math.max(0, level + h * trend);
    const margin = zScore * sd * Math.sqrt(h);       // wider band further out
    const confidence = Math.max(0.5, 0.9 - h * 0.05); // decays with horizon

    points.push({
      year,
      month,
      amount: Math.round(projected),
      lowerBound: Math.round(Math.max(0, projected - margin)),
      upperBound: Math.round(projected + margin),
      confidence: parseFloat(confidence.toFixed(2)),
    });
  }

  return points;
}

// Trend summary string
export function trendSummary(records: RevenueRecord[]): string {
  const monthly = records
    .filter((r) => r.month !== null)
    .sort((a, b) => a.year * 12 + (a.month ?? 0) - (b.year * 12 + (b.month ?? 0)));

  if (monthly.length < 3) return "insufficient data";

  const values = monthly.map((r) => r.amount);
  const n = values.length;
  const first3Avg = values.slice(0, 3).reduce((s, v) => s + v, 0) / 3;
  const last3Avg  = values.slice(-3).reduce((s, v) => s + v, 0) / 3;
  const change = first3Avg === 0 ? 0 : (last3Avg - first3Avg) / first3Avg * 100;

  if (change > 10)  return `growing (+${change.toFixed(1)}% over period)`;
  if (change > 2)   return `slightly growing (+${change.toFixed(1)}%)`;
  if (change > -2)  return "stable";
  if (change > -10) return `slightly declining (${change.toFixed(1)}%)`;
  return `declining (${change.toFixed(1)}% over period)`;
}
