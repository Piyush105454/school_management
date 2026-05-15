"use client";

import React, { useState } from "react";

import { Plus, Users, Phone, Award, CheckCircle, Loader2, Trash2, Edit, Filter, Search, ShieldAlert } from "lucide-react";
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
  allClasses 
}: { 
  initialTeachers: Teacher[], 
  allClasses: ClassData[] 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [committeeFilter, setCommitteeFilter] = useState("ALL");
  const [formData, setFormData] = useState({
    name: "",
    contactNumber: "",
    classAssigned: [] as string[],
    committees: [] as string[],
    institute: "",
    responsibility: "",
    incharge: "",
    specialization: "",
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
      classAssigned: teacher.classAssigned ? teacher.classAssigned.split(",").map(c => c.trim()) : [],
      committees: teacher.committees ? teacher.committees.split(",").map(c => c.trim()) : [],
      institute: teacher.institute || "",
      responsibility: teacher.responsibility || "",
      incharge: teacher.incharge || "",
      specialization: teacher.specialization || "",
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
      institute: "",
      responsibility: "",
      incharge: "",
      specialization: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("Name is required");
    if (!formData.email) return alert("Email is required");

    setLoading(true);
    const submissionData = {
      ...formData,
      classAssigned: formData.classAssigned.join(", "),
      committees: formData.committees.join(", ")
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

  const handleDelete = async (id: string, userId: string) => {
    if (!confirm("Are you sure you want to delete this teacher account?")) return;

    setLoading(true);
    const res = await deleteTeacher(id, userId);
    setLoading(false);

    if (res.success) {
      alert("Teacher Deleted successfully!");
      router.refresh();
    } else {
      alert("Error: " + res.error);
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
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 text-right">Role:</span>
                        <span className="text-xs font-bold text-slate-700">{teacher.assignedRole || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 text-right">Sub:</span>
                        <span className="text-xs font-bold text-slate-500">{teacher.specialization || "-"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1.5 min-h-[40px] items-center">
                      {teacher.classAssigned ? (
                        teacher.classAssigned.split(",").map(c => (
                          <span key={c} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                            {c.trim()}
                          </span>
                        ))
                      ) : (
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
                        onClick={() => handleEdit(teacher)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title="Edit Teacher"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(teacher.id, teacher.userId)}
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
                  onChange={(e) => setFormData({ ...formData, institute: e.target.value, classAssigned: [] })}
                  className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium outline-none"
                  required
                >
                  <option value="">Select Institute</option>
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
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Specialization (Subject)</label>
                <input
                  placeholder="e.g. Mathematics"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-1">
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

          {/* Committee Assignments */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1 w-4 bg-amber-600 rounded-full"></span> Committee Assignments
            </h3>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Select Relevant Committees</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COMMITTEES.map((committee) => (
                  <button
                    key={committee}
                    type="button"
                    onClick={() => toggleCommittee(committee)}
                    className={`px-3 py-3 rounded-xl border text-[10px] font-black uppercase tracking-tight text-left transition-all ${
                      formData.committees.includes(committee)
                        ? "bg-amber-600 border-amber-600 text-white shadow-md shadow-amber-600/20"
                        : "bg-white border-slate-200 text-slate-600 hover:border-amber-300"
                    }`}
                  >
                    {committee}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Class Assignments */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1 w-4 bg-indigo-600 rounded-full"></span> Class Assignments
            </h3>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Select Classes Assigned to this Teacher</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
                {allClasses
                  .filter(c => !formData.institute || c.institute === formData.institute)
                  .sort((a, b) => a.grade - b.grade)
                  .map((cls) => (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => toggleClass(cls.name)}
                      className={`px-2 py-3 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all ${
                        formData.classAssigned.includes(cls.name)
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20"
                          : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                      }`}
                    >
                      {cls.name}
                    </button>
                  ))}
              </div>
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
    </div>
  );
}

