"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, ShieldAlert, FileText, HeartHandshake, AlertCircle, Calendar, UserCheck } from "lucide-react";
import { getStudentIncidentsAction } from "@/features/academy/actions/incidentActions";

interface IncidentRecord {
  id: string;
  title: string;
  type: "INCIDENT" | "COMPLAIN" | "FEEDBACK";
  note: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  teacher?: { id: string; name: string } | null;
}

export default function StudentIncidentClient({ admissionId }: { admissionId: string }) {
  const [activeTab, setActiveTab] = useState<"INCIDENT" | "COMPLAIN" | "FEEDBACK">("INCIDENT");
  const [incidentsList, setIncidentsList] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    loadIncidents();
  }, [admissionId]);

  const loadIncidents = async () => {
    setLoading(true);
    const res = await getStudentIncidentsAction(admissionId);
    if (res.success && res.data) {
      setIncidentsList(res.data as any);
    }
    setLoading(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "bg-red-100 text-red-700 border border-red-200/50";
      case "High": return "bg-orange-100 text-orange-700 border border-orange-200/50";
      case "Medium": return "bg-blue-100 text-blue-700 border border-blue-200/50";
      default: return "bg-slate-100 text-slate-700 border border-slate-200/50";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
      case "Acknowledged":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200/50";
      case "In Progress":
      case "Reviewed":
        return "bg-amber-100 text-amber-700 border border-amber-200/50";
      default: return "bg-slate-100 text-slate-700 border border-slate-200/50";
    }
  };

  const activeTabItems = incidentsList.filter((item) => item.type === activeTab);
  const itemTypeLabel = activeTab === "INCIDENT" ? "Incident" : activeTab === "COMPLAIN" ? "Complaint" : "Feedback";

  const filteredItems = activeTabItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-3">
            {activeTab === "INCIDENT" && (
              <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100 shadow-inner">
                <ShieldAlert size={20} className="animate-pulse" />
              </div>
            )}
            {activeTab === "COMPLAIN" && (
              <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100 shadow-inner">
                <FileText size={20} />
              </div>
            )}
            {activeTab === "FEEDBACK" && (
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 shadow-inner">
                <HeartHandshake size={20} />
              </div>
            )}
            <span>My {itemTypeLabel}s</span>
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {activeTab === "INCIDENT" && "View logged security and infrastructure incidents related to you"}
            {activeTab === "COMPLAIN" && "View and monitor complaints submitted to the school administration"}
            {activeTab === "FEEDBACK" && "View curricular, facilities, or extracurricular feedback notes"}
          </p>
        </div>
      </div>

      {/* Button-based Navigation Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200/50 shadow-inner">
        <button
          onClick={() => {
            setActiveTab("INCIDENT");
            setSearchTerm("");
            setStatusFilter("ALL");
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "INCIDENT"
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <ShieldAlert size={14} />
          1. Incidents
        </button>
        <button
          onClick={() => {
            setActiveTab("COMPLAIN");
            setSearchTerm("");
            setStatusFilter("ALL");
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "COMPLAIN"
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileText size={14} />
          2. Complaints
        </button>
        <button
          onClick={() => {
            setActiveTab("FEEDBACK");
            setSearchTerm("");
            setStatusFilter("ALL");
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "FEEDBACK"
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <HeartHandshake size={14} />
          3. Feedbacks
        </button>
      </div>

      {/* Filters/Search */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-200 flex flex-col md:flex-row gap-4 items-center shadow-xl shadow-slate-100/30">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input 
            type="text" 
            placeholder={`Search ${itemTypeLabel.toLowerCase()}s by title or ID...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/10 transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 px-5 py-3 outline-none focus:ring-2 focus:ring-slate-900/10 transition-all cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            {activeTab === "FEEDBACK" && <option value="Reviewed">Reviewed</option>}
            {activeTab === "FEEDBACK" && <option value="Acknowledged">Acknowledged</option>}
          </select>
        </div>
      </div>

      {/* Database Table List */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto min-h-[220px]">
          {loading ? (
            <div className="flex items-center justify-center p-16">
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Loading records...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">ID</th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">{itemTypeLabel} Details</th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Category</th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Priority</th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-slate-400 group-hover:text-slate-950 transition-colors">
                        {activeTab === "INCIDENT" && "INC-"}
                        {activeTab === "COMPLAIN" && "COM-"}
                        {activeTab === "FEEDBACK" && "FDB-"}
                        {item.id.slice(0, 4).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.title}</span>
                        <p className="text-xs font-medium text-slate-500 leading-snug italic max-w-lg">
                          "{item.note}"
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {item.teacher && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[9px] font-bold">
                              <UserCheck size={10} />
                              Tagged Teacher: {item.teacher.name}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-slate-400 text-[9px] font-bold">
                            <Calendar size={10} />
                            {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-slate-600">{item.category}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {!loading && filteredItems.length === 0 && (
            <div className="p-16 text-center">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                <AlertCircle className="text-slate-300" size={28} />
              </div>
              <h3 className="text-slate-900 font-black uppercase tracking-wider text-xs">No {itemTypeLabel} Logs Found</h3>
              <p className="text-slate-400 font-bold text-[10px] uppercase mt-1.5 tracking-widest">Great! There are no records matching this query.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
