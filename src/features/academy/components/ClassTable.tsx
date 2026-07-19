"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Users, BookOpen, Presentation, Pencil, AlertTriangle, Check, Loader2 } from "lucide-react";
import { ActionDropdown } from "@/components/ui/ActionDropdown";
import { useRouter } from "next/navigation";
import { useInstitute } from "@/providers/InstituteProvider";

interface ClassData {
  id: number;
  name: string;
  institute: string;
  count: number;
}

interface ClassTableProps {
  classData: ClassData[];
  isAdmin?: boolean;
}

// ─── Rename Class Modal ───────────────────────────────────────────────────────
interface RenameModalProps {
  cls: ClassData | null;
  onClose: () => void;
  onSuccess: () => void;
}

function RenameClassModal({ cls, onClose, onSuccess }: RenameModalProps) {
  const displayName =
    cls?.name.startsWith("Class ") ||
    ["KG1", "KG2"].includes(cls?.name ?? "") ||
    cls?.name.toLowerCase().startsWith("wesa") ||
    cls?.institute?.toLowerCase() === "wes academy"
      ? cls?.name
      : `Class ${cls?.name}`;

  const [newName, setNewName] = useState(cls?.name ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!cls) return null;

  async function handleRename() {
    if (!newName.trim()) {
      setError("Class name cannot be empty.");
      return;
    }
    if (newName.trim() === cls!.name) {
      setError("New name is the same as the current name.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/classes/${cls!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName: newName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setSuccess(data.message ?? "Class renamed successfully.");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message ?? "Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="h-10 w-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
            <Pencil className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 font-outfit">Rename Class</h3>
            <p className="text-xs text-slate-500 font-medium">Admin action — changes all linked data</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 font-medium leading-relaxed">
              Renaming <span className="font-black">{displayName}</span> will update all linked teacher
              class assignments server-wide. This action cannot be undone.
            </div>
          </div>

          {/* Current name */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Current Class Name
            </label>
            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-500">
              {cls.name}
            </div>
          </div>

          {/* New name input */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              New Class Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleRename()}
              placeholder="e.g. Class 1A, Grade 1, KG1..."
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:font-normal placeholder:text-slate-400"
              autoFocus
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 animate-in fade-in duration-150">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-xs font-bold text-green-700 animate-in fade-in duration-150">
              <Check className="h-3.5 w-3.5 shrink-0" />
              {success}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-black rounded-2xl transition-all active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRename}
              disabled={loading || !newName.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Renaming…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirm Rename
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ClassTable ───────────────────────────────────────────────────────────────
export default function ClassTable({ classData, isAdmin = false }: ClassTableProps) {
  const router = useRouter();
  const { selectedInstitute, setSelectedInstitute, institutes } = useInstitute();

  const [renameTarget, setRenameTarget] = useState<ClassData | null>(null);

  function handleRenameSuccess() {
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Rename Modal */}
      <RenameClassModal
        cls={renameTarget}
        onClose={() => setRenameTarget(null)}
        onSuccess={handleRenameSuccess}
      />

      <div className="flex items-center gap-2">
        <div className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-2xl flex items-center gap-2 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter:</span>
          <select
            value={selectedInstitute}
            onChange={(e) => setSelectedInstitute(e.target.value)}
            disabled={institutes.length === 1}
            className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            {institutes.length !== 1 && <option value="ALL">All Institutes</option>}
            {institutes.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                  Class Detail
                </th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                  Confirmed Students
                </th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                  Manage Subjects
                </th>
                {/* Show Actions column header always — content differs by role */}
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {classData.map((cls) => {
                const displayName =
                  cls.name.startsWith("Class ") ||
                  ["KG1", "KG2"].includes(cls.name) ||
                  cls.name.toLowerCase().startsWith("wesa") ||
                  cls.institute?.toLowerCase() === "wes academy"
                    ? cls.name
                    : `Class ${cls.name}`;

                // Build actions list depending on role
                const actions = [
                  {
                    label: "View Students",
                    icon: <Users className="h-4 w-4" />,
                    onClick: () =>
                      router.push(
                        `/office/academy-management/classes/${cls.name}?institute=${encodeURIComponent(cls.institute)}`
                      ),
                  },
                  // ADMIN-only: Rename Class
                  ...(isAdmin
                    ? [
                        {
                          label: "Rename Class",
                          icon: <Pencil className="h-4 w-4" />,
                          onClick: () => setRenameTarget(cls),
                        },
                      ]
                    : []),
                ];

                return (
                  <tr key={cls.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <Presentation className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {displayName}
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {cls.institute}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full items-center gap-1.5 ring-1 ring-slate-200/50">
                          <Users className="h-3.5 w-3.5" />
                          <span className="text-xs font-black tracking-tight">{cls.count}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <Link
                        href={`/office/academy-management/classes/${cls.name}/subjects?institute=${encodeURIComponent(cls.institute)}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10 active:scale-95"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        View Subjects
                      </Link>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <ActionDropdown actions={actions} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
