"use client";

import React, { useEffect, useState } from "react";
import { Users, Loader2 } from "lucide-react";

export default function TeamTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tasks")
      .then(res => res.json())
      .then(data => setTasks(data.tasks || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Team Tasks
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of all tasks across the team
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No tasks found.
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Task</th>
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map(task => (
                <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{task.title}</p>
                    {task.project && <p className="text-xs text-slate-500">{task.project.name}</p>}
                  </td>
                  <td className="px-6 py-4">
                    {task.assignedTo ? (
                      <div>
                        <p className="font-bold text-slate-700">{task.assignedTo.email}</p>
                        <p className="text-xs text-slate-500">{task.assignedTo.role}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      task.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                      task.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-700"
                    }`}>
                      {task.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      task.priority === "URGENT" ? "bg-red-100 text-red-700" :
                      task.priority === "HIGH" ? "bg-orange-100 text-orange-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Date"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
