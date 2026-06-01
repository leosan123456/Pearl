"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, Filter, X } from "lucide-react";

interface Props {
  sectors: string[];
  countries: string[];
  currentSearch: string;
  currentSector: string;
  currentCountry: string;
}

export default function CompanyFilters({
  sectors,
  countries,
  currentSearch,
  currentSector,
  currentCountry,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);

  function updateFilters(params: Record<string, string>) {
    const current = new URLSearchParams();
    if (search) current.set("search", search);
    if (currentSector) current.set("sector", currentSector);
    if (currentCountry) current.set("country", currentCountry);
    Object.entries(params).forEach(([k, v]) => {
      if (v) current.set(k, v);
      else current.delete(k);
    });
    startTransition(() => router.push(`${pathname}?${current.toString()}`));
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateFilters({ search });
  }

  function clearAll() {
    setSearch("");
    startTransition(() => router.push(pathname));
  }

  const hasFilters = currentSearch || currentSector || currentCountry;

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-48">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-secondary)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies..."
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <Filter size={14} style={{ color: "var(--text-secondary)" }} />
        </div>

        <select
          value={currentSector}
          onChange={(e) => updateFilters({ sector: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{
            background: currentSector ? "var(--accent)20" : "var(--bg-secondary)",
            border: `1px solid ${currentSector ? "var(--accent)" : "var(--border)"}`,
            color: currentSector ? "var(--accent)" : "var(--text-secondary)",
          }}
        >
          <option value="">All Sectors</option>
          {sectors.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={currentCountry}
          onChange={(e) => updateFilters({ country: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{
            background: currentCountry ? "var(--accent)20" : "var(--bg-secondary)",
            border: `1px solid ${currentCountry ? "var(--accent)" : "var(--border)"}`,
            color: currentCountry ? "var(--accent)" : "var(--text-secondary)",
          }}
        >
          <option value="">All Countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all"
            style={{ color: "#ef4444", background: "#ef444415", border: "1px solid #ef444430" }}
          >
            <X size={13} />
            Clear
          </button>
        )}
      </div>

      {isPending && (
        <div className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          Searching...
        </div>
      )}
    </div>
  );
}
