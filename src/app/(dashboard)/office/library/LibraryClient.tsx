"use client";

import React, { useState, useTransition } from "react";
import { addResourceAction, deleteResourceAction, updateResourceAction } from "@/features/academy/actions/resourceActions";
import { issueResourceAction, returnResourceAction } from "@/features/academy/actions/resourceActions";
import {
  Plus, BookOpen, Search, Pencil, Trash2, ArrowRightLeft, Clock,
  CheckCircle, X, Filter, ChevronDown, Users, Package
} from "lucide-react";
import { useRouter } from "next/navigation";

const BOOK_CATEGORIES = ["All", "BOOK", "TEXTBOOK", "REFERENCE", "NOVEL", "MAGAZINE", "OTHER"];
const BOOK_TYPES = ["BOOK", "TEXTBOOK", "REFERENCE", "NOVEL", "MAGAZINE", "OTHER_BOOK"];

interface LibraryClientProps {
  initialResources: any[];
  initialIssuances: any[];
  students: any[];
  teachers: any[];
}

export default function LibraryClient({
  initialResources,
  initialIssuances,
  students,
  teachers,
}: LibraryClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [resourcesList, setResourcesList] = useState<any[]>(initialResources);
  const [issuancesList, setIssuancesList] = useState<any[]>(initialIssuances);

  // UI State
  const [activeTab, setActiveTab] = useState<"catalog" | "issue" | "issuances">("catalog");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [editItem, setEditItem] = useState<any | null>(null);

  // Add Form
  const [resName, setResName] = useState("");
  const [resType, setResType] = useState("BOOK");
  const [resQty, setResQty] = useState("");
  const [resCost, setResCost] = useState("");
  const [resAuthor, setResAuthor] = useState("");
  const [addMsg, setAddMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit Form
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("BOOK");
  const [editQty, setEditQty] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editMsg, setEditMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Issue Form
  const [issueResId, setIssueResId] = useState("");
  const [recipientType, setRecipientType] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [issueQty, setIssueQty] = useState("");
  const [issueMsg, setIssueMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredResources = resourcesList.filter((r) => {
    const matchCat = categoryFilter === "All" || r.type === categoryFilter;
    const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    setAddMsg(null);
    const qty = parseInt(resQty);
    const cost = parseFloat(resCost);
    if (!resName.trim()) { setAddMsg({ type: "error", text: "Item name required." }); return; }
    if (isNaN(qty) || qty <= 0) { setAddMsg({ type: "error", text: "Quantity must be > 0." }); return; }
    if (isNaN(cost) || cost < 0) { setAddMsg({ type: "error", text: "Cost must be >= 0." }); return; }

    startTransition(async () => {
      const res = await addResourceAction({ name: resName, type: resType, totalQuantity: qty, cost });
      if (res.success) {
        setAddMsg({ type: "success", text: "Book added to catalog!" });
        setResName(""); setResQty(""); setResCost(""); setResAuthor("");
        setShowAddForm(false);
        router.refresh();
      } else {
        setAddMsg({ type: "error", text: res.error || "Failed to add." });
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
    const cost = parseFloat(editCost);
    if (!editName.trim()) { setEditMsg({ type: "error", text: "Name required." }); return; }
    if (isNaN(qty) || qty <= 0) { setEditMsg({ type: "error", text: "Quantity must be > 0." }); return; }

    startTransition(async () => {
      const res = await updateResourceAction(editItem.id, { name: editName, type: editType, totalQuantity: qty, cost });
      if (res.success) {
        setEditItem(null);
        router.refresh();
      } else {
        setEditMsg({ type: "error", text: res.error || "Failed to update." });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this book from the catalog? All issuance records will also be removed.")) return;
    startTransition(async () => {
      const res = await deleteResourceAction(id);
      if (res.success) router.refresh();
      else alert(res.error || "Failed to delete.");
    });
  };

  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault();
    setIssueMsg(null);
    const resId = parseInt(issueResId);
    const qty = parseInt(issueQty);
    if (isNaN(resId)) { setIssueMsg({ type: "error", text: "Select a book." }); return; }
    if (isNaN(qty) || qty <= 0) { setIssueMsg({ type: "error", text: "Quantity must be > 0." }); return; }
    if (recipientType === "STUDENT" && !selectedStudentId) { setIssueMsg({ type: "error", text: "Select student." }); return; }
    if (recipientType === "TEACHER" && !selectedTeacherId) { setIssueMsg({ type: "error", text: "Select teacher." }); return; }

    const selectedResource = resourcesList.find((r) => r.id === resId);
    if (selectedResource && selectedResource.availableQuantity < qty) {
      setIssueMsg({ type: "error", text: `Only ${selectedResource.availableQuantity} copies available.` });
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
        setIssueMsg({ type: "success", text: "Book issued successfully!" });
        setIssueResId(""); setSelectedStudentId(""); setSelectedTeacherId(""); setIssueQty("");
        router.refresh();
      } else {
        setIssueMsg({ type: "error", text: res.error || "Failed to issue." });
      }
    });
  };

  const handleReturn = (issuanceId: number) => {
    startTransition(async () => {
      const res = await returnResourceAction(issuanceId);
      if (res.success) router.refresh();
      else alert(res.error || "Failed to return.");
    });
  };

  const stats = {
    total: resourcesList.length,
    available: resourcesList.reduce((s, r) => s + r.availableQuantity, 0),
    issued: issuancesList.filter(i => i.status === "ISSUED").length,
  };

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-blue-600" /> Library Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage books, textbooks, and reference materials catalog.</p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setActiveTab("catalog"); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" /> Add Book
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Books", value: stats.total, color: "blue" },
          { label: "Available Copies", value: stats.available, color: "emerald" },
          { label: "Currently Issued", value: stats.issued, color: "amber" },
        ].map((s) => (
          <div key={s.label} className={`bg-${s.color}-50 border border-${s.color}-100 rounded-2xl p-4`}>
            <div className={`text-2xl font-black text-${s.color}-700`}>{s.value}</div>
            <div className={`text-xs font-bold text-${s.color}-500 mt-1`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[
          { key: "catalog", label: "📚 Catalog", icon: Package },
          { key: "issue", label: "🔄 Issue Book", icon: ArrowRightLeft },
          { key: "issuances", label: "📋 Issuance Log", icon: Clock },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === tab.key
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-600" /> Add New Book
              </h2>
              <button onClick={() => setShowAddForm(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddResource} className="space-y-4">
              {addMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold ${addMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {addMsg.text}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Book / Item Name *</label>
                  <input type="text" value={resName} onChange={e => setResName(e.target.value)}
                    placeholder="e.g. NCERT Math Class 10" required
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 focus:bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Category *</label>
                  <select value={resType} onChange={e => setResType(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 focus:bg-white">
                    <option value="BOOK">Book / Textbook</option>
                    <option value="REFERENCE">Reference Book</option>
                    <option value="NOVEL">Novel / Story</option>
                    <option value="MAGAZINE">Magazine / Journal</option>
                    <option value="OTHER_BOOK">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Total Copies *</label>
                  <input type="number" value={resQty} onChange={e => setResQty(e.target.value)} min={1} required
                    placeholder="e.g. 30"
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 focus:bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Unit Cost (₹)</label>
                  <input type="number" value={resCost} onChange={e => setResCost(e.target.value)} min={0} step="any"
                    placeholder="e.g. 250"
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 focus:bg-white" />
                </div>
              </div>
              <button type="submit" disabled={isPending}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50">
                {isPending ? "Adding..." : "Add to Catalog"}
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
                <Pencil className="h-4 w-4 text-amber-500" /> Edit Book
              </h2>
              <button onClick={() => setEditItem(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              {editMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold ${editMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {editMsg.text}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Book Name *</label>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 focus:bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Category</label>
                  <select value={editType} onChange={e => setEditType(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 focus:bg-white">
                    <option value="BOOK">Book / Textbook</option>
                    <option value="REFERENCE">Reference Book</option>
                    <option value="NOVEL">Novel / Story</option>
                    <option value="MAGAZINE">Magazine / Journal</option>
                    <option value="OTHER_BOOK">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Total Copies</label>
                  <input type="number" value={editQty} onChange={e => setEditQty(e.target.value)} min={1}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 focus:bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Unit Cost (₹)</label>
                  <input type="number" value={editCost} onChange={e => setEditCost(e.target.value)} min={0} step="any"
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 focus:bg-white" />
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
              <BookOpen className="h-5 w-5 text-blue-600" /> Book Catalog
            </h2>
            <div className="flex gap-3 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search books..."
                  className="pl-8 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 w-44"
                />
              </div>
              {/* Category Filter */}
              <div className="flex gap-1 flex-wrap">
                {["All", "BOOK", "REFERENCE", "NOVEL", "MAGAZINE", "OTHER_BOOK"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      categoryFilter === cat
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {cat === "OTHER_BOOK" ? "Other" : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredResources.length === 0 ? (
            <div className="py-16 text-center text-slate-400 italic text-sm">
              No books found. Click "Add Book" to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider font-black text-slate-400">
                    <th className="pb-3 px-5 pt-4">Book Name</th>
                    <th className="pb-3 px-3 pt-4">Category</th>
                    <th className="pb-3 px-3 pt-4 text-center">Total</th>
                    <th className="pb-3 px-3 pt-4 text-center">Available</th>
                    <th className="pb-3 px-3 pt-4 text-right">Unit Cost</th>
                    <th className="pb-3 px-3 pt-4 text-right">Total Value</th>
                    <th className="pb-3 px-5 pt-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs text-slate-700 font-medium">
                  {filteredResources.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="py-3.5 px-5 font-bold text-slate-900">{res.name}</td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700">
                          {res.type === "OTHER_BOOK" ? "Other" : res.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-800">{res.totalQuantity}</td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black ${
                          res.availableQuantity === 0 ? "bg-red-50 text-red-700"
                          : res.availableQuantity < 5 ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {res.availableQuantity}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                        ₹{res.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-blue-600">
                        ₹{(res.totalQuantity * res.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(res)}
                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(res.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
            <ArrowRightLeft className="h-4.5 w-4.5 text-blue-600" /> Issue Book to Student / Teacher
          </h2>
          <form onSubmit={handleIssue} className="space-y-4">
            {issueMsg && (
              <div className={`p-3.5 rounded-xl text-xs font-bold ${issueMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {issueMsg.text}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Select Book</label>
                <select value={issueResId} onChange={e => setIssueResId(e.target.value)} required
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500">
                  <option value="">-- Choose Book --</option>
                  {resourcesList.map((res) => (
                    <option key={res.id} value={res.id}>
                      {res.name} (Available: {res.availableQuantity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Recipient Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["STUDENT", "TEACHER"] as const).map((type) => (
                    <button key={type} type="button" onClick={() => setRecipientType(type)}
                      className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                        recipientType === type ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}>
                      {type === "STUDENT" ? "👨‍🎓 Student" : "👩‍🏫 Teacher"}
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
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500">
                    <option value="">-- Choose Student --</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} (Roll: {s.rollNumber || "N/A"})</option>)}
                  </select>
                ) : (
                  <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} required
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500">
                    <option value="">-- Choose Teacher --</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Copies to Issue</label>
                <input type="number" value={issueQty} onChange={e => setIssueQty(e.target.value)} min={1} required
                  placeholder="e.g. 1"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <button type="submit" disabled={isPending}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50">
              {isPending ? "Issuing..." : "Issue Book"}
            </button>
          </form>
        </div>
      )}

      {/* Issuances Tab */}
      {activeTab === "issuances" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" /> Issuance Log
              <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-black">
                {issuancesList.filter(i => i.status === "ISSUED").length} Active
              </span>
            </h2>
          </div>
          {issuancesList.length === 0 ? (
            <div className="py-16 text-center text-slate-400 italic text-sm">No issuances found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider font-black text-slate-400">
                    <th className="pb-3 px-5 pt-4">Book</th>
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
                          <span className={`inline-flex py-0.5 px-2 rounded-full text-[9px] uppercase tracking-wider font-black ${
                            log.status === "RETURNED" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-blue-50 text-blue-700 border border-blue-100 animate-pulse"
                          }`}>
                            {log.status === "RETURNED" ? "Returned" : "Active"}
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
