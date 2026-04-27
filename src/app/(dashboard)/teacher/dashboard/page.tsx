import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
    Users,
    School,
    CalendarCheck,
    BookOpen,
    LayoutDashboard,
    Clock,
    ClipboardCheck
} from "lucide-react";
import { protectRoute } from "@/lib/roleGuard";

export default async function TeacherDashboardPage() {
    // Protect this route - only TEACHER role can access
    await protectRoute(["TEACHER"]);

    const session = await getServerSession(authOptions);
    if (!session) redirect("/");

    const stats = [
        { name: "My Classes", value: "3", icon: School, color: "text-blue-600", bg: "bg-blue-50" },
        { name: "Total Students", value: "120", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
        { name: "Attendance Marked", value: "Yes", icon: CalendarCheck, color: "text-green-600", bg: "bg-green-50" },
        { name: "Lesson Plans", value: "12", icon: BookOpen, color: "text-orange-600", bg: "bg-orange-50" },
    ];

    return (
        <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 font-outfit uppercase tracking-tight">Teacher Dashboard</h1>
                <p className="text-sm text-slate-500 font-medium">Welcome back! Here's an overview of your classes and activities.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon size={24} />
                            </div>
                            <span className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</span>
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.name}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                            <Clock className="text-blue-600" size={20} />
                            Today's Schedule
                        </h2>
                        <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">View Full Timetable</button>
                    </div>

                    <div className="space-y-4">
                        {[
                            { time: "09:00 AM", subject: "Mathematics", class: "Class 8th A", room: "Room 102" },
                            { time: "11:30 AM", subject: "Physics", class: "Class 10th B", room: "Science Lab" },
                            { time: "02:00 PM", subject: "Mathematics", class: "Class 9th C", room: "Room 204" },
                        ].map((slot, i) => (
                            <div key={i} className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                                <div className="text-center min-w-[70px]">
                                    <p className="text-sm font-black text-slate-900">{slot.time.split(' ')[0]}</p>
                                    <p className="text-[10px] font-bold text-slate-400">{slot.time.split(' ')[1]}</p>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-slate-900">{slot.subject}</p>
                                    <p className="text-xs font-bold text-slate-500">{slot.class} • {slot.room}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <ClipboardCheck className="text-purple-600" size={20} />
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex flex-col items-center justify-center p-6 rounded-3xl bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-600 hover:text-white transition-all group gap-2">
                            <CalendarCheck size={24} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-center">Mark Attendance</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-6 rounded-3xl bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-600 hover:text-white transition-all group gap-2">
                            <BookOpen size={24} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-center">Update Lesson Plan</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-6 rounded-3xl bg-orange-50 text-orange-700 border border-orange-100 hover:bg-orange-600 hover:text-white transition-all group gap-2">
                            <LayoutDashboard size={24} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-center">Class Overview</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-6 rounded-3xl bg-green-50 text-green-700 border border-green-100 hover:bg-green-600 hover:text-white transition-all group gap-2">
                            <Users size={24} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-center">My Students</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

