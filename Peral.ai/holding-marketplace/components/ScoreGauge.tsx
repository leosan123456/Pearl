"use client";

interface Props {
  score: number;           // 0–100
  label?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE = { sm: 80, md: 120, lg: 160 };
const STROKE = { sm: 6, md: 8, lg: 10 };

function scoreColor(s: number) {
  if (s >= 75) return "var(--accent-green)";
  if (s >= 55) return "var(--accent-yellow)";
  if (s >= 35) return "var(--accent-red)";
  return "#7f1d1d";
}

export default function ScoreGauge({ score, label, size = "md" }: Props) {
  const dim    = SIZE[size];
  const stroke = STROKE[size];
  const r      = (dim - stroke * 2) / 2;
  const cx     = dim / 2;
  const cy     = dim / 2;
  // arc covers 240° (from 150° to 390°), starting bottom-left
  const startAngle = 150;
  const sweep      = 240;
  const angleDeg   = startAngle + (score / 100) * sweep;
  const toRad      = (d: number) => (d * Math.PI) / 180;

  const arcPath = (endDeg: number) => {
    const start = {
      x: cx + r * Math.cos(toRad(startAngle)),
      y: cy + r * Math.sin(toRad(startAngle)),
    };
    const end = {
      x: cx + r * Math.cos(toRad(endDeg)),
      y: cy + r * Math.sin(toRad(endDeg)),
    };
    const large = endDeg - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
  };

  const color    = scoreColor(score);
  const fontSize = size === "lg" ? 28 : size === "md" ? 22 : 16;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={dim} height={dim} style={{ overflow: "visible" }}>
        {/* Track */}
        <path
          d={arcPath(startAngle + sweep)}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={arcPath(angleDeg)}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          style={{ transition: "all 0.6s ease" }}
        />
        {/* Score text */}
        <text
          x={cx}
          y={cy + fontSize * 0.35}
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight="700"
          fill={color}
        >
          {score}
        </text>
        {size !== "sm" && (
          <text
            x={cx}
            y={cy + fontSize * 0.35 + 16}
            textAnchor="middle"
            fontSize={10}
            fill="var(--text-secondary)"
          >
            / 100
          </text>
        )}
      </svg>
      {label && (
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          {label}
        </span>
      )}
    </div>
  );
}
