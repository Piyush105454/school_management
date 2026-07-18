import React from "react";
import { db } from "@/db";
import { teachers, students, classes, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DailyAttendanceMarker from "@/features/academy/components/DailyAttendanceMarker";
import { AlertCircle, ChevronLeft, Search, School } from "lucide-react";
import Link from "next/link";

export default async function DailyAttendancePage({
  searchParams
}: {
  searchParams: Promise<{ class_id?: string; institute?: string }>
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return <div>Unauthorized</div>;

  const params = await searchParams;
  let targetClassId = params.class_id ? parseInt(params.class_id) : null;

  // 1. Try to find if this user is a teacher with an assigned class
  const teacherProfile = await db.query.teachers.findFirst({
    where: eq(teachers.userId, session.user.id)
  });

  // 2. Fetch classes that match the teacher's profile assignments
  let teacherClasses: any[] = [];
  if (session.user.role === "TEACHER" && teacherProfile?.classAssigned) {
    const assignedClassesList = teacherProfile.classAssigned
      .split(",")
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
    
    const teacherInstitute = teacherProfile.institute;
    const dbClasses = await db.select().from(classes).orderBy(classes.grade);
    teacherClasses = dbClasses.filter(c => 
      assignedClassesList.includes(c.name.toLowerCase()) &&
      (!teacherInstitute || c.institute === teacherInstitute)
    );

    // If no class is explicitly requested, and they have exactly 1 assigned class, auto-select it
    if (!targetClassId && teacherClasses.length === 1) {
      targetClassId = teacherClasses[0].id;
    }
  }

  // 3. If we STILL don't have a targetClassId, show the Class Picker (Admin/Staff/Teacher View)
  if (!targetClassId) {
    let allClasses: any[] = [];
    if (session.user.role === "TEACHER") {
      allClasses = teacherClasses;
    } else {
      let selectedInstitute = params.institute;
      if ((session.user.role === "TEACHER" || session.user.role === "PRINCIPAL") && session.user.institute) {
        selectedInstitute = session.user.institute;
      } else if (!selectedInstitute && session.user.institute) {
        selectedInstitute = session.user.institute;
      }
      
      allClasses = await db.select().from(classes).orderBy(classes.grade);
      
      // Apply global institute filter
      if (selectedInstitute && selectedInstitute !== "ALL") {
        allClasses = allClasses.filter(c => c.institute === selectedInstitute);
      }
    }
    return (
      <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Link href="/office/academy-management/attendance" className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all shadow-sm">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 font-outfit uppercase">Daily Attendance</h1>
            <p className="text-xs text-slate-500 font-medium">Select a class to mark attendance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {allClasses.map((cls) => (
            <Link 
              key={cls.id} 
              href={`?class_id=${cls.id}`}
              className="group p-6 bg-white border border-slate-200 rounded-3xl hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col items-center gap-4 text-center"
            >
              <div className="h-16 w-16 bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-2xl flex items-center justify-center transition-colors">
                <School className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-tight">{cls.name}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Grade {cls.grade}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // 4. If we have a targetClassId, render the marker
  const teacherInstitute = teacherProfile?.institute;
  const academyClass = await db.query.classes.findFirst({ 
    where: (c: any, { and, eq }: any) => and(
      eq(c.id, targetClassId!),
      teacherInstitute ? eq(c.institute, teacherInstitute) : undefined
    )
  });
  if (!academyClass) return <div className="p-10 text-center font-bold">Class not found or access denied.</div>;

  const classStudents = await db.select({
    id: students.id,
    name: students.name,
    rollNumber: students.rollNumber
  })
  .from(students)
  .where(eq(students.classId, academyClass.id));

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div className="flex items-center gap-4">
        {/* If user is a teacher, go to attendance main, otherwise go back to class picker */}
        <Link href={teacherProfile?.classAssigned ? "/office/academy-management/attendance" : "/office/academy-management/attendance/daily"} className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all shadow-sm">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-900 font-outfit uppercase">Daily Attendance</h1>
          <p className="text-xs text-slate-500 font-medium">{academyClass.name}</p>
        </div>
      </div>

      <DailyAttendanceMarker 
        classId={academyClass.id}
        className={academyClass.name}
        students={classStudents}
        isAdmin={!teacherProfile?.classAssigned}
      />
    </div>
  );
}
