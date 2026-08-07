"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  RefreshCw,
  Search,
  ChevronDown,
  AlertCircle,
  Clock,
  User,
  Database,
  BookOpen,
  CalendarCheck,
  Award,
  Users,
  FileText,
  Trash2,
  Plus,
  Edit3,
  LogIn,
  Terminal,
  Activity,
  Filter,
  X,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────
interface ActivityLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userRole: string | null;
  action: string;
  module: string;
  details: string;
  createdAt: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────
const ALL_MODULES = [
  "All Modules",
  "Lesson Plans",
  "Attendance",
  "Scholarship",
  "Admissions",
  "Incident Management",
  "Leave Management",
  "People Management",
  "Homework",
  "Exam Management",
  "Database",
  "System",
];

const ALL_ACTIONS = [
  "All Actions",
  "CREATE",
  "UPDATE",
  "DELETE",
  "ADD",
  "LOGIN",
  "SQL",
  "SYSTEM",
];

// ─── Action Badge ──────────────────────────────────────────────────────────
function ActionBadge({ action }: { action: string }) {
  const configs: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    CREATE: { bg: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200", text: "CREATE", icon: <Plus size={10} /> },
    ADD:    { bg: "bg-blue-100 text-blue-700 ring-1 ring-blue-200", text: "ADD", icon: <Plus size={10} /> },
    UPDATE: { bg: "bg-amber-100 text-amber-700 ring-1 ring-amber-200", text: "UPDATE", icon: <Edit3 size={10} /> },
    DELETE: { bg: "bg-red-100 text-red-700 ring-1 ring-red-200", text: "DELETE", icon: <Trash2 size={10} /> },
    LOGIN:  { bg: "bg-purple-100 text-purple-700 ring-1 ring-purple-200", text: "LOGIN", icon: <LogIn size={10} /> },
    SQL:    { bg: "bg-slate-100 text-slate-700 ring-1 ring-slate-200", text: "SQL", icon: <Terminal size={10} /> },
    SYSTEM: { bg: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200", text: "SYSTEM", icon: <Activity size={10} /> },
  };

  const cfg = configs[action] || { bg: "bg-slate-100 text-slate-600 ring-1 ring-slate-200", text: action, icon: <Activity size={10} /> };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${cfg.bg}`}>
      {cfg.icon}
      {cfg.text}
    </span>
  );
}

// ─── Role Badge ────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string | null }) {
  const configs: Record<string, string> = {
    OFFICE:         "bg-blue-50 text-blue-600",
    ADMIN:          "bg-violet-50 text-violet-600",
    TEACHER:        "bg-green-50 text-green-600",
    STUDENT_PARENT: "bg-orange-50 text-orange-600",
    PRINCIPAL:      "bg-rose-50 text-rose-600",
    SYSTEM:         "bg-slate-50 text-slate-500",
  };
  const cls = configs[role || "SYSTEM"] || "bg-slate-50 text-slate-500";
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${cls}`}>
      {role || "SYS"}
    </span>
  );
}

// ─── Module Icon ───────────────────────────────────────────────────────────
function ModuleIcon({ module: mod }: { module: string }) {
  const icons: Record<string, React.ReactNode> = {
    "Lesson Plans":       <BookOpen size={13} className="text-blue-500" />,
    "Attendance":         <CalendarCheck size={13} className="text-green-500" />,
    "Scholarship":        <Award size={13} className="text-amber-500" />,
    "Admissions":         <FileText size={13} className="text-violet-500" />,
    "Incident Management":<AlertCircle size={13} className="text-red-500" />,
    "Leave Management":   <Clock size={13} className="text-slate-500" />,
    "People Management":  <Users size={13} className="text-sky-500" />,
    "Database":           <Database size={13} className="text-slate-600" />,
    "System":             <Activity size={13} className="text-indigo-500" />,
  };
  return <>{icons[mod] || <Activity size={13} className="text-slate-400" />}</>;
}

// ─── Date Formatter ────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

// ─── Custom Dropdown ───────────────────────────────────────────────────────
function Dropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm min-w-[130px] justify-between"
      >
        <span>{value}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 z-50 w-52 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${
                value === opt
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function ActivityLogsClient() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All Modules");
  const [actionFilter, setActionFilter] = useState("All Actions");
  const [limit, setLimit] = useState(50);

  const fetchLogs = useCallback(async (isRefresh = false, currentLimit = limit) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (moduleFilter !== "All Modules") params.set("module", moduleFilter);
      if (actionFilter !== "All Actions") params.set("action", actionFilter);
      params.set("limit", String(currentLimit));

      const res = await fetch(`/api/activity-logs?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 403) {
          setError("You do not have permission to view activity logs.");
        } else {
          setError("Failed to load activity logs. Please try again.");
        }
        return;
      }
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, moduleFilter, actionFilter, limit]);

  // Initial load
  useEffect(() => {
    fetchLogs(false, 50);
  }, []);

  // Reset limit when filters change
  useEffect(() => {
    setLimit(50);
  }, [search, moduleFilter, actionFilter]);

  // Re-fetch when filters or limit change (debounced for search)
  useEffect(() => {
    const timer = setTimeout(() => fetchLogs(false, limit), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search, moduleFilter, actionFilter, limit]);

  const hasActiveFilters = search || moduleFilter !== "All Modules" || actionFilter !== "All Actions";

  const clearFilters = () => {
    setSearch("");
    setModuleFilter("All Modules");
    setActionFilter("All Actions");
    setLimit(50);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-6 py-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25">
            <ShieldCheck className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-none">Activity Logs</h1>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Audit trail of all user actions across the platform
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchLogs(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-violet-500/20 transition-all disabled:opacity-60 shrink-0"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh Logs"}
        </button>
      </div>

      {/* ── Filters Bar ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-6 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user or details..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all font-medium text-slate-700 placeholder:text-slate-400"
            />
          </div>

          {/* Module filter */}
          <Dropdown value={moduleFilter} options={ALL_MODULES} onChange={setModuleFilter} />

          {/* Action filter */}
          <Dropdown value={actionFilter} options={ALL_ACTIONS} onChange={setActionFilter} />

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X size={12} />
              Clear
            </button>
          )}

          <div className="ml-auto text-[11px] text-slate-400 font-bold">
            {!loading && !error && (
              <span>Showing {logs.length} of latest actions recorded</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="p-6">
        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-50">
              <div className="h-4 bg-slate-100 rounded-lg animate-pulse w-32" />
            </div>
            <div className="divide-y divide-slate-50">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex gap-4 animate-pulse">
                  <div className="h-3 bg-slate-100 rounded w-32 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                    <div className="h-3 bg-slate-100 rounded w-3/4" />
                  </div>
                  <div className="h-5 bg-slate-100 rounded-full w-16 shrink-0" />
                  <div className="h-3 bg-slate-100 rounded w-24 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="h-14 w-14 bg-red-50 rounded-2xl flex items-center justify-center">
              <AlertCircle className="text-red-400" size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-slate-800 font-black text-sm">{error}</h3>
              <p className="text-slate-400 text-xs mt-1">Please try refreshing or contact your system administrator.</p>
            </div>
            <button
              onClick={() => fetchLogs(false)}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="h-14 w-14 bg-violet-50 rounded-2xl flex items-center justify-center">
              <Filter className="text-violet-400" size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-slate-800 font-black text-sm">No Activity Logs Found</h3>
              <p className="text-slate-400 text-xs mt-1">
                {hasActiveFilters
                  ? "No logs match your current filters. Try adjusting your search."
                  : "No platform activity has been recorded yet."}
              </p>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 transition-colors">
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Log Table */}
        {!loading && !error && logs.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-violet-500" />
                <h2 className="text-sm font-black text-slate-800">Audit Logs</h2>
              </div>
              <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2.5 py-1 rounded-full">
                Showing {logs.length} of the latest actions recorded
              </span>
            </div>

            {/* Column Headers */}
            <div className="hidden md:grid grid-cols-[180px_1fr_100px_140px_90px] gap-4 px-6 py-2.5 bg-slate-50/80 border-b border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Date & Time</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">User</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Action</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Module</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Details</span>
            </div>

            {/* Log Rows */}
            <div className="divide-y divide-slate-50">
              {logs.map((log, idx) => (
                <div
                  key={log.id}
                  className="px-6 py-4 hover:bg-slate-50/50 transition-colors group"
                >
                  {/* Mobile layout */}
                  <div className="md:hidden space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <ActionBadge action={log.action} />
                      <span className="text-[10px] text-slate-400 font-medium">{timeAgo(log.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                        <User size={10} className="text-slate-500" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-800">{log.userName || "System User"}</span>
                        <span className="text-[10px] text-slate-400 block">{log.userEmail}</span>
                      </div>
                      <div className="ml-auto shrink-0">
                        <RoleBadge role={log.userRole} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <ModuleIcon module={log.module} />
                      <span className="font-semibold">{log.module}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{log.details}</p>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:grid grid-cols-[180px_1fr_100px_140px_1fr] gap-4 items-start">
                    {/* Date */}
                    <div className="shrink-0">
                      <p className="text-[11px] font-bold text-slate-700">{formatDate(log.createdAt)}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(log.createdAt)}</p>
                    </div>

                    {/* User */}
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="h-7 w-7 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <User size={11} className="text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 leading-tight truncate">{log.userName || "System User"}</p>
                        <p className="text-[10px] text-slate-400 truncate">{log.userEmail}</p>
                        <div className="mt-1">
                          <RoleBadge role={log.userRole} />
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div>
                      <ActionBadge action={log.action} />
                    </div>

                    {/* Module */}
                    <div className="flex items-center gap-1.5">
                      <ModuleIcon module={log.module} />
                      <span className="text-xs font-bold text-slate-600">{log.module}</span>
                    </div>

                    {/* Details */}
                    <p className="text-[11px] text-slate-600 leading-relaxed">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {logs.length === limit && (
              <div className="px-6 py-4 flex justify-center border-t border-slate-100 bg-white">
                <button
                  onClick={() => setLimit((prev) => prev + 50)}
                  disabled={loading || refreshing}
                  className="flex items-center gap-2 px-5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading || refreshing ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More Actions"
                  )}
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-medium">
                Audit logs are retained for platform monitoring purposes only. Access restricted to Admin Office accounts.
              </span>
              <button
                onClick={() => fetchLogs(true)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-violet-600 hover:text-violet-800 transition-colors"
              >
                <RefreshCw size={10} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
