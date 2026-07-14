"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { LayoutDashboard, CheckCircle2, Clock, AlertCircle, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";

export default function TaskDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    underReview: 0,
    completed: 0,
    overdue: 0
  });

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tasks")
      .then(res => res.json())
      .then(data => {
        const fetchedTasks = data.tasks || [];
        setTasks(fetchedTasks);
        setStats(prev => ({
          ...prev,
          total: fetchedTasks.length,
          completed: fetchedTasks.filter((t: any) => t.status === "COMPLETED").length,
          inProgress: fetchedTasks.filter((t: any) => t.status === "IN_PROGRESS").length,
          todo: fetchedTasks.filter((t: any) => t.status === "TODO").length,
          underReview: fetchedTasks.filter((t: any) => t.status === "UNDER_REVIEW").length,
        }));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-blue-600" />
            Task Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of tasks and progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/tasks/create"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
          >
            Create Task
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard title="Total Tasks" value={stats.total} icon={LayoutDashboard} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="To Do" value={stats.todo} icon={Calendar} color="text-slate-600" bg="bg-slate-50" />
        <StatCard title="In Progress" value={stats.inProgress} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
        <StatCard title="Under Review" value={stats.underReview} icon={AlertCircle} color="text-purple-600" bg="bg-purple-50" />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard title="Overdue" value={stats.overdue} icon={AlertCircle} color="text-red-600" bg="bg-red-50" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            You don't have any tasks assigned yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Task</th>
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
                      <span className={`px-3 py-1 rounded-full border text-xs font-bold ${
                        task.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        task.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-slate-50 text-slate-700 border-slate-200"
                      }`}>
                        {task.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${
                        task.priority === "URGENT" || task.priority === "HIGH" ? "bg-red-50 text-red-700 border-red-200" :
                        task.priority === "MEDIUM" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          task.priority === "URGENT" || task.priority === "HIGH" ? "bg-red-500" :
                          task.priority === "MEDIUM" ? "bg-amber-500" :
                          "bg-emerald-500"
                        }`}></div>
                        {task.priority === "URGENT" ? "High" : task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Date"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: { title: string, value: number, icon: any, color: string, bg: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        <div className={`p-2 rounded-xl ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}
