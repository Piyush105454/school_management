import React from "react";
import { 
  Users, 
  FileText, 
  UserPlus, 
  TrendingUp,
  Clock,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

const stats = [
  { name: "Total Inquiries", value: "128", icon: FileText, color: "text-blue-600", bg: "bg-blue-100" },
  { name: "Shortlisted", value: "45", icon: UserPlus, color: "text-green-600", bg: "bg-green-100" },
  { name: "Total Students", value: "892", icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
  { name: "Admission Rate", value: "12%", icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-100" },
];

export default function OfficeDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Office Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back, Admin. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} p-2 rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+2.5%</span>
            </div>
            <p className="text-sm font-medium text-slate-500">{stat.name}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Recent Inquiries</h2>
            <Link href="/office/inquiries" className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                    JS
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">John Smith</p>
                    <p className="text-xs text-slate-500">applied for Class 10 • 2h ago</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-yellow-50 text-yellow-600 border border-yellow-100">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/office/inquiries" className="w-full flex items-center justify-between p-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors uppercase text-sm tracking-wider">
              New Inquiry
              <UserPlus className="h-5 w-5" />
            </Link>
            <button className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors uppercase text-sm tracking-wider">
              Schedule Entrance Exam
              <Clock className="h-5 w-5 text-slate-400" />
            </button>
            <button className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors uppercase text-sm tracking-wider">
              Generate Report
              <FileText className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
