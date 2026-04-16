import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { eq, desc, and } from "drizzle-orm";
import { studentProfiles, admissionMeta, lessonPlans, classes, subjects, students } from "@/db/schema";
import { redirect } from "next/navigation";
import { ClipboardList, BookOpen, Calendar, Clock, GraduationCap, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function StudentHomeworkPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  // 1. Fetch student profile and admission meta
  const profileResults = await db
    .select({
      profile: studentProfiles,
      meta: admissionMeta,
    })
    .from(studentProfiles)
    .leftJoin(admissionMeta, eq(studentProfiles.admissionMetaId, admissionMeta.id))
    .where(eq(studentProfiles.userId, session.user.id))
    .limit(1);

  if (!profileResults.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 bg-white rounded-3xl border border-slate-100 p-12">
        <ClipboardList size={48} className="text-slate-200" />
        <h2 className="text-xl font-black text-slate-900 uppercase italic">No Profile Found</h2>
        <p className="text-slate-500 font-medium">Please complete your admission process or contact support.</p>
      </div>
    );
  }

  const { meta } = profileResults[0];
  
  // 2. Resolve Class ID from 'students' table using admissionNumber or scholarNumber
  // We check if student exists in the academy 'students' table which has the class assignment
  const studentEntry = await db.query.students.findFirst({
    where: (table, { eq, or }) => or(
      meta?.admissionNumber ? eq(table.studentId, meta.admissionNumber) : undefined,
      meta?.scholarNumber ? eq(table.studentId, meta.scholarNumber) : undefined
    ),
    with: {
      class: true
    }
  });

  if (!studentEntry || !studentEntry.classId) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-white rounded-[2.5rem] p-12 border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col items-center text-center space-y-6">
          <div className="h-20 w-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 border border-amber-100 shadow-inner">
            <GraduationCap size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 uppercase italic leading-none tracking-tight">Class Not Assigned</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Awaiting school office for class allocation</p>
          </div>
          <p className="text-sm text-slate-500 max-w-sm leading-relaxed font-medium">
            Your admission is in progress. Once the office assigns you to a specific class, your homework and academic resources will appear here.
          </p>
          <div className="pt-4">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-4 py-2 rounded-xl">Status: Pending Verification</div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Fetch Lesson Plans for this Class (where homework is stored in step1Data)
  const allLessonPlans = await db.query.lessonPlans.findMany({
    where: eq(lessonPlans.classId, studentEntry.classId),
    with: {
      subject: true,
      teacher: {
        with: {
          teacherProfile: true
        }
      },
    },
    orderBy: [desc(lessonPlans.date)],
  });

  // Filter out plans that don't have homework data
  const homeworkItems = allLessonPlans.map(lp => {
    let step1 = {} as any;
    try {
      step1 = typeof lp.step1Data === 'string' ? JSON.parse(lp.step1Data) : lp.step1Data;
    } catch(e) {}

    return {
      id: lp.id,
      date: lp.date,
      subjectName: lp.subject?.name || "General",
      homework: step1.homework || "",
      teacherName: (lp.teacher as any)?.teacherProfile?.name || "Faculty",
      unit: step1.unit || ""
    };
  }).filter(item => item.homework && item.homework.trim() !== "");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 text-blue-400">
            <ClipboardList size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Student Portal</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
            My Homework <br/> <span className="text-blue-500">Dashboard</span>
          </h1>
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
              <GraduationCap size={14} className="text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">{studentEntry.class?.name || "No Class"}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
              <Calendar size={14} className="text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">{formatDate(new Date().toISOString().split('T')[0])}</span>
            </div>
          </div>
        </div>
        <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
          <ClipboardList size={200} />
        </div>
      </div>

      {/* Homework Cards */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Recent Assignments</h2>
          <span className="text-[10px] font-bold text-slate-400">{homeworkItems.length} Tasks Found</span>
        </div>

        {homeworkItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 border border-slate-100 text-center flex flex-col items-center gap-4">
             <div className="h-16 w-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center">
                <BookOpen size={32} />
             </div>
             <p className="text-slate-500 font-bold uppercase tracking-widest text-sm italic">No homework assigned yet for this week.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {homeworkItems.map((item, idx) => (
              <div key={item.id} className="group bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden hover:border-blue-200 transition-all flex flex-col">
                {/* Style 1B Style Header */}
                <div className="border-b border-slate-100">
                  <div className="grid grid-cols-12 divide-x divide-slate-100 h-14 bg-slate-50/50">
                    <div className="col-span-8 flex items-center px-6">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] italic mr-2">1B</span>
                      <h3 className="font-black text-slate-800 uppercase text-xs tracking-tight truncate">{item.subjectName}</h3>
                    </div>
                    <div className="col-span-4 flex items-center justify-center bg-slate-800 text-white font-black text-[9px] uppercase tracking-widest">
                       {item.date}
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-8 flex-1 space-y-6">
                   <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm shrink-0">
                         <BookOpen size={20} />
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Teacher Assignment</p>
                         <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.teacherName}</p>
                      </div>
                   </div>

                   <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative shadow-inner min-h-[140px]">
                      <div className="absolute -top-3 left-4 bg-white px-3 py-1 rounded-lg border border-slate-100 text-[8px] font-black text-blue-500 uppercase tracking-[0.2em]">Work List</div>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap italic">
                         {item.homework}
                      </p>
                   </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <Clock size={12} className="text-slate-300" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Prepare for next session</span>
                   </div>
                   <div className="h-8 w-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:border-blue-200 transition-all cursor-pointer">
                      <ArrowRight size={14} />
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
