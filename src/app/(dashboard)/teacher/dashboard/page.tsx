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
    ClipboardCheck,
    Calendar
} from "lucide-react";
import { protectRoute } from "@/lib/roleGuard";
import { db } from "@/db";
import { teachers, timetable, holidays } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function TeacherDashboardPage() {
    // Protect this route - only TEACHER role can access
    await protectRoute(["TEACHER"]);

    const session = await getServerSession(authOptions);
    if (!session) redirect("/");

    // Fetch today's date
    const todayDateStr = (() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const dateVal = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${dateVal}`;
    })();

    // Fetch the teacher profile and today's holiday status in parallel
    const [teacherProfile, todayHolidayList] = await Promise.all([
        db.query.teachers.findFirst({
            where: eq(teachers.userId, session.user.id)
        }),
        db.select().from(holidays).where(eq(holidays.date, todayDateStr)).limit(1)
    ]);

    const todayHoliday = todayHolidayList?.[0] || null;

    let teacherSchedule: any[] = [];
    if (teacherProfile) {
        teacherSchedule = await db.query.timetable.findMany({
            where: eq(timetable.teacherId, teacherProfile.id),
            with: { subject: true }
        });
    }

    // Determine current day of week (and show Monday's schedule if it's Sunday)
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = days[new Date().getDay()];
    const queryDay = currentDay === "Sunday" ? "Monday" : currentDay;

    const todaySchedule = teacherSchedule
        .filter(slot => slot.dayOfWeek === queryDay)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

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
                            Today's Schedule ({queryDay} - {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })})
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {todayHoliday ? (
                            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center text-rose-800 space-y-2 shadow-sm">
                                <Calendar className="h-8 w-8 text-rose-500 mx-auto animate-bounce" />
                                <h3 className="text-base font-black uppercase tracking-wide">Holiday: {todayHoliday.title}</h3>
                                <p className="text-xs font-semibold text-rose-600">
                                    Today is a scheduled school holiday ({(() => {
                                        const [year, month, day] = todayHoliday.date.split("-").map(Number);
                                        const d = new Date(year, month - 1, day);
                                        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                                    })()}). Enjoy your day off!
                                </p>
                            </div>
                        ) : todaySchedule.length > 0 ? (
                            todaySchedule.map((slot, i) => (
                                <div key={i} className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                                    <div className="text-center min-w-[70px] border-r border-slate-200/50 pr-4">
                                        <p className="text-sm font-black text-slate-900">{slot.startTime}</p>
                                        <p className="text-[10px] font-bold text-slate-400">{slot.endTime}</p>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-slate-900">{slot.subject?.name || slot.customSubject || "Lecture"}</p>
                                        <p className="text-xs font-bold text-slate-500">{slot.className} • {slot.periodName}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center space-y-2 border border-dashed border-slate-200 rounded-3xl">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No lectures scheduled today</p>
                                <p className="text-xs text-slate-400 font-medium">Enjoy your break or consult the office for schedule updates.</p>
                            </div>
                        )}
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

