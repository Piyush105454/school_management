"use client";

import React, { useState } from "react";
import { Plus, Users, Phone, Award, CheckCircle, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createTeacher } from "@/features/teachers/actions/teacherActions";
import { useRouter } from "next/navigation";

interface Teacher {
  id: string;
  name: string;
  contactNumber: string | null;
  classAssigned: string | null;
}

export function TeacherManagementClient({ initialTeachers }: { initialTeachers: Teacher[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contactNumber: "",
    classAssigned: "",
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("Name is required");

    setLoading(true);
    const res = await createTeacher(formData);
    setLoading(false);

    if (res.success) {
      alert("Teacher Added successfully!");
      setIsOpen(false);
      setFormData({ name: "", contactNumber: "", classAssigned: "" });
      router.refresh(); 
    } else {
      alert("Error: " + res.error);
    }
  };

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

      {initialTeachers.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-4 shadow-sm">
           <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-black">👩‍🏫</span>
           </div>
           <p className="text-sm font-black text-slate-800 uppercase tracking-wide">No Teachers Added</p>
           <p className="text-xs text-slate-400 font-medium max-w-sm">Add teachers to start managing staff records.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Number</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Class Assigned</th>
              </tr>
            </thead>
            <tbody>
              {initialTeachers.map((teacher) => (
                <tr key={teacher.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-sm">
                        {teacher.name[0].toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-900 text-sm">{teacher.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600 font-medium">{teacher.contactNumber || "-"}</td>
                  <td className="px-6 py-5">
                    {teacher.classAssigned ? (
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-100">
                        Class {teacher.classAssigned}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add New Teacher">
         <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Teacher Name</label>
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
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Class Assigned</label>
                <select 
                    value={formData.classAssigned}
                    onChange={(e) => setFormData({ ...formData, classAssigned: e.target.value })}
                    className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                >
                    <option value="">Select Class</option>
                    {["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all disabled:opacity-50 mt-4"
            >
                {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Save Teacher"}
            </button>
         </form>
      </Modal>
    </div>
  );
}
