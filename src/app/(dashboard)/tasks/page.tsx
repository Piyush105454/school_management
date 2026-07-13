"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { LayoutDashboard, CheckCircle2, Clock, AlertCircle, Calendar } from "lucide-react";
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
            href="/tasks/my-tasks"
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
          >
            View My Tasks
          </Link>
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

      {/* Placeholders for Recent Tasks and Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Tasks</h2>
          <div className="text-sm text-slate-500 text-center py-8">
            Tasks will appear here once loaded.
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Active Projects</h2>
          <div className="text-sm text-slate-500 text-center py-8">
            Projects will appear here once loaded.
          </div>
        </div>
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
