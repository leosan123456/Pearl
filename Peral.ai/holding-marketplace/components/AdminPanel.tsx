"use client";

import { useState } from "react";
import { Company, SECTORS, COUNTRIES } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  Plus, Pencil, Trash2, Building2, Database,
  Check, X, AlertTriangle,
} from "lucide-react";

interface Props {
  initialCompanies: Company[];
}

const emptyForm = {
  name: "",
  description: "",
  logo: "",
  website: "",
  country: "United States",
  currency: "USD",
  sector: "Technology",
  founded: "",
  employees: "",
  status: "active",
  annualRevenue: "",
  monthlyRevenue: "",
  mainRevenue: "",
};

export default function AdminPanel({ initialCompanies }: Props) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(company: Company) {
    setEditingId(company.id);
    setForm({
      name: company.name,
      description: company.description || "",
      logo: company.logo || "",
      website: company.website || "",
      country: company.country,
      currency: company.currency,
      sector: company.sector,
      founded: company.founded?.toString() || "",
      employees: company.employees?.toString() || "",
      status: company.status,
      annualRevenue: company.annualRevenue?.toString() || "",
      monthlyRevenue: company.monthlyRevenue?.toString() || "",
      mainRevenue: company.mainRevenue || "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const url = editingId ? `/api/companies/${editingId}` : "/api/companies";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const data = await res.json();
      if (editingId) {
        setCompanies((prev) => prev.map((c) => (c.id === editingId ? data : c)));
        showMessage("success", "Company updated successfully.");
      } else {
        setCompanies((prev) => [...prev, data]);
        showMessage("success", "Company created successfully.");
      }
      setShowForm(false);
      setEditingId(null);
    } else {
      showMessage("error", "Failed to save company.");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/companies/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      showMessage("success", "Company deleted.");
    } else {
      showMessage("error", "Failed to delete company.");
    }
    setDeleteConfirm(null);
  }

  async function handleSeed() {
    setSeedLoading(true);
    const res = await fetch("/api/seed", { method: "POST" });
    const data = await res.json();
    showMessage("success", data.message || "Seeded successfully.");
    const companiesRes = await fetch("/api/companies");
    if (companiesRes.ok) setCompanies(await companiesRes.json());
    setSeedLoading(false);
  }

  const inputStyle = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };

  return (
    <main className="px-6 py-6">
      {message && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg mb-4"
          style={{
            background: message.type === "success" ? "#10b98120" : "#ef444420",
            border: `1px solid ${message.type === "success" ? "#10b98140" : "#ef444440"}`,
          }}
        >
          {message.type === "success" ? <Check size={15} color="#10b981" /> : <AlertTriangle size={15} color="#ef4444" />}
          <span className="text-sm" style={{ color: message.type === "success" ? "#10b981" : "#ef4444" }}>
            {message.text}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Company Management
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {companies.length} {companies.length === 1 ? "company" : "companies"} in the database
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeed}
            disabled={seedLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <Database size={15} />
            {seedLoading ? "Seeding..." : "Seed Sample Data"}
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <Plus size={15} />
            Add Company
          </button>
        </div>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "#00000080" }}
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                {editingId ? "Edit Company" : "Add New Company"}
              </h3>
              <button onClick={() => setShowForm(false)}>
                <X size={18} style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Company Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} placeholder="e.g. Apple Inc." />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Description</label>
                  <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={inputStyle} placeholder="Company description..." />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Country *</label>
                  <select required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                    {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Sector *</label>
                  <select required value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                    {SECTORS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Currency</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                    {["USD","BRL","EUR","GBP","JPY","CNY","CAD","AUD","CHF","SGD"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="acquired">Acquired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Annual Revenue</label>
                  <input type="number" value={form.annualRevenue} onChange={(e) => setForm({ ...form, annualRevenue: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} placeholder="e.g. 394000000000" />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Monthly Revenue</label>
                  <input type="number" value={form.monthlyRevenue} onChange={(e) => setForm({ ...form, monthlyRevenue: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} placeholder="e.g. 32000000000" />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Founded Year</label>
                  <input type="number" value={form.founded} onChange={(e) => setForm({ ...form, founded: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} placeholder="e.g. 1976" />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Employees</label>
                  <input type="number" value={form.employees} onChange={(e) => setForm({ ...form, employees: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} placeholder="e.g. 164000" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Website</label>
                  <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} placeholder="https://company.com" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Main Revenue Streams</label>
                  <textarea rows={2} value={form.mainRevenue} onChange={(e) => setForm({ ...form, mainRevenue: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={inputStyle} placeholder="Describe the primary sources of revenue..." />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all"
                  style={{ background: loading ? "var(--bg-secondary)" : "var(--accent)", color: "#fff" }}
                >
                  {loading ? "Saving..." : editingId ? "Update Company" : "Create Company"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-lg text-sm"
                  style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {companies.length === 0 ? (
        <div
          className="text-center py-16 rounded-xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <Building2 size={40} className="mx-auto mb-3" style={{ color: "var(--text-secondary)" }} />
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>No companies yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Click &ldquo;Add Company&rdquo; or &ldquo;Seed Sample Data&rdquo; to get started.
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                {["Company", "Sector", "Country", "Annual Revenue", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.map((company, idx) => (
                <tr
                  key={company.id}
                  style={{
                    background: idx % 2 === 0 ? "var(--bg-card)" : "var(--bg-secondary)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "var(--accent)20", color: "var(--accent)" }}
                      >
                        {company.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{company.name}</div>
                        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{company.currency}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{company.sector}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{company.country}</td>
                  <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#10b981" }}>
                    {company.annualRevenue ? formatCurrency(company.annualRevenue, company.currency) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: company.status === "active" ? "#10b98120" : "#ef444420",
                        color: company.status === "active" ? "#10b981" : "#ef4444",
                      }}
                    >
                      {company.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(company)}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: "var(--accent)" }}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      {deleteConfirm === company.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(company.id)}
                            className="p-1.5 rounded-lg"
                            style={{ color: "#ef4444", background: "#ef444420" }}
                            title="Confirm delete"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-1.5 rounded-lg"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(company.id)}
                          className="p-1.5 rounded-lg transition-all"
                          style={{ color: "var(--text-secondary)" }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
