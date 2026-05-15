"use client";

import React, { useState } from "react";
import { Users2, Search, ShieldCheck, ChevronRight, User } from "lucide-react";

const COMMITTEES = [
  "Sexual Harassment Committee/Internal Complaints Committee",
  "Grievance Redressal Committee",
  "School Management Committee (SMC)",
  "Academic Committee",
  "Examination Committee",
  "Disaster Management Committee",
  "School Discipline Committee",
  "Anti-Bullying Committee",
  "Child Protection Committee",
  "Cultural & Co-curricular Activities Committee",
  "Health & Wellness Committee",
  "Inclusive Education/Special Needs Committee"
];

interface Teacher {
  id: string;
  name: string;
  committees: string | null;
  responsibility: string | null;
  assignedRole: string | null;
  specialization: string | null;
}

export function CommitteeManagementClient({ initialTeachers }: { initialTeachers: Teacher[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  // Group teachers by committee
  const groupedCommittees = COMMITTEES.map(committeeName => {
    const members = initialTeachers.filter(t => t.committees?.includes(committeeName));
    return {
      name: committeeName,
      members: members
    };
  });

  const filteredGroups = groupedCommittees.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.members.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalMembers = initialTeachers.reduce((acc, t) => acc + (t.committees ? t.committees.split(",").length : 0), 0);
  const activeHeads = initialTeachers.filter(t => t.responsibility?.toLowerCase().includes("head") || t.responsibility?.toLowerCase().includes("leader")).length;

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
          <p className="text-slate-500 mt-1 font-medium text-sm">View and manage school committees and their members.</p>
        </div>
      </div>

      {/* Stats/Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Committees", value: COMMITTEES.length.toString(), icon: Users2, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Assignments", value: totalMembers.toString(), icon: User, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Identified Leaders", value: activeHeads.toString(), icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50" },
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

      {/* Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input 
            type="text" 
            placeholder="Search committees or members..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
          />
        </div>
      </div>

      {/* Committee Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredGroups.map((group, idx) => (
          <div key={idx} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight max-w-[80%] leading-snug">
                {group.name}
              </h3>
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                {group.members.length} Members
              </span>
            </div>
            <div className="flex-1 p-2 space-y-1 overflow-y-auto max-h-[300px]">
              {group.members.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">No Members Assigned</p>
                </div>
              ) : (
                group.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-white border border-slate-100 text-slate-400 rounded-xl flex items-center justify-center font-bold text-xs group-hover:border-indigo-200 group-hover:text-indigo-500 transition-colors">
                        {member.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{member.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                          {member.assignedRole || member.specialization || "Staff"}
                        </p>
                      </div>
                    </div>
                    {member.responsibility && (
                       <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 uppercase tracking-tighter">
                         {member.responsibility}
                       </span>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-slate-50 text-right">
                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 ml-auto hover:gap-2 transition-all">
                  Manage Assignments <ChevronRight size={12} />
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
