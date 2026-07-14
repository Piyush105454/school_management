"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";

export default function CreateTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    assignedToId: "",
    projectId: "",
    institute: "",
    classId: "",
    studentId: "",
    dueDate: "",
  });

  const [options, setOptions] = useState({
    users: [] as any[],
    projects: [] as any[],
    institutes: [] as string[],
    classes: [] as any[],
    students: [] as any[]
  });

  useEffect(() => {
    // Fetch initial options
    Promise.all([
      fetch("/api/form-options?type=users").then(res => res.json()),
      fetch("/api/form-options?type=projects").then(res => res.json()),
      fetch("/api/form-options?type=institutes").then(res => res.json())
    ]).then(([usersData, projectsData, instData]) => {
      setOptions(prev => ({
        ...prev,
        users: usersData.users || [],
        projects: projectsData.projects || [],
        institutes: instData.institutes || []
      }));
    });
  }, []);

  // Fetch classes when institute changes
  useEffect(() => {
    if (formData.institute) {
      fetch(`/api/form-options?type=classes&institute=${encodeURIComponent(formData.institute)}`)
        .then(res => res.json())
        .then(data => setOptions(prev => ({ ...prev, classes: data.classes || [], students: [] })));
    } else {
      setOptions(prev => ({ ...prev, classes: [], students: [] }));
    }
  }, [formData.institute]);

  // Fetch students when class changes
  useEffect(() => {
    if (formData.classId) {
      fetch(`/api/form-options?type=students&classId=${formData.classId}`)
        .then(res => res.json())
        .then(data => setOptions(prev => ({ ...prev, students: data.students || [] })));
    } else {
      setOptions(prev => ({ ...prev, students: [] }));
    }
  }, [formData.classId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    handleSelectChange(name, value);
  };

  const handleSelectChange = (name: string, value: string) => {
    // Cascade resets
    if (name === "institute") {
      setFormData(prev => ({ ...prev, institute: value, classId: "", studentId: "" }));
    } else if (name === "classId") {
      setFormData(prev => ({ ...prev, classId: value, studentId: "" }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      padding: '4px',
      borderRadius: '0.75rem',
      borderColor: state.isFocused ? '#3b82f6' : '#e2e8f0',
      backgroundColor: '#f8fafc',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1'
      }
    }),
    menu: (base: any) => ({ ...base, zIndex: 9999, borderRadius: '0.75rem', overflow: 'hidden' }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        router.push("/tasks");
      } else {
        const err = await res.json();
        alert("Failed to create task: " + err.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/tasks" className="text-slate-500 hover:text-slate-800 flex items-center gap-2 w-fit mb-4 text-sm font-medium transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Create New Task</h1>
        <p className="text-sm text-slate-500 mt-1">Assign a task to a team member or yourself.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Task Title *</label>
              <input 
                required 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                placeholder="E.g., Complete Monthly Reports" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                rows={3} 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none" 
                placeholder="Add more details about the task..." 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Assign To</label>
              <Select 
                options={[{ value: "", label: "Unassigned" }, ...options.users.map(u => ({ value: u.id, label: `${u.email} (${u.role})` }))]}
                value={formData.assignedToId ? { value: formData.assignedToId, label: options.users.find(u => u.id === formData.assignedToId)?.email + " (" + options.users.find(u => u.id === formData.assignedToId)?.role + ")" } : { value: "", label: "Unassigned" }}
                onChange={(opt: any) => handleSelectChange("assignedToId", opt?.value || "")}
                styles={selectStyles}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                className="text-sm"
                isClearable
                placeholder="Search user..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Priority</label>
              <Select 
                options={[
                  { value: "LOW", label: "Low" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "HIGH", label: "High" },
                  { value: "URGENT", label: "Urgent" }
                ]}
                value={{ value: formData.priority, label: formData.priority.charAt(0) + formData.priority.slice(1).toLowerCase() }}
                onChange={(opt: any) => handleSelectChange("priority", opt?.value || "MEDIUM")}
                styles={selectStyles}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                className="text-sm"
                isSearchable={false}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Due Date</label>
              <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Project (Optional)</label>
              <CreatableSelect 
                options={[{ value: "", label: "None" }, ...options.projects.map(p => ({ value: p.id, label: p.name }))]}
                value={formData.projectId ? { value: formData.projectId, label: options.projects.find(p => p.id === formData.projectId)?.name || formData.projectId } : { value: "", label: "None" }}
                onChange={(opt: any) => handleSelectChange("projectId", opt?.value || "")}
                styles={selectStyles}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                className="text-sm"
                isClearable
                placeholder="Search or create project..."
                formatCreateLabel={(inputValue) => `Create project "${inputValue}"`}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">School (Optional)</label>
              <Select 
                options={[{ value: "", label: "Select School" }, ...options.institutes.map(inst => ({ value: inst, label: inst }))]}
                value={formData.institute ? { value: formData.institute, label: formData.institute } : { value: "", label: "Select School" }}
                onChange={(opt: any) => handleSelectChange("institute", opt?.value || "")}
                styles={selectStyles}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                className="text-sm"
                isClearable
              />
            </div>

          </div>
          <div className="flex justify-end pt-6 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-blue-500/20 disabled:opacity-70 active:scale-95"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
