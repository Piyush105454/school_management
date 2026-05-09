"use client";

import React from "react";
import { Users2, Plus, Search, Filter, ShieldCheck } from "lucide-react";
import { ActionDropdown } from "@/components/ui/ActionDropdown";

export default function CommitteeManagementPage() {
  // Mock data for committees
  const committees = [
    {
      id: "COM-001",
      name: "Academic Excellence Committee",
      head: "Dr. Sharma",
      members: 12,
      status: "Active",
      nextMeeting: "2024-05-15",
    },
    {
      id: "COM-002",
      name: "Sports & Athletics Council",
      head: "Mr. Khan",
      members: 8,
      status: "Active",
      nextMeeting: "2024-05-12",
    },
    {
      id: "COM-003",
      name: "Disciplinary Committee",
      head: "Mrs. Verma",
      members: 5,
      status: "On Hold",
      nextMeeting: "TBD",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <Users2 size={24} />
            </div>
            Committee Management
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Manage school committees, heads, and meeting schedules.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 w-fit">
          <Plus size={20} />
          Create New Committee
        </button>
      </div>

      {/* Stats/Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Committees", value: "8", icon: Users2, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Heads", value: "12", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Upcoming Meetings", value: "4", icon: Plus, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`h-12 w-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Committee List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input 
                type="text" 
                placeholder="Search committees..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-bold text-slate-600 transition-colors">
              <Filter size={16} />
              Filter
            </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Committee Name</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Head</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Members</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Next Meeting</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {committees.map((committee) => (
                <tr key={committee.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{committee.name}</span>
                      <span className="text-[11px] text-slate-400 font-medium">ID: {committee.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-600 text-sm">{committee.head}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-500">{committee.members} Members</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      committee.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                    }`}>
                      {committee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">{committee.nextMeeting}</td>
                  <td className="px-6 py-4 text-right">
                    <ActionDropdown 
                      actions={[
                        { label: "View Members", onClick: () => console.log("Members") },
                        { label: "Edit Details", onClick: () => console.log("Edit") },
                        { label: "Schedule Meeting", onClick: () => console.log("Schedule") },
                        { label: "Delete", onClick: () => console.log("Delete"), variant: "danger" },
                      ]} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
