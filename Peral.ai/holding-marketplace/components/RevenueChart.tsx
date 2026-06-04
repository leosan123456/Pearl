"use client";

import { formatCurrency } from "@/lib/utils";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface ChartRecord {
  id: string;
  year: number;
  month?: number | null;
  amount: number;
  currency: string;
}

interface Props {
  records: ChartRecord[];
  currency: string;
}

export default function RevenueChart({ records, currency }: Props) {
  const sorted = [...records].sort((a, b) => (a.year - b.year) || ((a.month || 0) - (b.month || 0)));
  const max = Math.max(...sorted.map((r) => r.amount));

  return (
    <div>
      <div className="flex items-end gap-2 h-40">
        {sorted.map((record) => {
          const height = max > 0 ? (record.amount / max) * 100 : 0;
          return (
            <div key={record.id} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute bottom-6 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                <div
                  className="text-xs px-2 py-1 rounded whitespace-nowrap"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                >
                  {formatCurrency(record.amount, currency)}
                </div>
              </div>
              <div className="w-full flex items-end" style={{ height: "128px" }}>
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${height}%`,
                    background: "linear-gradient(to top, rgba(255,255,255,0.95), var(--accent))",
                    minHeight: "4px",
                  }}
                />
              </div>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {record.month ? MONTHS[record.month - 1] : record.year}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
