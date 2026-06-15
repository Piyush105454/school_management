import LessonPlanForm from "@/features/academy/components/LessonPlanForm";
import { BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getAllAcademicMetadata } from "@/features/academy/actions/academyActions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { teachers } from "@/db/schema";
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

  if (session?.user?.role === "TEACHER") {
    const teacherProfile = await db.query.teachers.findFirst({
      where: eq(teachers.userId, session.user.id),
    });

    if (teacherProfile) {
      const teacherInstitute = teacherProfile.institute;

      // Filter subjects directly assigned to this teacher
      subjects = subjects.filter(s => s.assignedTeacherId === teacherProfile.id);

      // Filter classes to only include those that have assigned subjects
      const classIds = subjects.map(s => s.classId);
      classes = classes.filter(c => {
        const instituteMatch = !teacherInstitute || c.institute === teacherInstitute;
        return instituteMatch && classIds.includes(c.id);
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/office/academy-management/classes"
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
