import LessonPlanForm from "@/features/academy/components/LessonPlanForm";
import { BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getAllAcademicMetadata } from "@/features/academy/actions/academyActions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { teachers, timetable } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function LessonPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ institute?: string }>;
}) {
  const { institute } = await searchParams;
  const metadata = await getAllAcademicMetadata(institute);

  let classes = metadata.classes || [];
  let subjects = metadata.subjects || [];

  const session = await getServerSession(authOptions);

  let teacherName: string | undefined = undefined;

  if (session?.user?.role === "TEACHER") {
    const teacherProfile = await db.query.teachers.findFirst({
      where: eq(teachers.userId, session.user.id),
    });

    if (teacherProfile) {
      teacherName = teacherProfile.name;
      const teacherInstitute = teacherProfile.institute;

      // 1. Fetch timetable entries for this teacher to include classes/subjects they teach
      const teacherTimetable = await db.query.timetable.findMany({
        where: eq(timetable.teacherId, teacherProfile.id),
        columns: { subjectId: true, classId: true, className: true }
      });

      const timetableSubjectIds = new Set(teacherTimetable.map(t => t.subjectId).filter(Boolean));
      const timetableClassIds = new Set(teacherTimetable.map(t => t.classId).filter(Boolean));
      
      const normalizeName = (name: string) => {
        if (!name) return "";
        const n = name.trim();
        if (/^kg\s*ii$/i.test(n)) return "kg2";
        if (/^kg\s*i$/i.test(n)) return "kg1";
        return n.toLowerCase().replace(/^class\s+/i, "").trim();
      };
      
      const timetableClassNames = new Set(teacherTimetable.map(t => t.className ? normalizeName(t.className) : "").filter(Boolean));

      // 2. Filter subjects (directly assigned OR in timetable)
      subjects = subjects.filter(s => 
        s.assignedTeacherId === teacherProfile.id || timetableSubjectIds.has(s.id)
      );

      // 3. Filter classes (has assigned subjects OR matched classId/className from timetable)
      const classIdsFromSubjects = new Set(subjects.map(s => s.classId));
      classes = classes.filter(c => {
        const instituteMatch = !teacherInstitute || c.institute === teacherInstitute;
        const matchesClassId = classIdsFromSubjects.has(c.id) || timetableClassIds.has(c.id);
        const matchesClassName = timetableClassNames.has(normalizeName(c.name));
        return matchesClassId || (matchesClassName && instituteMatch);
      });
    } else {
      classes = [];
      subjects = [];
    }
  }
  
  let teacherId: string | undefined = undefined;
  if (session?.user?.id) {
    teacherId = session.user.id;
  }

  if (!metadata.success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-3xl border border-red-100 shadow-sm text-center">
          <p className="text-red-500 font-bold">Failed to load academic data. Please contact admin.</p>
        </div>
      </div>
    );
  }

  const backHref = session?.user?.role === "TEACHER" 
    ? "/office/academy-management/my-lesson-plans" 
    : "/office/academy-management/classes";

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={backHref}
              className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                Lesson Plan Management
              </h1>
              <p className="text-sm text-slate-500 font-medium">Create daily lesson plans and homework assignments</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="p-8 md:p-12">
            <LessonPlanForm 
              classes={classes} 
              subjects={subjects} 
              teacherId={teacherId}
              teacherName={teacherName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
