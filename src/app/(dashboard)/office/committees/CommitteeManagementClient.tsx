"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users2, Search, ShieldCheck, ChevronRight, User, X, Plus,
  Calendar, Clock, MapPin, Trash2, CheckCircle2, UserPlus,
  ArrowLeft, Loader2, AlertCircle, CalendarDays, UserCheck,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
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
  "Inclusive Education/Special Needs Committee",
];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Teacher {
  id: string;
  name: string;
  committees: string | null;
  responsibility: string | null;
  assignedRole: string | null;
  specialization: string | null;
  institute?: string | null;
}

interface Meeting {
  id: number;
  committee: string;
  title: string;
  date: string;
  month: string;
  time: string;
  venue: string;
  attendeeIds: string[];
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function cn(...cls: (string | false | undefined | null)[]) {
  return cls.filter(Boolean).join(" ");
}

function avatarColor(name: string) {
  const colors = [
    "bg-violet-100 text-violet-700",
    "bg-pink-100 text-pink-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-sky-100 text-sky-700",
    "bg-rose-100 text-rose-700",
    "bg-indigo-100 text-indigo-700",
  ];
  const i = name.charCodeAt(0) % colors.length;
  return colors[i];
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────────
// Avatar component
// ─────────────────────────────────────────────────────────────────────────────
function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "h-7 w-7 text-[10px]" : size === "lg" ? "h-11 w-11 text-base" : "h-9 w-9 text-xs";
  return (
    <div className={cn("rounded-xl flex items-center justify-center font-black flex-shrink-0", sz, avatarColor(name))}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────────────────────
export function CommitteeManagementClient({ initialTeachers }: { initialTeachers: Teacher[] }) {
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCommittee, setActiveCommittee] = useState<string | null>(null);

  // Reload teachers from API after mutations
  const reloadTeachers = useCallback(async () => {
    const res = await fetch("/api/committees");
    if (res.ok) {
      const data = await res.json();
      setTeachers(data);
    }
  }, []);

  // Grouped view
  const groupedCommittees = COMMITTEES.map((name) => ({
    name,
    members: teachers.filter((t) => t.committees?.split(",").map((c) => c.trim()).includes(name)),
  }));

  const filtered = groupedCommittees.filter(
    (g) =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.members.some((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalAssignments = teachers.reduce(
    (acc, t) => acc + (t.committees ? t.committees.split(",").filter(Boolean).length : 0),
    0
  );
  const leaders = teachers.filter(
    (t) =>
      t.responsibility?.toLowerCase().includes("head") ||
      t.responsibility?.toLowerCase().includes("leader") ||
      t.responsibility?.toLowerCase().includes("chair")
  ).length;

  // If a committee is selected → show its detail panel
  if (activeCommittee) {
    const group = groupedCommittees.find((g) => g.name === activeCommittee)!;
    return (
      <CommitteeDetailPanel
        committeeName={activeCommittee}
        allTeachers={teachers}
        members={group.members}
        onBack={() => setActiveCommittee(null)}
        onReload={reloadTeachers}
      />
    );
  }

  // ── Dashboard list ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <Users2 size={22} />
            </div>
            Committee Management
          </h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">
            View, manage members & schedule meetings for each committee.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Committees", value: COMMITTEES.length, icon: Users2, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Total Assignments", value: totalAssignments, icon: User, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Identified Leaders", value: leaders, icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", s.bg, s.color)}>
              <s.icon size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search committees or members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      {/* Committee Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filtered.map((group) => (
          <div
            key={group.name}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:border-indigo-100 transition-all"
          >
            {/* Card header */}
            <div className="p-5 border-b border-slate-50 bg-gradient-to-r from-slate-50/50 to-indigo-50/20 flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-snug flex-1">
                {group.name}
              </h3>
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase flex-shrink-0",
                  group.members.length > 0
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-slate-100 text-slate-400"
                )}
              >
                {group.members.length} Members
              </span>
            </div>

            {/* Members preview */}
            <div className="flex-1 px-5 py-3 space-y-2 overflow-y-auto max-h-[220px]">
              {group.members.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs text-slate-300 font-bold uppercase tracking-widest italic">
                    No Members Assigned
                  </p>
                </div>
              ) : (
                group.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 py-1.5">
                    <Avatar name={m.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{m.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight truncate">
                        {m.assignedRole || m.specialization || "Staff"}
                      </p>
                    </div>
                    {m.responsibility && (
                      <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 uppercase tracking-tight flex-shrink-0">
                        {m.responsibility}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Manage button */}
            <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/30">
              <button
                onClick={() => setActiveCommittee(group.name)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm shadow-indigo-500/20 active:scale-95"
              >
                <Users2 size={13} />
                Manage Committee
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Committee Detail Panel (full management UI)
// ─────────────────────────────────────────────────────────────────────────────
function CommitteeDetailPanel({
  committeeName,
  allTeachers,
  members: initialMembers,
  onBack,
  onReload,
}: {
  committeeName: string;
  allTeachers: Teacher[];
  members: Teacher[];
  onBack: () => void;
  onReload: () => Promise<void>;
}) {
  const [tab, setTab] = useState<"members" | "meetings">("members");
  const [members, setMembers] = useState<Teacher[]>(initialMembers);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);

  // Member assignment
  const [memberSearch, setMemberSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  // Meeting form
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [mTitle, setMTitle] = useState("");
  const [mDate, setMDate] = useState("");
  const [mTime, setMTime] = useState("");
  const [mVenue, setMVenue] = useState("");
  const [mAttendees, setMAttendees] = useState<string[]>([]);
  const [mSaving, setMSaving] = useState(false);

  // Meeting detail modal
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  // Load meetings on mount
  useEffect(() => {
    loadMeetings();
  }, []);

  async function loadMeetings() {
    setLoadingMeetings(true);
    const res = await fetch(`/api/committees/meetings?committee=${encodeURIComponent(committeeName)}`);
    if (res.ok) setMeetings(await res.json());
    setLoadingMeetings(false);
  }

  // ── Member actions ──────────────────────────────────────────────────────────
  const isMember = (t: Teacher) =>
    t.committees?.split(",").map((c) => c.trim()).includes(committeeName) ?? false;

  async function toggleMember(teacher: Teacher) {
    const action = isMember(teacher) ? "remove" : "add";
    setSaving(teacher.id);
    const res = await fetch("/api/committees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: teacher.id, committeeName, action }),
    });
    if (res.ok) {
      await onReload();
      // Update local members list
      if (action === "add") {
        setMembers((prev) => [...prev, { ...teacher, committees: (teacher.committees ? teacher.committees + "," : "") + committeeName }]);
      } else {
        setMembers((prev) => prev.filter((m) => m.id !== teacher.id));
      }
    }
    setSaving(null);
  }

  // ── Meeting actions ─────────────────────────────────────────────────────────
  async function createMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (!mTitle || !mDate) return;
    setMSaving(true);
    const month = MONTHS[parseInt(mDate.slice(5, 7), 10) - 1];
    const res = await fetch("/api/committees/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        committee: committeeName,
        title: mTitle,
        date: mDate,
        month,
        time: mTime,
        venue: mVenue,
        attendeeIds: mAttendees,
      }),
    });
    if (res.ok) {
      await loadMeetings();
      setMTitle(""); setMDate(""); setMTime(""); setMVenue(""); setMAttendees([]);
      setShowMeetingForm(false);
    }
    setMSaving(false);
  }

  async function deleteMeeting(id: number) {
    if (!confirm("Delete this meeting?")) return;
    await fetch(`/api/committees/meetings?id=${id}&committee=${encodeURIComponent(committeeName)}`, {
      method: "DELETE",
    });
    await loadMeetings();
    setSelectedMeeting(null);
  }

  async function updateAttendees(meeting: Meeting, ids: string[]) {
    await fetch("/api/committees/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: meeting.id, committee: committeeName, attendeeIds: ids }),
    });
    await loadMeetings();
    setSelectedMeeting((prev) => prev ? { ...prev, attendeeIds: ids } : null);
  }

  // Filtered teachers for the assignment panel
  const filteredAll = allTeachers.filter((t) =>
    t.name.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const committeeMembers = allTeachers.filter((t) =>
    t.committees?.split(",").map((c) => c.trim()).includes(committeeName)
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="h-9 w-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-black text-slate-900 uppercase tracking-tight leading-tight truncate">
            {committeeName}
          </h1>
          <p className="text-[11px] text-slate-400 font-semibold">{committeeMembers.length} members assigned</p>
        </div>
        <span className="hidden md:flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
          <Users2 size={11} /> Committee
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
        {(["members", "meetings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all",
              tab === t
                ? t === "members"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-violet-600 text-white shadow-md"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {t === "members" ? <UserCheck size={13} /> : <CalendarDays size={13} />}
            {t === "members" ? "Members" : "Meetings"}
          </button>
        ))}
      </div>

      {/* ── MEMBERS TAB ───────────────────────────────────────────────────────── */}
      {tab === "members" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Current members */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-indigo-50/30">
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <UserCheck size={14} className="text-indigo-500" /> Current Members
              </h2>
              <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
                {committeeMembers.length}
              </span>
            </div>
            <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
              {committeeMembers.length === 0 ? (
                <div className="py-14 text-center">
                  <Users2 className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-xs text-slate-400 font-bold">No members yet</p>
                  <p className="text-[10px] text-slate-300 mt-1">Search teachers on the right to add</p>
                </div>
              ) : (
                committeeMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 group transition-colors">
                    <Avatar name={m.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{m.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight truncate">
                        {m.assignedRole || m.specialization || "Staff"}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleMember(m)}
                      disabled={saving === m.id}
                      className="h-7 w-7 flex items-center justify-center rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Remove from committee"
                    >
                      {saving === m.id ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add members */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-50 bg-emerald-50/30">
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2 mb-3">
                <UserPlus size={14} className="text-emerald-500" /> Assign Teachers
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
                <input
                  type="text"
                  placeholder="Search teacher..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>
            <div className="divide-y divide-slate-50 max-h-[380px] overflow-y-auto">
              {filteredAll.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-xs text-slate-400 font-bold">No teachers found</p>
                </div>
              ) : (
                filteredAll.map((t) => {
                  const member = t.committees?.split(",").map((c) => c.trim()).includes(committeeName);
                  return (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors">
                      <Avatar name={t.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{t.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight truncate">
                          {t.assignedRole || t.specialization || "Staff"}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleMember(t)}
                        disabled={saving === t.id}
                        className={cn(
                          "h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 disabled:opacity-60 active:scale-95",
                          member
                            ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                            : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        )}
                      >
                        {saving === t.id ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : member ? (
                          <><X size={11} /> Remove</>
                        ) : (
                          <><Plus size={11} /> Add</>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MEETINGS TAB ──────────────────────────────────────────────────────── */}
      {tab === "meetings" && (
        <div className="space-y-4">
          {/* Add meeting CTA */}
          {!showMeetingForm && (
            <button
              onClick={() => setShowMeetingForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-md shadow-violet-500/20 active:scale-95"
            >
              <Plus size={14} /> Schedule New Meeting
            </button>
          )}

          {/* Meeting form */}
          {showMeetingForm && (
            <div className="bg-white rounded-3xl border border-violet-100 shadow-md overflow-hidden animate-in slide-in-from-top-3 duration-200">
              <div className="p-5 border-b border-slate-50 bg-violet-50/40 flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <CalendarDays size={15} className="text-violet-500" /> Schedule Meeting
                </h2>
                <button onClick={() => setShowMeetingForm(false)} className="text-slate-400 hover:text-slate-700">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={createMeeting} className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meeting Title *</label>
                    <input
                      required
                      value={mTitle}
                      onChange={(e) => setMTitle(e.target.value)}
                      placeholder="e.g. Monthly Review Meeting"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Calendar size={10} /> Date *
                    </label>
                    <input
                      required
                      type="date"
                      value={mDate}
                      onChange={(e) => setMDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock size={10} /> Time
                    </label>
                    <input
                      type="time"
                      value={mTime}
                      onChange={(e) => setMTime(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 transition-all"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <MapPin size={10} /> Venue / Location
                    </label>
                    <input
                      value={mVenue}
                      onChange={(e) => setMVenue(e.target.value)}
                      placeholder="e.g. Principal's Office, Conference Hall"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 transition-all"
                    />
                  </div>
                  {/* Attendees */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Select Attendees ({mAttendees.length} selected)
                    </label>
                    <div className="bg-slate-50 rounded-xl border border-slate-100 max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {committeeMembers.length === 0 ? (
                        <div className="py-6 text-center">
                          <p className="text-xs text-slate-400 italic">Add members first via the Members tab</p>
                        </div>
                      ) : (
                        committeeMembers.map((m) => {
                          const checked = mAttendees.includes(m.id);
                          return (
                            <label key={m.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white transition-colors">
                              <div
                                className={cn(
                                  "h-4 w-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                                  checked ? "bg-violet-600 border-violet-600" : "border-slate-300"
                                )}
                                onClick={() =>
                                  setMAttendees((prev) =>
                                    checked ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                                  )
                                }
                              >
                                {checked && <CheckCircle2 size={10} className="text-white" />}
                              </div>
                              <Avatar name={m.name} size="sm" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900">{m.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{m.assignedRole || m.specialization || "Staff"}</p>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                    {committeeMembers.length > 0 && (
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setMAttendees(committeeMembers.map((m) => m.id))}
                          className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">
                          Select All
                        </button>
                        <span className="text-slate-200">|</span>
                        <button type="button" onClick={() => setMAttendees([])}
                          className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-wider">
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowMeetingForm(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black uppercase tracking-wider rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={mSaving}
                    className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-violet-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {mSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    {mSaving ? "Saving..." : "Schedule Meeting"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Meetings list */}
          {loadingMeetings ? (
            <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="animate-spin" size={24} />
              <p className="text-xs font-bold uppercase tracking-widest">Loading Meetings...</p>
            </div>
          ) : meetings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-16 flex flex-col items-center gap-4 text-slate-400">
              <CalendarDays size={36} className="text-slate-200" />
              <div className="text-center">
                <p className="text-sm font-black">No Meetings Scheduled</p>
                <p className="text-[11px] mt-1">Click "Schedule New Meeting" above to add one.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  allTeachers={allTeachers}
                  committeeMembers={committeeMembers}
                  onDelete={deleteMeeting}
                  onUpdateAttendees={updateAttendees}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Meeting Card
// ─────────────────────────────────────────────────────────────────────────────
function MeetingCard({
  meeting,
  allTeachers,
  committeeMembers,
  onDelete,
  onUpdateAttendees,
}: {
  meeting: Meeting;
  allTeachers: Teacher[];
  committeeMembers: Teacher[];
  onDelete: (id: number) => void;
  onUpdateAttendees: (meeting: Meeting, ids: string[]) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editAttendees, setEditAttendees] = useState(false);
  const [localAttendees, setLocalAttendees] = useState<string[]>(meeting.attendeeIds);
  const [saving, setSaving] = useState(false);

  const attendeeTeachers = allTeachers.filter((t) => meeting.attendeeIds.includes(t.id));

  async function saveAttendees() {
    setSaving(true);
    await onUpdateAttendees(meeting, localAttendees);
    setSaving(false);
    setEditAttendees(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
      {/* Row */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Date badge */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center bg-violet-50 border border-violet-100 rounded-xl h-12 w-12 text-violet-700">
          <span className="text-[10px] font-black uppercase leading-none">
            {meeting.date ? MONTHS[parseInt(meeting.date.slice(5, 7), 10) - 1]?.slice(0, 3) : "--"}
          </span>
          <span className="text-lg font-black leading-tight">
            {meeting.date ? meeting.date.slice(8, 10) : "--"}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-900 truncate">{meeting.title}</p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {meeting.time && (
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <Clock size={10} /> {meeting.time}
              </span>
            )}
            {meeting.venue && (
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <MapPin size={10} /> {meeting.venue}
              </span>
            )}
            <span className="text-[10px] font-semibold text-violet-500 flex items-center gap-1">
              <User size={10} /> {meeting.attendeeIds.length} attendees
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setExpanded((x) => !x)}
            className="h-8 px-3 text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg uppercase tracking-wider transition-all"
          >
            {expanded ? "Hide" : "Details"}
          </button>
          <button
            onClick={() => onDelete(meeting.id)}
            className="h-8 w-8 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5 pt-1 border-t border-slate-50 space-y-4 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Attendees ({meeting.attendeeIds.length})
            </p>
            <button
              onClick={() => { setEditAttendees((x) => !x); setLocalAttendees(meeting.attendeeIds); }}
              className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wider flex items-center gap-1"
            >
              <UserPlus size={11} /> {editAttendees ? "Cancel" : "Edit Attendees"}
            </button>
          </div>

          {/* Attendee chips */}
          {!editAttendees && (
            <div className="flex flex-wrap gap-2">
              {attendeeTeachers.length === 0 ? (
                <p className="text-xs text-slate-300 italic">No attendees assigned</p>
              ) : (
                attendeeTeachers.map((t) => (
                  <span key={t.id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
                    <Avatar name={t.name} size="sm" /> {t.name}
                  </span>
                ))
              )}
            </div>
          )}

          {/* Edit attendees */}
          {editAttendees && (
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-xl border border-slate-100 max-h-52 overflow-y-auto divide-y divide-slate-100">
                {committeeMembers.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-xs text-slate-400 italic">No committee members to select</p>
                  </div>
                ) : committeeMembers.map((m) => {
                  const checked = localAttendees.includes(m.id);
                  return (
                    <label key={m.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white transition-colors">
                      <div
                        className={cn(
                          "h-4 w-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 cursor-pointer",
                          checked ? "bg-violet-600 border-violet-600" : "border-slate-300"
                        )}
                        onClick={() =>
                          setLocalAttendees((prev) =>
                            checked ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                          )
                        }
                      >
                        {checked && <CheckCircle2 size={10} className="text-white" />}
                      </div>
                      <Avatar name={m.name} size="sm" />
                      <span className="text-xs font-bold text-slate-900">{m.name}</span>
                    </label>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditAttendees(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAttendees}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 disabled:opacity-60"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                  {saving ? "Saving..." : "Save Attendees"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
