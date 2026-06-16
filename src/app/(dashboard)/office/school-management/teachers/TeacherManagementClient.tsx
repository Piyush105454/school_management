"use client";

import React, { useState, useEffect } from "react";

import { Plus, Users, Phone, Award, CheckCircle, Loader2, Trash2, Edit, Filter, Search, ShieldAlert, AlertCircle, AlertTriangle, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createTeacher, updateTeacher, deleteTeacher } from "@/features/teachers/actions/teacherActions";
import { useRouter } from "next/navigation";

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
  userId: string;
  name: string;
  email: string;
  contactNumber: string | null;
  classAssigned: string | null;
  institute: string | null;
  responsibility: string | null;
  incharge: string | null;
  specialization: string | null;
  assignedRole: string | null;
  committees: string | null;
}

interface ClassData {
  id: number;
  name: string;
  grade: number;
  institute: string | null;
}

export function TeacherManagementClient({ 
  initialTeachers, 
  allClasses,
  allSubjects = []
}: { 
  initialTeachers: Teacher[], 
  allClasses: ClassData[],
  allSubjects?: string[]
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [committeeFilter, setCommitteeFilter] = useState("ALL");

  // Tagged logs states
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [viewingTeacherLogs, setViewingTeacherLogs] = useState<Teacher | null>(null);
  const [teacherIncidents, setTeacherIncidents] = useState<any[]>([]);
  const [loadingTeacherIncidents, setLoadingTeacherIncidents] = useState(false);

  useEffect(() => {
    if (viewingTeacherLogs) {
      setLoadingTeacherIncidents(true);
      import("@/features/academy/actions/incidentActions")
        .then(async ({ getTeacherIncidentsAction }) => {
          const res = await getTeacherIncidentsAction(viewingTeacherLogs.id);
          if (res.success) {
            setTeacherIncidents(res.data || []);
          } else {
            setTeacherIncidents([]);
          }
        })
        .catch(() => setTeacherIncidents([]))
        .finally(() => setLoadingTeacherIncidents(false));
    } else {
      setTeacherIncidents([]);
    }
  }, [viewingTeacherLogs]);
  const [formData, setFormData] = useState({
    name: "",
    contactNumber: "",
    classAssigned: [] as string[],
    committees: [] as string[],
    specialization: [] as string[],
    institute: "",
    responsibility: "",
    incharge: "",
    assignedRole: "",
    email: "",
    password: "",
  });
  const router = useRouter();

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      name: teacher.name,
      contactNumber: teacher.contactNumber || "",
      classAssigned: teacher.classAssigned ? teacher.classAssigned.split(",").map(c => c.trim()).filter(Boolean) : [],
      committees: teacher.committees ? teacher.committees.split(",").map(c => c.trim()).filter(Boolean) : [],
      specialization: teacher.specialization ? teacher.specialization.split(",").map(c => c.trim()).filter(Boolean) : [],
      institute: teacher.institute || "",
      responsibility: teacher.responsibility || "",
      incharge: teacher.incharge || "",
      assignedRole: teacher.assignedRole || "",
      email: teacher.email,
      password: "",
    });
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedTeacher(null);
    setFormData({
      name: "",
      contactNumber: "",
      classAssigned: [],
      committees: [],
      specialization: [],
      institute: "",
      responsibility: "",
      incharge: "",
      assignedRole: "",
      email: "",
      password: ""
    });
  };

  const toggleClass = (cls: string) => {
    setFormData(prev => ({
      ...prev,
      classAssigned: prev.classAssigned.includes(cls) 
        ? prev.classAssigned.filter(c => c !== cls)
        : [...prev.classAssigned, cls]
    }));
  };

  const toggleCommittee = (committee: string) => {
    setFormData(prev => ({
      ...prev,
      committees: prev.committees.includes(committee)
        ? prev.committees.filter(c => c !== committee)
        : [...prev.committees, committee]
    }));
  };

  const toggleSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      specialization: prev.specialization.includes(subject)
        ? prev.specialization.filter(s => s !== subject)
        : [...prev.specialization, subject]
    }));
  };

  // Normalize a class token before saving: "4" → "Class 4", "Class 4" stays
  const normalizeClassName = (name: string): string => {
    const SPECIAL_CLASSES = ["KG1", "KG2", "LKG", "UKG"];
    const t = name.trim();
    if (SPECIAL_CLASSES.map(s => s.toLowerCase()).includes(t.toLowerCase())) return t.toUpperCase();
    if (/^\d+$/.test(t)) return `Class ${t}`;
    if (/^class\s+\d+$/i.test(t)) return `Class ${t.replace(/^class\s+/i, "").trim()}`;
    return t;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("Name is required");
    if (!formData.email) return alert("Email is required");

    setLoading(true);
    // Normalize + deduplicate classAssigned before saving
    const normalizedClasses = (() => {
      const seen = new Set<string>();
      return formData.classAssigned
        .map(normalizeClassName)
        .filter(c => { const k = c.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
    })();
    const submissionData = {
      ...formData,
      classAssigned: normalizedClasses.join(", "),
      committees: formData.committees.join(", "),
      specialization: formData.specialization.join(", "),
    };

    let res;
    if (selectedTeacher) {
      res = await updateTeacher(selectedTeacher.id, {
        userId: selectedTeacher.userId,
        ...submissionData
      });
    } else {
      res = await createTeacher(submissionData);
    }
    setLoading(false);

    if (res.success) {
      alert(selectedTeacher ? "Teacher Updated successfully!" : "Teacher Added successfully!");
      closeModal();
      router.refresh();
    } else {
      alert("Error: " + res.error);
    }
  };

  // ── Delete State ──────────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [committeeDropdownOpen, setCommitteeDropdownOpen] = useState(false);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);

  const openDeleteModal = (teacher: Teacher) => {
    setDeleteTarget(teacher);
    setDeleteError(null);
    setDeleteConfirmText("");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);

    const res = await deleteTeacher(deleteTarget.id, deleteTarget.userId ?? null);
    setDeleteLoading(false);

    if (res.success) {
      setDeleteTarget(null);
      router.refresh();
    } else {
      setDeleteError(res.error ?? "Something went wrong.");
    }
  };

  const filteredTeachers = initialTeachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCommittee = committeeFilter === "ALL" || (t.committees && t.committees.includes(committeeFilter));
    return matchesSearch && matchesCommittee;
  });

  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">Teacher Management</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Manage and view teacher staffing details.</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
        >
          <Plus size={16} /> Add Teacher
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="text-slate-400 h-4 w-4 shrink-0" />
          <select 
            value={committeeFilter}
            onChange={(e) => setCommitteeFilter(e.target.value)}
            className="w-full md:w-64 bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Committees</option>
            {COMMITTEES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {filteredTeachers.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-4 shadow-sm">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-black">👩‍🏫</span>
          </div>
          <p className="text-sm font-black text-slate-800 uppercase tracking-wide">No Teachers Found</p>
          <p className="text-xs text-slate-400 font-medium max-w-sm">Try adjusting your filters or add a new teacher.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Teacher Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Professional Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Classes</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Committees</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-sm">
                        {teacher.name[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block leading-none mb-1">{teacher.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{teacher.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 text-right shrink-0">Role:</span>
                        <span className="text-xs font-bold text-slate-700">{teacher.assignedRole || "-"}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 text-right shrink-0 mt-0.5">Sub:</span>
                        <div className="flex flex-wrap gap-1">
                          {teacher.specialization
                            ? teacher.specialization.split(",").map(s => s.trim()).filter(Boolean).map(s => (
                                <span key={s} className="bg-violet-50 text-violet-700 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border border-violet-100">
                                  {s}
                                </span>
                              ))
                            : <span className="text-xs font-bold text-slate-400">-</span>
                          }
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1.5 min-h-[40px] items-center">
                      {teacher.classAssigned ? (() => {
                        const SPECIAL_CLASSES = ["KG1", "KG2", "LKG", "UKG"];
                        // Normalize display: bare numbers → "Class N", deduplicate
                        const raw = teacher.classAssigned.split(",").map(c => c.trim()).filter(Boolean);
                        const seen = new Set<string>();
                        const unique: string[] = [];
                        for (const c of raw) {
                          // Normalize
                          let display = c;
                          if (/^\d+$/.test(c)) display = `Class ${c}`;
                          else if (/^class\s+\d+$/i.test(c)) display = `Class ${c.replace(/^class\s+/i, "").trim()}`;
                          // Deduplicate by normalized key
                          const key = display.toLowerCase();
                          if (!seen.has(key)) { seen.add(key); unique.push(display); }
                        }
                        if (unique.length === 0) return <span className="text-slate-400 text-xs">-</span>;
                        return unique.map(c => (
                          <span key={c} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                            {c}
                          </span>
                        ));
                      })() : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1.5 min-h-[40px] items-center max-w-[300px]">
                      {teacher.committees ? (
                        teacher.committees.split(",").map(c => (
                          <span key={c} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tight border border-indigo-100">
                            {c.trim()}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setViewingTeacherLogs(teacher);
                          setIsLogsOpen(true);
                        }}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="View Incident/Complain Logs"
                      >
                        <ShieldAlert size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(teacher)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title="Edit Teacher"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(teacher)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Delete Teacher"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isOpen} onClose={closeModal} title={selectedTeacher ? "Edit Teacher Profile" : "Add New Teacher"}>


        <form onSubmit={handleSubmit} className="p-1 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1 w-4 bg-blue-600 rounded-full"></span> Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <input
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Number</label>
                <input
                  placeholder="Phone Number"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email (Login ID)</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <input
                  type="password"
                  placeholder={selectedTeacher ? "New password (optional)" : "Default: Teacher@123"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {/* Professional Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1 w-4 bg-emerald-600 rounded-full"></span> Professional Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Institute / Branch</label>
                <select
                  value={formData.institute}
                  onChange={(e) => setFormData({ ...formData, institute: e.target.value === "UNASSIGNED" ? "" : e.target.value, classAssigned: [] })}
                  className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium outline-none"
                >
                  <option value="">Not Assigned (Clear)</option>
                  <option value="Dhanpuri Public School">Dhanpuri Public School</option>
                  <option value="WES Academy">WES Academy</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Role / Designation</label>
                <input
                  placeholder="e.g. Senior Teacher"
                  value={formData.assignedRole}
                  onChange={(e) => setFormData({ ...formData, assignedRole: e.target.value })}
                  className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-1 col-span-full">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Overall Responsibility</label>
                <input
                  placeholder="e.g. Exam Incharge"
                  value={formData.responsibility}
                  onChange={(e) => setFormData({ ...formData, responsibility: e.target.value })}
                  className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-1 col-span-full">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Incharge Of (Misc)</label>
                <input
                  placeholder="e.g. Cultural Events, Sports"
                  value={formData.incharge}
                  onChange={(e) => setFormData({ ...formData, incharge: e.target.value })}
                  className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {/* Subject Assignments (Custom multi-select dropdown) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-violet-600 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1 w-4 bg-violet-600 rounded-full"></span> Subject Assignments
            </h3>
            <div className="space-y-2 relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Select Subjects This Teacher Specializes In
              </label>
              
              <div 
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer flex justify-between items-center hover:border-violet-300 transition-colors"
                onClick={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
              >
                <span className={formData.specialization.length > 0 ? "text-slate-900" : "text-slate-400"}>
                  {formData.specialization.length > 0 
                    ? `${formData.specialization.length} subject(s) selected` 
                    : "Select Subject"}
                </span>
                <span className="text-slate-400 text-xs">▼</span>
              </div>

              {subjectDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setSubjectDropdownOpen(false)} 
                  />
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                    {[...allSubjects, "General", "All Subjects"].map(subject => (
                      <div
                        key={subject}
                        onClick={() => toggleSubject(subject)}
                        className={`px-4 py-2.5 cursor-pointer text-sm font-medium transition-colors hover:bg-violet-50 flex items-center gap-2 ${
                          formData.specialization.includes(subject) ? 'bg-violet-50/50 text-violet-700' : 'text-slate-600'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          formData.specialization.includes(subject) ? 'bg-violet-500 border-violet-500' : 'border-slate-300'
                        }`}>
                          {formData.specialization.includes(subject) && <CheckCircle size={12} className="text-white" />}
                        </div>
                        {subject}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {formData.specialization.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest self-center">Selected:</span>
                  {formData.specialization.map(s => (
                    <span
                      key={s}
                      onClick={() => toggleSubject(s)}
                      className="bg-violet-100 text-violet-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-red-100 hover:text-red-600 transition-colors"
                      title="Click to remove"
                    >
                      {s} ×
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Committee Assignments (Custom multi-select dropdown) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1 w-4 bg-amber-600 rounded-full"></span> Committee Assignments
            </h3>
            <div className="space-y-2 relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Select Relevant Committees
              </label>

              <div 
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer flex justify-between items-center hover:border-amber-300 transition-colors"
                onClick={() => setCommitteeDropdownOpen(!committeeDropdownOpen)}
              >
                <span className={formData.committees.length > 0 ? "text-slate-900" : "text-slate-400"}>
                  {formData.committees.length > 0 
                    ? `${formData.committees.length} committee(s) selected` 
                    : "Select Committee"}
                </span>
                <span className="text-slate-400 text-xs">▼</span>
              </div>

              {committeeDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setCommitteeDropdownOpen(false)} 
                  />
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                    {COMMITTEES.map(committee => (
                      <div
                        key={committee}
                        onClick={() => toggleCommittee(committee)}
                        className={`px-4 py-2.5 cursor-pointer text-sm font-medium transition-colors hover:bg-amber-50 flex items-center gap-2 ${
                          formData.committees.includes(committee) ? 'bg-amber-50/50 text-amber-700' : 'text-slate-600'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          formData.committees.includes(committee) ? 'bg-amber-500 border-amber-500' : 'border-slate-300'
                        }`}>
                          {formData.committees.includes(committee) && <CheckCircle size={12} className="text-white" />}
                        </div>
                        {committee}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {formData.committees.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest self-center">Selected:</span>
                  {formData.committees.map(c => (
                    <span
                      key={c}
                      onClick={() => toggleCommittee(c)}
                      className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-red-100 hover:text-red-600 transition-colors"
                      title="Click to remove"
                    >
                      {c} ×
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Class Assignments (Custom multi-select dropdown) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1 w-4 bg-indigo-600 rounded-full"></span> Class Assignments
            </h3>
            <div className="space-y-2 relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Select Classes Assigned to this Teacher
              </label>

              <div 
                className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium transition-colors flex justify-between items-center ${
                  !formData.institute ? "bg-slate-50 cursor-not-allowed opacity-70" : "cursor-pointer hover:border-indigo-300 text-slate-700"
                }`}
                onClick={() => formData.institute && setClassDropdownOpen(!classDropdownOpen)}
              >
                <span className={formData.classAssigned.length > 0 ? "text-slate-900" : "text-slate-400"}>
                  {!formData.institute 
                    ? "Select an institute first..." 
                    : formData.classAssigned.length > 0 
                      ? `${formData.classAssigned.length} class(es) selected` 
                      : "Select Class"}
                </span>
                <span className="text-slate-400 text-xs">▼</span>
              </div>

              {classDropdownOpen && formData.institute && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setClassDropdownOpen(false)} 
                  />
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                    {allClasses
                      .filter(c => c.institute === formData.institute)
                      .sort((a, b) => a.grade - b.grade)
                      .map(cls => (
                        <div
                          key={cls.id}
                          onClick={() => toggleClass(cls.name)}
                          className={`px-4 py-2.5 cursor-pointer text-sm font-medium transition-colors hover:bg-indigo-50 flex items-center gap-2 ${
                            formData.classAssigned.includes(cls.name) ? 'bg-indigo-50/50 text-indigo-700' : 'text-slate-600'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            formData.classAssigned.includes(cls.name) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'
                          }`}>
                            {formData.classAssigned.includes(cls.name) && <CheckCircle size={12} className="text-white" />}
                          </div>
                          {cls.name}
                        </div>
                      ))}
                  </div>
                </>
              )}

              {formData.classAssigned.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest self-center">Selected:</span>
                  {formData.classAssigned.map(c => (
                    <span
                      key={c}
                      onClick={() => toggleClass(c)}
                      className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-red-100 hover:text-red-600 transition-colors"
                      title="Click to remove"
                    >
                      {c} ×
                    </span>
                  ))}
                </div>
              )}
              
              {!formData.institute && (
                <p className="mt-2 text-[10px] text-amber-500 font-bold uppercase tracking-wider italic">
                  * Please select an institute first to see available classes.
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2 shadow-xl"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : (selectedTeacher ? "Update Teacher Profile" : "Create Teacher Profile")}
          </button>
        </form>
      </Modal>

      {/* ── Delete Confirmation Modal ─────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => { setDeleteTarget(null); setDeleteError(null); setDeleteConfirmText(""); }}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 p-6 border-b border-slate-100 bg-gradient-to-r from-red-50 to-rose-50">
              <div className="h-10 w-10 bg-red-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-red-500/30">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 font-outfit">Delete Teacher</h3>
                <p className="text-xs text-slate-500 font-medium">This action cannot be undone</p>
              </div>
              <button
                onClick={() => { setDeleteTarget(null); setDeleteError(null); setDeleteConfirmText(""); }}
                className="ml-auto p-2 hover:bg-red-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Warning */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  Are you sure you want to permanently delete{" "}
                  <span className="font-black">{deleteTarget.name}</span>? Their login account will also be removed.
                </p>
              </div>

              {/* Block reason error */}
              {deleteError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl animate-in fade-in duration-150">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-semibold leading-relaxed">{deleteError}</p>
                </div>
              )}

              <div className="space-y-1.5 mt-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Type DELETE to confirm</label>
                <input
                  type="text"
                  placeholder="DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 transition-all font-medium text-center tracking-widest uppercase"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => { setDeleteTarget(null); setDeleteError(null); setDeleteConfirmText(""); }}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-black rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading || !!deleteError || deleteConfirmText.toUpperCase() !== "DELETE"}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-black rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                >
                  {deleteLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</>
                  ) : (
                    <><Trash2 className="h-4 w-4" /> Yes, Delete</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}      {/* Dynamic Tagged Incident / Complaint Logs Modal */}
      <Modal isOpen={isLogsOpen} onClose={() => { setIsLogsOpen(false); setViewingTeacherLogs(null); }} title={`Tagged Logs for ${viewingTeacherLogs?.name || "Teacher"}`}>
        <div className="space-y-4 max-h-[85vh] overflow-y-auto p-1">
          {loadingTeacherIncidents ? (
            <div className="py-12 text-center animate-pulse">
              <Loader2 className="animate-spin mx-auto text-slate-300" size={28} />
              <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading records...</p>
            </div>
          ) : teacherIncidents.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {teacherIncidents.map((inc) => (
                <div key={inc.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                      inc.type === "INCIDENT" ? "bg-rose-50 text-rose-700 border-rose-100" :
                      inc.type === "COMPLAIN" ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                    }`}>
                      {inc.type}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(inc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{inc.title}</h4>
                    <p className="text-xs text-slate-500 font-medium italic mt-1">"{inc.note}"</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-200 pt-2.5 mt-2">
                    <span>Category: <span className="text-slate-600 font-black">{inc.category}</span></span>
                    <span>Priority: <span className="text-slate-600 font-black">{inc.priority}</span></span>
                    {inc.student && (
                      <span>Student: <span className="text-blue-600 font-black">{inc.student.name} {inc.class ? `(${inc.class.name})` : ""}</span></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center">
              <AlertCircle size={28} className="mx-auto text-slate-300 mb-3" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No logged incidents, complaints, or feedback associated with this teacher.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

