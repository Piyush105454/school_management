"use client";

import React from "react";
import { AlertCircle, Plus, Search, Filter, MoreVertical } from "lucide-react";
import { ActionDropdown } from "@/components/ui/ActionDropdown";

export default function IncidentManagementPage() {
  // Mock data for incidents
  const incidents = [
    {
      id: "INC-001",
      title: "Broken Window in Class 10A",
      category: "Infrastructure",
      priority: "High",
      status: "Open",
      date: "2024-05-09",
    },
    {
      id: "INC-002",
      title: "Missing Library Book",
      category: "Resources",
      priority: "Low",
      status: "In Progress",
      date: "2024-05-08",
    },
    {
      id: "INC-003",
      title: "Unidentified Person on Campus",
      category: "Security",
      priority: "Critical",
      status: "Resolved",
      date: "2024-05-07",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "bg-red-100 text-red-700";
      case "High": return "bg-orange-100 text-orange-700";
      case "Medium": return "bg-blue-100 text-blue-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved": return "bg-green-100 text-green-700";
      case "In Progress": return "bg-amber-100 text-amber-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <AlertCircle size={24} />
            </div>
            Incident Management
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Track and resolve school incidents and complaints.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 w-fit">
          <Plus size={20} />
          Report Incident
        </button>
      </div>

      {/* Filters/Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input 
            type="text" 
            placeholder="Search incidents..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-bold text-slate-600 transition-colors">
            <Filter size={16} />
            Filter
          </button>
          <select className="bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer">
            <option>All Status</option>
            <option>Open</option>
            <option>In Progress</option>
            <option>Resolved</option>
          </select>
        </div>
      </div>

      {/* Incident List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">ID</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Incident Details</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Priority</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {incidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">{incident.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{incident.title}</span>
                      <span className="text-[11px] text-slate-400 font-medium">Reported on {incident.date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-600">{incident.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getPriorityColor(incident.priority)}`}>
                      {incident.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusColor(incident.status)}`}>
                      {incident.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ActionDropdown 
                      actions={[
                        { label: "View Details", onClick: () => console.log("View", incident.id) },
                        { label: "Update Status", onClick: () => console.log("Update", incident.id) },
                        { label: "Assign Staff", onClick: () => console.log("Assign", incident.id) },
                        { label: "Delete", onClick: () => console.log("Delete", incident.id), variant: "danger" },
                      ]} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {incidents.length === 0 && (
          <div className="p-12 text-center">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-slate-300" size={32} />
            </div>
            <h3 className="text-slate-900 font-bold">No incidents found</h3>
            <p className="text-slate-500 text-sm mt-1">Great! There are no reported incidents at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
