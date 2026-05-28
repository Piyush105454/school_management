"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, ShieldAlert, FileText, HeartHandshake, AlertCircle, Loader2, Calendar, UserCheck, GraduationCap } from "lucide-react";
import { ActionDropdown } from "@/components/ui/ActionDropdown";
import { Modal } from "@/components/ui/Modal";
import { createIncidentAction, getStudentsByClassAction, deleteIncidentAction, updateIncidentStatusAction } from "@/features/academy/actions/incidentActions";
import { useRouter } from "next/navigation";

interface IncidentRecord {
  id: string;
  title: string;
  type: "INCIDENT" | "COMPLAIN" | "FEEDBACK";
  note: string;
  category: string;
  priority: string;
  status: string;
  classId?: number | null;
  studentId?: number | null;
  teacherId?: string | null;
  studentIds?: string | null;
  teacherIds?: string | null;
  createdAt: string;
  class?: { id: number; name: string } | null;
  student?: { id: number; name: string; studentId: string } | null;
  teacher?: { id: string; name: string } | null;
  taggedTeachers?: { id: string; name: string }[];
  taggedStudents?: { id: number; name: string; studentId: string }[];
}

interface ClassData {
  id: number;
  name: string;
}

interface TeacherData {
  id: string;
  name: string;
}

export default function IncidentManagementClient({
  initialIncidents,
  classesList,
  teachersList,
  userRole = "OFFICE",
}: {
  initialIncidents: IncidentRecord[];
  classesList: ClassData[];
  teachersList: TeacherData[];
  userRole?: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"INCIDENT" | "COMPLAIN" | "FEEDBACK">("INCIDENT");
  const [incidentsList, setIncidentsList] = useState<IncidentRecord[]>(initialIncidents);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);

  // Form fields state
  const [formTitle, setFormTitle] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formCategory, setFormCategory] = useState("General");
  const [formPriority, setFormPriority] = useState("Medium");
  const [formClassId, setFormClassId] = useState("");
  const [tempTeacherId, setTempTeacherId] = useState("");
  const [tempStudentId, setTempStudentId] = useState("");
  const [selectedTeachers, setSelectedTeachers] = useState<TeacherData[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<{ id: number; name: string; studentId: string }[]>([]);

  // Status Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedIncidentForStatus, setSelectedIncidentForStatus] = useState<IncidentRecord | null>(null);
  const [formStatus, setFormStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Student dropdown selection helpers
  const [studentsByClass, setStudentsByClass] = useState<{ id: number; name: string; studentId: string }[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Sync initialIncidents when prop updates
  useEffect(() => {
    setIncidentsList(initialIncidents);
  }, [initialIncidents]);



  // Dynamically load students when Class is selected
  useEffect(() => {
    if (formClassId) {
      setLoadingStudents(true);
      getStudentsByClassAction(parseInt(formClassId))
        .then((res) => {
          if (res.success && res.students) {
            setStudentsByClass(res.students);
          } else {
            setStudentsByClass([]);
          }
        })
        .catch(() => setStudentsByClass([]))
        .finally(() => setLoadingStudents(false));
    } else {
      setStudentsByClass([]);
    }
    setSelectedStudents([]);
    setTempStudentId("");
  }, [formClassId]);

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
      case "Principal Approved":
      case "Resolved":
      case "Acknowledged":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200/50 font-black";
      case "Teacher Approved":
        return "bg-indigo-100 text-indigo-700 border border-indigo-200/50 font-black";
      case "Pending":
      case "Open":
      case "In Progress":
      case "Reviewed":
        return "bg-blue-100 text-blue-700 border border-blue-200/50 font-black";
      case "Closed":
        return "bg-slate-200 text-slate-700 border border-slate-300/50 font-black";
      default: return "bg-slate-100 text-slate-700 border border-slate-200/50 font-black";
    }
  };

  // Close report form and clear inputs
  const closeModal = () => {
    setIsModalOpen(false);
    setFormTitle("");
    setFormNote("");
    setFormCategory("General");
    setFormPriority("Medium");
    setFormClassId("");
    setSelectedTeachers([]);
    setSelectedStudents([]);
    setTempTeacherId("");
    setTempStudentId("");
  };

  // Submit report handler
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formNote) {
      alert("Please fill out the Title and Details fields.");
      return;
    }

    setSubmittingForm(true);

    const primaryTeacherId = selectedTeachers.length > 0 ? selectedTeachers[0].id : null;
    const primaryStudentId = selectedStudents.length > 0 ? selectedStudents[0].id : null;
    const teacherIds = selectedTeachers.length > 0 ? JSON.stringify(selectedTeachers.map(t => t.id)) : null;
    const studentIds = selectedStudents.length > 0 ? JSON.stringify(selectedStudents.map(s => s.id)) : null;

    const res = await createIncidentAction({
      title: formTitle,
      type: activeTab,
      note: formNote,
      category: formCategory,
      priority: formPriority,
      status: "Open",
      classId: formClassId ? parseInt(formClassId) : null,
      studentId: primaryStudentId,
      teacherId: primaryTeacherId,
      studentIds,
      teacherIds,
    });
    setSubmittingForm(false);

    if (res.success && res.record) {
      // Find tagged entities from lists to display in UI immediately
      const selectedClass = classesList.find(c => c.id === (formClassId ? parseInt(formClassId) : null));

      // Construct a fully hydrated record for immediate, zero-latency rendering
      const newRecord: IncidentRecord = {
        ...res.record,
        createdAt: res.record.createdAt instanceof Date ? res.record.createdAt.toISOString() : String(res.record.createdAt),
        class: selectedClass || null,
        student: selectedStudents.length > 0 ? selectedStudents[0] : null,
        teacher: selectedTeachers.length > 0 ? selectedTeachers[0] : null,
        taggedTeachers: selectedTeachers,
        taggedStudents: selectedStudents,
      } as any;

      // Optimistically prepend the new record to the list
      setIncidentsList((prev) => [newRecord, ...prev]);

      alert(`${itemTypeLabel} reported successfully!`);
      closeModal();
      router.refresh();
    } else {
      alert("Error reporting record: " + res.error);
    }
  };

  const handleTeacherSelect = (teacherId: string) => {
    if (!teacherId) return;
    const teacher = teachersList.find((t) => t.id === teacherId);
    if (teacher && !selectedTeachers.some((t) => t.id === teacherId)) {
      setSelectedTeachers((prev) => [...prev, teacher]);
    }
    setTempTeacherId("");
  };

  const removeTeacher = (id: string) => {
    setSelectedTeachers((prev) => prev.filter((t) => t.id !== id));
  };

  const handleStudentSelect = (studentIdStr: string) => {
    if (!studentIdStr) return;
    const id = parseInt(studentIdStr);
    const student = studentsByClass.find((s) => s.id === id);
    if (student && !selectedStudents.some((s) => s.id === id)) {
      setSelectedStudents((prev) => [...prev, student]);
    }
    setTempStudentId("");
  };

  const removeStudent = (id: number) => {
    setSelectedStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDeleteRecord = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the ${itemTypeLabel.toLowerCase()} "${title}"?`)) {
      return;
    }

    // Optimistically remove from list immediately
    setIncidentsList((prev) => prev.filter((item) => item.id !== id));

    const res = await deleteIncidentAction(id);
    if (res.success) {
      alert(`${itemTypeLabel} deleted successfully!`);
      router.refresh();
    } else {
      alert(`Error deleting ${itemTypeLabel.toLowerCase()}: ` + res.error);
      router.refresh();
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncidentForStatus || !formStatus) return;

    setUpdatingStatus(true);
    const res = await updateIncidentStatusAction(selectedIncidentForStatus.id, formStatus);
    setUpdatingStatus(false);

    if (res.success && res.record) {
      // Update local state in-place for instant, latency-free updates
      setIncidentsList(prev => prev.map(item => 
        item.id === selectedIncidentForStatus.id ? { ...item, status: formStatus } : item
      ));
      alert("Status updated successfully!");
      setIsStatusModalOpen(false);
      setSelectedIncidentForStatus(null);
      setFormStatus("");
      router.refresh();
    } else {
      alert("Error updating status: " + res.error);
    }
  };

  const activeTabItems = incidentsList.filter((item) => item.type === activeTab);
  const itemTypeLabel = activeTab === "INCIDENT" ? "Incident" : activeTab === "COMPLAIN" ? "Complaint" : "Feedback";

  // Filtered rows matching Search term and Status selector
  const filteredItems = activeTabItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
            <span>{itemTypeLabel} <span className="text-blue-600">Management</span></span>
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {activeTab === "INCIDENT" && "Track and resolve campus security and infrastructure incidents"}
            {activeTab === "COMPLAIN" && "Monitor and resolve student, teacher, or parent complaints"}
            {activeTab === "FEEDBACK" && "Review extracurricular, facility, and curriculum community feedback"}
          </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 w-fit"
        >
          <Plus size={16} />
          Report {itemTypeLabel}
        </button>
      </div>

      {/* Modern Button-based Navigation Tabs (1, 2, 3) */}
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
          1. Incident Management
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
          2. Complain Management
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
          3. Feedback Management
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
          <button className="flex items-center gap-2 px-5 py-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-xs font-bold text-slate-600 transition-all border border-slate-100">
            <Filter size={14} />
            Filter
          </button>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 px-5 py-3 outline-none focus:ring-2 focus:ring-slate-900/10 transition-all cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="Open">Open</option>
            <option value="Pending">Pending</option>
            <option value="Teacher Approved">Teacher Approved</option>
            <option value="Principal Approved">Principal Approved</option>
            <option value="Closed">Closed</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            {activeTab === "FEEDBACK" && <option value="Reviewed">Reviewed</option>}
            {activeTab === "FEEDBACK" && <option value="Acknowledged">Acknowledged</option>}
          </select>
        </div>
      </div>

      {/* Dynamic Database List Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto min-h-[280px] pb-12">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">ID</th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">{itemTypeLabel} Details</th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Category</th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Priority</th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
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
                        {/* Tagged Students */}
                        {item.taggedStudents && item.taggedStudents.length > 0 ? (
                          item.taggedStudents.map((stud) => (
                            <span key={stud.id} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[9px] font-bold">
                              <GraduationCap size={10} />
                              {stud.name} {item.class ? `(${item.class.name})` : ""}
                            </span>
                          ))
                        ) : item.student ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[9px] font-bold">
                            <GraduationCap size={10} />
                            {item.student.name} {item.class ? `(${item.class.name})` : ""}
                          </span>
                        ) : null}

                        {/* Tagged Teachers */}
                        {item.taggedTeachers && item.taggedTeachers.length > 0 ? (
                          item.taggedTeachers.map((tchr) => (
                            <span key={tchr.id} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[9px] font-bold">
                              <UserCheck size={10} />
                              Tagged Teacher: {tchr.name}
                            </span>
                          ))
                        ) : item.teacher ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[9px] font-bold">
                            <UserCheck size={10} />
                            Tagged Teacher: {item.teacher.name}
                          </span>
                        ) : null}
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
                  <td className="px-8 py-5 text-right">
                    <ActionDropdown 
                      actions={[
                        { label: `View ${itemTypeLabel} Info`, onClick: () => alert(`Details:\n"${item.note}"`) },
                        { label: "Update Status", onClick: () => {
                          setSelectedIncidentForStatus(item);
                          if (userRole === "TEACHER") {
                            setFormStatus("Teacher Approved");
                          } else if (userRole === "PRINCIPAL") {
                            setFormStatus(item.status === "Closed" ? "Closed" : "Principal Approved");
                          } else {
                            setFormStatus(item.status);
                          }
                          setIsStatusModalOpen(true);
                        } },
                        { label: `Delete ${itemTypeLabel}`, onClick: () => handleDeleteRecord(item.id, item.title), variant: "danger" },
                      ]} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredItems.length === 0 && (
          <div className="p-16 text-center">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
              <AlertCircle className="text-slate-300" size={28} />
            </div>
            <h3 className="text-slate-900 font-black uppercase tracking-wider text-xs">No {itemTypeLabel} Logs Found</h3>
            <p className="text-slate-400 font-bold text-[10px] uppercase mt-1.5 tracking-widest">Great! There are no unresolved records matching this query.</p>
          </div>
        )}
      </div>

      {/* Dynamic Report Form Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={`Report New ${itemTypeLabel}`}>
        <form onSubmit={handleReportSubmit} className="p-1 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Core Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1 w-4 bg-blue-600 rounded-full"></span> Basic Information
            </h3>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{itemTypeLabel} Title</label>
              <input
                placeholder={`Brief summary of the ${itemTypeLabel.toLowerCase()}`}
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{itemTypeLabel} Note / Details</label>
              <textarea
                placeholder={`Write detailed notes about the ${itemTypeLabel.toLowerCase()} here...`}
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                className="w-full h-32 bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium outline-none"
                >
                  <option value="General">General</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Facilities">Facilities</option>
                  <option value="Security">Security</option>
                  <option value="Transport">Transport</option>
                  <option value="Canteen">Canteen</option>
                  <option value="Academic">Academic</option>
                  <option value="Extracurricular">Extracurricular</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Priority</label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value)}
                  className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dynamic People Tagging */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1 w-4 bg-emerald-600 rounded-full"></span> Tag School Members
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="space-y-1 col-span-full">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tag Teacher</label>
                <select
                  value={tempTeacherId}
                  onChange={(e) => handleTeacherSelect(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium outline-none"
                >
                  <option value="">Select a teacher to tag...</option>
                  {teachersList.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {selectedTeachers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 p-2 bg-white rounded-xl border border-slate-100">
                    {selectedTeachers.map((t) => (
                      <span key={t.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-bold transition-all">
                        {t.name}
                        <button
                          type="button"
                          onClick={() => removeTeacher(t.id)}
                          className="h-4 w-4 rounded-full bg-indigo-200/50 hover:bg-indigo-200 flex items-center justify-center text-[10px] text-indigo-800 transition-all font-black cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tag Class</label>
                <select
                  value={formClassId}
                  onChange={(e) => setFormClassId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium outline-none"
                >
                  <option value="">None - General School Incident</option>
                  {classesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tag Student</label>
                <select
                  value={tempStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  disabled={!formClassId || loadingStudents}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium outline-none disabled:opacity-50"
                >
                  {loadingStudents ? (
                    <option value="">Loading students...</option>
                  ) : !formClassId ? (
                    <option value="">* Select a class first</option>
                  ) : (
                    <>
                      <option value="">Select a student to tag...</option>
                      {studentsByClass.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.studentId})</option>
                      ))}
                    </>
                  )}
                </select>
                {selectedStudents.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 p-2 bg-white rounded-xl border border-slate-100 col-span-full">
                    {selectedStudents.map((s) => (
                      <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-lg text-xs font-bold transition-all">
                        {s.name}
                        <button
                          type="button"
                          onClick={() => removeStudent(s.id)}
                          className="h-4 w-4 rounded-full bg-blue-200/50 hover:bg-blue-200 flex items-center justify-center text-[10px] text-blue-800 transition-all font-black cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submittingForm}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
          >
            {submittingForm ? <Loader2 className="animate-spin" size={16} /> : `Submit Log`}
          </button>
        </form>
      </Modal>

      {/* Status Update Modal */}
      <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title={`Update Status / Action`}>
        <form onSubmit={handleStatusSubmit} className="p-1 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <span className="h-1 w-4 bg-blue-600 rounded-full"></span> Status & Closure Actions
            </h3>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Incident Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium outline-none text-slate-700 font-bold"
              >
                {userRole === "TEACHER" && (
                  <option value="Teacher Approved">Teacher Approved</option>
                )}
                {userRole === "PRINCIPAL" && (
                  <>
                    <option value="Principal Approved">Principal Approved</option>
                    <option value="Closed">Closed (Resolved / Finalized)</option>
                  </>
                )}
                {userRole !== "TEACHER" && userRole !== "PRINCIPAL" && (
                  <>
                    <option value="Open">Open (Pending Evaluation)</option>
                    <option value="Pending">Pending Action</option>
                    <option value="Teacher Approved">Teacher Approved</option>
                    <option value="Principal Approved">Principal Approved</option>
                    <option value="Closed">Closed (Resolved / Finalized)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={updatingStatus}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
          >
            {updatingStatus ? <Loader2 className="animate-spin" size={16} /> : `Save Status`}
          </button>
        </form>
      </Modal>
    </div>
  );
}
