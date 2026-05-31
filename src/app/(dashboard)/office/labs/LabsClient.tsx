"use client";

import React, { useState, useTransition } from "react";
import {
  addResourceAction,
  deleteResourceAction,
  updateResourceAction,
  issueResourceAction,
  returnResourceAction
} from "@/features/academy/actions/resourceActions";
import {
  Plus, FlaskConical, Search, Pencil, Trash2, ArrowRightLeft, Clock,
  X, Package
} from "lucide-react";
import { useRouter } from "next/navigation";

const LAB_TYPES = ["LAB_EQUIPMENT", "CHEMICAL", "APPARATUS", "LAB_OTHER"];
const TYPE_LABELS: Record<string, string> = {
  LAB_EQUIPMENT: "Lab Equipment",
  CHEMICAL: "Chemical / Reagent",
  APPARATUS: "Apparatus",
  LAB_OTHER: "Other Lab Item",
};
const TYPE_ICONS: Record<string, React.ElementType> = {
  LAB_EQUIPMENT: FlaskConical,
  CHEMICAL: FlaskConical,
  APPARATUS: FlaskConical,
  LAB_OTHER: Package,
};
const TYPE_COLORS: Record<string, string> = {
  LAB_EQUIPMENT: "bg-teal-50 text-teal-700",
  CHEMICAL: "bg-rose-50 text-rose-700",
  APPARATUS: "bg-cyan-50 text-cyan-700",
  LAB_OTHER: "bg-slate-100 text-slate-600",
};

interface LabsClientProps {
  initialResources: any[];
  initialIssuances: any[];
  students: any[];
  teachers: any[];
}

export default function LabsClient({
  initialResources,
  initialIssuances,
  students,
  teachers,
}: LabsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [resourcesList] = useState<any[]>(initialResources);
  const [issuancesList] = useState<any[]>(initialIssuances);

  const [activeTab, setActiveTab] = useState<"catalog" | "issue" | "issuances">("catalog");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [editItem, setEditItem] = useState<any | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add Form
  const [resName, setResName] = useState("");
  const [resType, setResType] = useState("LAB_EQUIPMENT");
  const [resQty, setResQty] = useState("");
  const [resCost, setResCost] = useState("");
  const [resDesc, setResDesc] = useState("");
  const [addMsg, setAddMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit Form
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("LAB_EQUIPMENT");
  const [editQty, setEditQty] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editMsg, setEditMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Issue Form
  const [issueResId, setIssueResId] = useState("");
  const [recipientType, setRecipientType] = useState<"STUDENT" | "TEACHER">("TEACHER");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [issueQty, setIssueQty] = useState("");
  const [issueMsg, setIssueMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredResources = resourcesList.filter((r) => {
    const matchCat = categoryFilter === "All" || r.type === categoryFilter;
    const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setAddMsg(null);
    const qty = parseInt(resQty);
    const cost = parseFloat(resCost || "0");
    if (!resName.trim()) { setAddMsg({ type: "error", text: "Name required." }); return; }
    if (isNaN(qty) || qty <= 0) { setAddMsg({ type: "error", text: "Qty must be > 0." }); return; }

    startTransition(async () => {
      const res = await addResourceAction({ name: resName, type: resType, totalQuantity: qty, cost });
      if (res.success) {
        setAddMsg({ type: "success", text: "Lab item added!" });
        setResName(""); setResQty(""); setResCost(""); setResDesc("");
        setShowAddForm(false);
        router.refresh();
      } else {
        setAddMsg({ type: "error", text: res.error || "Failed." });
      }
    });
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setEditName(item.name);
    setEditType(item.type);
    setEditQty(String(item.totalQuantity));
    setEditCost(String(item.cost));
    setEditMsg(null);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setEditMsg(null);
    const qty = parseInt(editQty);
    const cost = parseFloat(editCost || "0");
    if (!editName.trim()) { setEditMsg({ type: "error", text: "Name required." }); return; }
    if (isNaN(qty) || qty <= 0) { setEditMsg({ type: "error", text: "Qty must be > 0." }); return; }

    startTransition(async () => {
      const res = await updateResourceAction(editItem.id, { name: editName, type: editType, totalQuantity: qty, cost });
      if (res.success) { setEditItem(null); router.refresh(); }
      else setEditMsg({ type: "error", text: res.error || "Failed." });
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this lab item? All usage records will be removed too.")) return;
    startTransition(async () => {
      const res = await deleteResourceAction(id);
      if (res.success) router.refresh();
      else alert(res.error || "Failed.");
    });
  };

  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault();
    setIssueMsg(null);
    const resId = parseInt(issueResId);
    const qty = parseInt(issueQty);
    if (isNaN(resId)) { setIssueMsg({ type: "error", text: "Select a lab item." }); return; }
    if (isNaN(qty) || qty <= 0) { setIssueMsg({ type: "error", text: "Qty must be > 0." }); return; }
    if (recipientType === "STUDENT" && !selectedStudentId) { setIssueMsg({ type: "error", text: "Select student." }); return; }
    if (recipientType === "TEACHER" && !selectedTeacherId) { setIssueMsg({ type: "error", text: "Select teacher." }); return; }

    const selected = resourcesList.find(r => r.id === resId);
    if (selected && selected.availableQuantity < qty) {
      setIssueMsg({ type: "error", text: `Only ${selected.availableQuantity} available.` });
      return;
    }

    startTransition(async () => {
      const res = await issueResourceAction({
        resourceId: resId,
        recipientType,
        studentId: recipientType === "STUDENT" ? parseInt(selectedStudentId) : undefined,
        teacherId: recipientType === "TEACHER" ? selectedTeacherId : undefined,
        quantityIssued: qty,
      });
      if (res.success) {
        setIssueMsg({ type: "success", text: "Lab item issued!" });
        setIssueResId(""); setSelectedStudentId(""); setSelectedTeacherId(""); setIssueQty("");
        router.refresh();
      } else {
        setIssueMsg({ type: "error", text: res.error || "Failed." });
      }
    });
  };

  const handleReturn = (issuanceId: number) => {
    startTransition(async () => {
      const res = await returnResourceAction(issuanceId);
      if (res.success) router.refresh();
      else alert(res.error || "Failed.");
    });
  };

  const stats = {
    total: resourcesList.length,
    available: resourcesList.reduce((s, r) => s + r.availableQuantity, 0),
    issued: issuancesList.filter(i => i.status === "ISSUED").length,
    totalValue: resourcesList.reduce((s, r) => s + r.totalQuantity * r.cost, 0),
  };

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FlaskConical className="h-7 w-7 text-teal-600" /> Labs Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage lab equipment, chemicals, apparatus, and science resources.</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-md shadow-teal-500/20 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" /> Add Lab Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
          <div className="text-2xl font-black text-teal-700">{stats.total}</div>
          <div className="text-xs font-bold text-teal-500 mt-1">Total Items</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <div className="text-2xl font-black text-emerald-700">{stats.available}</div>
          <div className="text-xs font-bold text-emerald-500 mt-1">Available Units</div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <div className="text-2xl font-black text-amber-700">{stats.issued}</div>
          <div className="text-xs font-bold text-amber-500 mt-1">Currently In Use</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="text-2xl font-black text-blue-700">₹{(stats.totalValue / 1000).toFixed(1)}K</div>
          <div className="text-xs font-bold text-blue-500 mt-1">Total Asset Value</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[
          { key: "catalog", label: "🧪 Inventory" },
          { key: "issue", label: "🔄 Issue Item" },
          { key: "issuances", label: "📋 Usage Log" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === tab.key ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="h-4 w-4 text-teal-600" /> Add Lab Item
              </h2>
              <button onClick={() => setShowAddForm(false)} className="p-1 text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              {addMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold ${addMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {addMsg.text}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Item Name *</label>
                  <input type="text" value={resName} onChange={e => setResName(e.target.value)} required
                    placeholder="e.g. Bunsen Burner, HCl Solution, Microscope"
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-teal-500 focus:bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Category *</label>
                  <select value={resType} onChange={e => setResType(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-teal-500">
                    <option value="LAB_EQUIPMENT">Lab Equipment</option>
                    <option value="CHEMICAL">Chemical / Reagent</option>
                    <option value="APPARATUS">Apparatus</option>
                    <option value="LAB_OTHER">Other Lab Item</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Quantity *</label>
                  <input type="number" value={resQty} onChange={e => setResQty(e.target.value)} min={1} required
                    placeholder="e.g. 5"
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-teal-500" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Unit Cost (₹)</label>
                  <input type="number" value={resCost} onChange={e => setResCost(e.target.value)} min={0} step="any"
                    placeholder="e.g. 2500"
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-teal-500" />
                </div>
              </div>
              <button type="submit" disabled={isPending}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50">
                {isPending ? "Adding..." : "Add to Inventory"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Pencil className="h-4 w-4 text-amber-500" /> Edit Lab Item
              </h2>
              <button onClick={() => setEditItem(null)} className="p-1 text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              {editMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold ${editMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {editMsg.text}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Item Name *</label>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-teal-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Category</label>
                  <select value={editType} onChange={e => setEditType(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-teal-500">
                    <option value="LAB_EQUIPMENT">Lab Equipment</option>
                    <option value="CHEMICAL">Chemical / Reagent</option>
                    <option value="APPARATUS">Apparatus</option>
                    <option value="LAB_OTHER">Other Lab Item</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Quantity</label>
                  <input type="number" value={editQty} onChange={e => setEditQty(e.target.value)} min={1}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-teal-500" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Unit Cost (₹)</label>
                  <input type="number" value={editCost} onChange={e => setEditCost(e.target.value)} min={0} step="any"
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-teal-500" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditItem(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isPending}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50">
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Catalog Tab */}
      {activeTab === "catalog" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-teal-600" /> Lab Inventory
            </h2>
            <div className="flex gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search items..."
                  className="pl-8 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-teal-500 w-44" />
              </div>
              <div className="flex gap-1 flex-wrap">
                {["All", "LAB_EQUIPMENT", "CHEMICAL", "APPARATUS", "LAB_OTHER"].map((cat) => (
                  <button key={cat} onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${categoryFilter === cat ? "bg-teal-600 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                    {cat === "LAB_EQUIPMENT" ? "Equipment" : cat === "LAB_OTHER" ? "Other" : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {filteredResources.length === 0 ? (
            <div className="py-16 text-center text-slate-400 italic text-sm">
              No lab items found. Add equipment to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider font-black text-slate-400">
                    <th className="pb-3 px-5 pt-4">Item Name</th>
                    <th className="pb-3 px-3 pt-4">Category</th>
                    <th className="pb-3 px-3 pt-4 text-center">Total</th>
                    <th className="pb-3 px-3 pt-4 text-center">Available</th>
                    <th className="pb-3 px-3 pt-4 text-right">Unit Cost</th>
                    <th className="pb-3 px-3 pt-4 text-right">Total Value</th>
                    <th className="pb-3 px-5 pt-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs text-slate-700 font-medium">
                  {filteredResources.map((res) => {
                    const Icon = TYPE_ICONS[res.type] || Package;
                    const colorClass = TYPE_COLORS[res.type] || "bg-slate-100 text-slate-600";
                    return (
                      <tr key={res.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 text-teal-500" />
                            {res.name}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black ${colorClass}`}>
                            {TYPE_LABELS[res.type] || res.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-slate-800">{res.totalQuantity}</td>
                        <td className="py-3.5 px-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black ${res.availableQuantity === 0 ? "bg-red-50 text-red-700" : res.availableQuantity < 3 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                            {res.availableQuantity}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-slate-900">₹{res.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-3.5 px-3 text-right font-bold text-teal-600">₹{(res.totalQuantity * res.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(res)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil size={13} /></button>
                            <button onClick={() => handleDelete(res.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Issue Tab */}
      {activeTab === "issue" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-2xl">
          <h2 className="text-base font-bold text-slate-900 mb-5 pb-2 border-b border-slate-100 flex items-center gap-2">
            <ArrowRightLeft className="h-4.5 w-4.5 text-teal-600" /> Issue Lab Item
          </h2>
          <form onSubmit={handleIssue} className="space-y-4">
            {issueMsg && (
              <div className={`p-3.5 rounded-xl text-xs font-bold ${issueMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {issueMsg.text}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Select Lab Item</label>
                <select value={issueResId} onChange={e => setIssueResId(e.target.value)} required
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-teal-500">
                  <option value="">-- Choose Item --</option>
                  {resourcesList.map(res => (
                    <option key={res.id} value={res.id}>{res.name} (Available: {res.availableQuantity})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Recipient Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["STUDENT", "TEACHER"] as const).map((type) => (
                    <button key={type} type="button" onClick={() => setRecipientType(type)}
                      className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${recipientType === type ? "bg-teal-600 text-white border-teal-600 shadow-md" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"}`}>
                      {type === "STUDENT" ? "👨‍🎓 Student" : "👩‍🔬 Teacher"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  {recipientType === "STUDENT" ? "Select Student" : "Select Teacher"}
                </label>
                {recipientType === "STUDENT" ? (
                  <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} required
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-teal-500">
                    <option value="">-- Choose Student --</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} (Roll: {s.rollNumber || "N/A"})</option>)}
                  </select>
                ) : (
                  <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} required
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-teal-500">
                    <option value="">-- Choose Teacher --</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Quantity to Issue</label>
                <input type="number" value={issueQty} onChange={e => setIssueQty(e.target.value)} min={1} required
                  placeholder="e.g. 2"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-teal-500" />
              </div>
            </div>
            <button type="submit" disabled={isPending}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50">
              {isPending ? "Issuing..." : "Issue Lab Item"}
            </button>
          </form>
        </div>
      )}

      {/* Issuances Tab */}
      {activeTab === "issuances" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-teal-600" /> Usage Log
              <span className="ml-2 text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-black">
                {issuancesList.filter(i => i.status === "ISSUED").length} In Use
              </span>
            </h2>
          </div>
          {issuancesList.length === 0 ? (
            <div className="py-16 text-center text-slate-400 italic text-sm">No usage records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider font-black text-slate-400">
                    <th className="pb-3 px-5 pt-4">Item</th>
                    <th className="pb-3 px-3 pt-4">Issued To</th>
                    <th className="pb-3 px-3 pt-4 text-center">Qty</th>
                    <th className="pb-3 px-3 pt-4">Issue Date</th>
                    <th className="pb-3 px-3 pt-4">Return Date</th>
                    <th className="pb-3 px-3 pt-4">Status</th>
                    <th className="pb-3 px-5 pt-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs text-slate-700 font-medium">
                  {issuancesList.map((log) => {
                    const issueDate = new Date(log.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                    const returnDate = log.returnedAt ? new Date(log.returnedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
                    const recipientName = log.recipientType === "STUDENT" ? log.studentName : log.teacherName || "Teacher";
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-5 font-bold text-slate-900">{log.resourceName}</td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900">{recipientName}</div>
                          <div className="text-[9px] text-slate-400 font-semibold uppercase">
                            {log.recipientType === "STUDENT" ? `Roll: ${log.studentRoll || "N/A"}` : "Teacher / Staff"}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-slate-800">{log.quantityIssued}</td>
                        <td className="py-3.5 px-3 text-slate-500">{issueDate}</td>
                        <td className="py-3.5 px-3 text-slate-500">{returnDate}</td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex py-0.5 px-2 rounded-full text-[9px] uppercase tracking-wider font-black ${log.status === "RETURNED" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-teal-50 text-teal-700 border border-teal-100 animate-pulse"}`}>
                            {log.status === "RETURNED" ? "Returned" : "In Use"}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {log.status === "ISSUED" ? (
                            <button onClick={() => handleReturn(log.id)} disabled={isPending}
                              className="py-1 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors disabled:opacity-50">
                              Return
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">✓ Done</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
