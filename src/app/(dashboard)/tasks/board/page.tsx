"use client";

import React, { useEffect, useState } from "react";
import { LayoutDashboard, Loader2, Calendar } from "lucide-react";
import { useSession } from "next-auth/react";

const COLUMNS = [
  { id: "TO_DO", label: "To Do", color: "border-slate-200 bg-slate-50" },
  { id: "IN_PROGRESS", label: "In Progress", color: "border-amber-200 bg-amber-50" },
  { id: "UNDER_REVIEW", label: "Under Review", color: "border-purple-200 bg-purple-50" },
  { id: "COMPLETED", label: "Completed", color: "border-emerald-200 bg-emerald-50" }
];

export default function BoardViewPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = () => {
    fetch("/api/tasks")
      .then(res => res.json())
      .then(data => setTasks(data.tasks || []))
      .finally(() => setLoading(false));
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        // Revert on failure
        fetchTasks();
        const err = await res.json();
        alert("Failed to update status: " + err.error);
      }
    } catch (err: any) {
      fetchTasks();
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto min-h-[calc(100vh-10rem)] flex flex-col pb-12">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-blue-600" />
            Board View
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kanban workflow for your tasks
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-hidden">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className={`flex flex-col rounded-2xl border ${col.color} overflow-hidden shadow-sm`}>
                <div className="p-4 border-b border-black/5 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                  <h3 className="font-bold text-slate-700">{col.label}</h3>
                  <span className="bg-white px-2 py-1 rounded-lg text-xs font-bold text-slate-500 shadow-sm">
                    {colTasks.length}
                  </span>
                </div>
                <div className="p-4 flex-1 overflow-y-auto space-y-3">
                  {colTasks.map(task => (
                    <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 flex flex-col gap-3 group">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-bold text-slate-800 line-clamp-2">{task.title}</p>
                        <span className={`shrink-0 px-2 py-1 rounded-md text-[10px] font-bold ${
                          task.priority === "URGENT" ? "bg-red-100 text-red-700" :
                          task.priority === "HIGH" ? "bg-orange-100 text-orange-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      {task.project && (
                        <p className="text-xs text-slate-500 font-medium line-clamp-1">{task.project.name}</p>
                      )}

                      <div className="flex justify-between items-end mt-2 pt-3 border-t border-slate-100">
                        {task.dueDate ? (
                          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        ) : <div></div>}
                        
                        <select 
                          className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-600 rounded-lg px-2 py-1 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/20"
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        >
                          {COLUMNS.map(c => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-center py-8 text-xs font-medium text-slate-400">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
