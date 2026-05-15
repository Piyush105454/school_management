import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { studentProfiles, admissionMeta, students, studentAttendance } from "@/db/schema";
import { redirect } from "next/navigation";
import AttendanceClient from "./AttendanceClient";

export default async function StudentAttendancePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const results = await db
    .select({
      id: studentProfiles.admissionMetaId,
      entryNumber: admissionMeta.entryNumber
    })
    .from(studentProfiles)
    .innerJoin(admissionMeta, eq(studentProfiles.admissionMetaId, admissionMeta.id))
    .where(eq(studentProfiles.userId, session.user.id))
    .limit(1);

  if (!results.length || !results[0].entryNumber) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm max-w-sm">
            <h2 className="text-2xl font-black text-slate-900">No Profile Found</h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">Please complete your admission process first.</p>
        </div>
      </div>
    );
  }

  const student = await db.query.students.findFirst({
    where: eq(students.studentId, results[0].entryNumber)
  });

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm max-w-sm">
            <h2 className="text-2xl font-black text-slate-900">Academic Record Pending</h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">Your academic profile is being synchronized. Please check back later.</p>
        </div>
      </div>
    );
  }

  const attendanceData = await db.select().from(studentAttendance)
    .where(eq(studentAttendance.studentId, student.id));

  return <AttendanceClient initialData={attendanceData as any} />;
}
