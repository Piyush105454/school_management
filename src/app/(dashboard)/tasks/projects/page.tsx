"use client";

import React, { useEffect, useState } from "react";
import { FolderOpen, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function ProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const canCreate = session?.user?.role !== "TEACHER" && session?.user?.role !== "STUDENT_PARENT";

  useEffect(() => {
    fetch("/api/projects")
      .then(res => res.json())
      .then(data => setProjects(data.projects || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-blue-600" />
            Projects
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            High-level goals and project progress
          </p>
        </div>
        {canCreate && (
          <Link
            href="/tasks/projects/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
          >
            <Plus className="h-4 w-4" /> New Project
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
            No projects found. Create one to start grouping tasks.
          </div>
        ) : (
          projects.map(project => (
            <div key={project.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-bold text-slate-800">{project.name}</h2>
                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                  project.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                  project.status === "ACTIVE" ? "bg-blue-100 text-blue-700" :
                  "bg-slate-100 text-slate-700"
                }`}>
                  {project.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-6 flex-1">{project.description || "No description provided."}</p>
              
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Progress</span>
                  <span className="text-sm font-bold text-slate-800">{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-3 text-xs text-slate-500">
                  <span>{project.completedTasks} / {project.totalTasks} Tasks Completed</span>
                  {project.dueDate && <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
