import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { eq, desc, and, or } from "drizzle-orm";
import { studentProfiles, admissionMeta, lessonPlans, classes, subjects, students, teachers, homeworkSubmissions } from "@/db/schema";
import { redirect } from "next/navigation";
import { ClipboardList, BookOpen, Calendar, Clock, GraduationCap, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import HomeworkClient from "./HomeworkClient";
import { getSignedDownloadUrl } from "@/lib/s3-service";

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
  // 2. Resolve Class ID from 'students' table
  const studentEntryResults = await db
    .select({
      id: students.id,
      studentId: students.studentId,
      classId: students.classId,
      class: classes
    })
    .from(students)
    .leftJoin(classes, eq(students.classId, classes.id))
    .where(
        or(
          meta?.admissionNumber ? eq(students.studentId, meta.admissionNumber) : undefined,
          meta?.scholarNumber ? eq(students.studentId, meta.scholarNumber) : undefined,
          meta?.entryNumber ? eq(students.studentId, meta.entryNumber) : undefined
        )
    )
    .limit(1);

  const studentEntry = studentEntryResults[0];

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

  // 3. Fetch Lesson Plans for this Class
  // 3. Fetch Lesson Plans for this Class
  const allLessonPlans = await db
    .select({
      id: lessonPlans.id,
      date: lessonPlans.date,
      step1Data: lessonPlans.step1Data,
      subject: subjects,
      teacherProfile: teachers,
    })
    .from(lessonPlans)
    .leftJoin(subjects, eq(lessonPlans.subjectId, subjects.id))
    .leftJoin(teachers, eq(lessonPlans.teacherId, teachers.userId))
    .where(eq(lessonPlans.classId, studentEntry.classId as number))
    .orderBy(desc(lessonPlans.date));



  // 4. Fetch Student Submissions for these plans
  const studentSubmissions = await db
    .select()
    .from(homeworkSubmissions)
    .where(eq(homeworkSubmissions.studentId, studentEntry.id));

  // Filter out plans that don't have homework data
  const homeworkItems = allLessonPlans.map(lp => {
    let step1 = {} as any;
    try {
      step1 = typeof lp.step1Data === 'string' ? JSON.parse(lp.step1Data) : lp.step1Data;
    } catch(e) {}

    const submission = studentSubmissions.find(s => s.lessonPlanId === lp.id);
    
    // Construct clean Proxy URL instead of long S3 Signed URL
    let viewUrl = submission?.imagePath || "";
    if (viewUrl && viewUrl.startsWith("http")) {
        viewUrl = `/api/homework/view?path=${encodeURIComponent(viewUrl)}`;
    }

    return {
      id: lp.id,
      date: lp.date,
      subjectName: lp.subject?.name || "General",
      homework: step1.homework || "",
      teacherName: lp.teacherProfile?.name || "Faculty",
      unit: step1.unit || "",
      status: submission?.status || "NOT_SUBMITTED",
      submittedDescription: submission?.description || "",
      submittedImage: viewUrl
    };
  });

  const filteredHomeworkItems = homeworkItems.filter(item => item.homework && item.homework.trim() !== "");

  return (
    <div className="space-y-6">
      {/* Homework Dashboard Client */}
      <HomeworkClient 
        initialItems={filteredHomeworkItems} 
        className={studentEntry.class?.name || "No Class"} 
        studentId={studentEntry.id}
        studentRoll={studentEntry.studentId}
      />
    </div>
  );
}
