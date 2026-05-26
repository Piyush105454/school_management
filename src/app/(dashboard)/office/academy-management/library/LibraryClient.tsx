"use client";

import React, { useState, useTransition } from "react";
import { addResourceAction, issueResourceAction, returnResourceAction, deleteResourceAction } from "@/features/academy/actions/resourceActions";
import { Plus, BookOpen, Clock, Users, ArrowRightLeft, DollarSign, Trash } from "lucide-react";
import { useRouter } from "next/navigation";

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

  // Active resource list & active issuances state
  const [resourcesList, setResourcesList] = useState<any[]>(initialResources);
  const [issuancesList, setIssuancesList] = useState<any[]>(initialIssuances);

  // Forms State
  // 1. Add Resource Form
  const [resName, setResName] = useState("");
  const [resType, setResType] = useState("BOOK");
  const [resQty, setResQty] = useState("");
  const [resCost, setResCost] = useState("");
  const [addMsg, setAddMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 2. Issue Resource Form
  const [issueResId, setIssueResId] = useState("");
  const [recipientType, setRecipientType] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [issueQty, setIssueQty] = useState("");
  const [issueMsg, setIssueMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Actions
  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    setAddMsg(null);

    const qty = parseInt(resQty);
    const cost = parseFloat(resCost);

    if (!resName.trim() || !resType) {
      setAddMsg({ type: "error", text: "Please enter name and select type." });
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      setAddMsg({ type: "error", text: "Quantity must be greater than zero." });
      return;
    }

    if (isNaN(cost) || cost < 0) {
      setAddMsg({ type: "error", text: "Cost must be zero or positive." });
      return;
    }

    startTransition(async () => {
      const res = await addResourceAction({
        name: resName,
        type: resType,
        totalQuantity: qty,
        cost: cost,
      });

      if (res.success) {
        setAddMsg({ type: "success", text: "Resource added successfully!" });
        setResName("");
        setResQty("");
        setResCost("");
        router.refresh();
      } else {
        setAddMsg({ type: "error", text: res.error || "Failed to add resource." });
      }
    });
  };

  const handleIssueResource = (e: React.FormEvent) => {
    e.preventDefault();
    setIssueMsg(null);

    const resId = parseInt(issueResId);
    const qty = parseInt(issueQty);

    if (isNaN(resId)) {
      setIssueMsg({ type: "error", text: "Please select a resource to issue." });
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      setIssueMsg({ type: "error", text: "Quantity must be greater than zero." });
      return;
    }

    if (recipientType === "STUDENT" && !selectedStudentId) {
      setIssueMsg({ type: "error", text: "Please select a student." });
      return;
    }

    if (recipientType === "TEACHER" && !selectedTeacherId) {
      setIssueMsg({ type: "error", text: "Please select a teacher." });
      return;
    }

    // Client-side quick stock check
    const selectedResource = resourcesList.find((r) => r.id === resId);
    if (selectedResource && selectedResource.availableQuantity < qty) {
      setIssueMsg({
        type: "error",
        text: `Insufficient stock. Only ${selectedResource.availableQuantity} available.`,
      });
      return;
    }

    startTransition(async () => {
      const res = await issueResourceAction({
        resourceId: resId,
        recipientType: recipientType,
        studentId: recipientType === "STUDENT" ? parseInt(selectedStudentId) : undefined,
        teacherId: recipientType === "TEACHER" ? selectedTeacherId : undefined,
        quantityIssued: qty,
      });

      if (res.success) {
        setIssueMsg({ type: "success", text: "Resource issued successfully!" });
        setIssueResId("");
        setSelectedStudentId("");
        setSelectedTeacherId("");
        setIssueQty("");
        router.refresh();
      } else {
        setIssueMsg({ type: "error", text: res.error || "Failed to issue resource." });
      }
    });
  };

  const handleReturnResource = (issuanceId: number) => {
    startTransition(async () => {
      const res = await returnResourceAction(issuanceId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to mark resource as returned.");
      }
    });
  };

  const handleDeleteResource = (resourceId: number) => {
    if (!confirm("Are you sure you want to permanently delete this resource item? All issuance logs for this item will also be removed.")) {
      return;
    }
    startTransition(async () => {
      const res = await deleteResourceAction(resourceId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to delete resource.");
      }
    });
  };

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Library & Resources</h1>
        <p className="text-slate-500 text-sm">Manage catalogs, unit costs, and student or faculty resource distribution.</p>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form 1: Add Catalog Item */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-5 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Plus className="h-4.5 w-4.5 text-blue-600" /> Register Inventory Item
          </h2>

          <form onSubmit={handleAddResource} className="space-y-4">
            {addMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs font-bold ${
                  addMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {addMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Item Name</label>
                <input
                  type="text"
                  value={resName}
                  onChange={(e) => setResName(e.target.value)}
                  placeholder="e.g. iPad Pro, Math Text Book"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Item Type</label>
                <select
                  value={resType}
                  onChange={(e) => setResType(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="BOOK">Book / Textbook</option>
                  <option value="DEVICE">Device / Tablet / Laptop</option>
                  <option value="EQUIPMENT">Lab Equipment</option>
                  <option value="OTHER">Other Resource</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Total Quantity</label>
                <input
                  type="number"
                  value={resQty}
                  onChange={(e) => setResQty(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                  min={1}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Unit Cost (₹)</label>
                <input
                  type="number"
                  value={resCost}
                  onChange={(e) => setResCost(e.target.value)}
                  placeholder="e.g. 750"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                  min={0}
                  step="any"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md shadow-blue-500/10 active:scale-95 disabled:opacity-55"
            >
              Add Catalog Item
            </button>
          </form>
        </div>

        {/* Form 2: Issue Resource to student/teacher */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-5 pb-2 border-b border-slate-100 flex items-center gap-2">
            <ArrowRightLeft className="h-4.5 w-4.5 text-blue-600" /> Issue Resource Item
          </h2>

          <form onSubmit={handleIssueResource} className="space-y-4">
            {issueMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs font-bold ${
                  issueMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {issueMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Select Resource */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Select Resource</label>
                <select
                  value={issueResId}
                  onChange={(e) => setIssueResId(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                >
                  <option value="">-- Choose Item --</option>
                  {resourcesList.map((res) => (
                    <option key={res.id} value={res.id}>
                      {res.name} (Stock: {res.availableQuantity}/{res.totalQuantity})
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipient Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Recipient Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecipientType("STUDENT")}
                    className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                      recipientType === "STUDENT"
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientType("TEACHER")}
                    className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                      recipientType === "TEACHER"
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Teacher / Staff
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recipient Autocomplete Dropdowns */}
              {recipientType === "STUDENT" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Select Student</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white"
                    required
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} (Roll: {student.rollNumber || "N/A"})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Select Teacher</label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white"
                    required
                  >
                    <option value="">-- Choose Teacher --</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantity to Issue */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Quantity to Issue</label>
                <input
                  type="number"
                  value={issueQty}
                  onChange={(e) => setIssueQty(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                  min={1}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md shadow-blue-500/10 active:scale-95 disabled:opacity-55"
            >
              Issue Resource
            </button>
          </form>
        </div>
      </div>

      {/* Lists Tables Grid */}
      <div className="grid grid-cols-1 gap-8">
        {/* Section 1: Resource Inventory List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-5 pb-2 border-b border-slate-100 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" /> Current Inventory Catalog
          </h2>

          {resourcesList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 italic text-sm">
              No inventory catalog items found. Complete the form above to add items.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider font-black text-slate-400">
                    <th className="pb-3 pr-2">Item Name</th>
                    <th className="pb-3 px-2">Type</th>
                    <th className="pb-3 px-2 text-center">Total Stock</th>
                    <th className="pb-3 px-2 text-center">Available Stock</th>
                    <th className="pb-3 px-2 text-right">Unit Cost</th>
                    <th className="pb-3 px-2 text-right">Total Cost</th>
                    <th className="pb-3 pl-2 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs text-slate-700 font-medium">
                  {resourcesList.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 pr-2 font-bold text-slate-900">{res.name}</td>
                      <td className="py-3.5 px-2 font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
                        {res.type}
                      </td>
                      <td className="py-3.5 px-2 text-center font-bold text-slate-800">
                        {res.totalQuantity}
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black ${
                            res.availableQuantity === 0
                              ? "bg-red-50 text-red-700"
                              : res.availableQuantity < 5
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {res.availableQuantity}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right font-bold text-slate-900">
                        ₹{res.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-2 text-right font-bold text-blue-600">
                        ₹{(res.totalQuantity * res.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 pl-2 text-right">
                        <button
                          onClick={() => handleDeleteResource(res.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete catalog item"
                        >
                          <Trash size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 2: Resource Issuances List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-5 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" /> Active Distributions & Issuances Log
          </h2>

          {issuancesList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 italic text-sm">
              No issuance records found. Register an issuance in the form above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider font-black text-slate-400">
                    <th className="pb-3 pr-2">Issued Item</th>
                    <th className="pb-3 px-2">Issued To</th>
                    <th className="pb-3 px-2 text-center">Quantity</th>
                    <th className="pb-3 px-2">Issue Date</th>
                    <th className="pb-3 px-2">Return Date</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 pl-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs text-slate-700 font-medium">
                  {issuancesList.map((log) => {
                    const issueDate = new Date(log.issuedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    const returnDate = log.returnedAt
                      ? new Date(log.returnedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "-";

                    const recipientName =
                      log.recipientType === "STUDENT"
                        ? log.studentName
                        : log.teacherName || "Teacher";
                    const subLabel =
                      log.recipientType === "STUDENT"
                        ? `Roll: ${log.studentRoll || "N/A"}`
                        : "Teacher / Staff";

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Issued Item */}
                        <td className="py-3.5 pr-2">
                          <div className="font-bold text-slate-900">{log.resourceName}</div>
                          <div className="text-[9px] text-slate-400 font-semibold uppercase">
                            Type: {log.resourceType}
                          </div>
                        </td>

                        {/* Recipient Details */}
                        <td className="py-3.5 px-2">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Users size={12} className="text-slate-400" />
                            <span>{recipientName}</span>
                          </div>
                          <div className="text-[9px] text-slate-400 font-semibold uppercase pl-4.5">
                            {subLabel}
                          </div>
                        </td>

                        {/* Quantity */}
                        <td className="py-3.5 px-2 text-center font-bold text-slate-800">
                          {log.quantityIssued}
                        </td>

                        {/* Issue Date */}
                        <td className="py-3.5 px-2 text-slate-500 font-semibold">{issueDate}</td>

                        {/* Return Date */}
                        <td className="py-3.5 px-2 text-slate-500 font-semibold">{returnDate}</td>

                        {/* Status */}
                        <td className="py-3.5 px-2">
                          <span
                            className={`inline-flex py-0.5 px-2 rounded-full text-[9px] uppercase tracking-wider font-black ${
                              log.status === "RETURNED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-blue-50 text-blue-700 border border-blue-100 animate-pulse"
                            }`}
                          >
                            {log.status === "RETURNED" ? "Returned" : "Active / Issued"}
                          </span>
                        </td>

                        {/* Return Action */}
                        <td className="py-3.5 pl-2 text-right">
                          {log.status === "ISSUED" ? (
                            <button
                              onClick={() => handleReturnResource(log.id)}
                              disabled={isPending}
                              className="py-1 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors disabled:opacity-50"
                            >
                              Return Item
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Returned
                            </span>
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
      </div>
    </div>
  );
}
