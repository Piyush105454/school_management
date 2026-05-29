import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { studentProfiles, students, transportStudents, transportBuses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { protectRoute } from "@/lib/roleGuard";
import TransportStudentClient from "./TransportStudentClient";

export const dynamic = "force-dynamic";

export default async function StudentTransportPage() {
  // Enforce student role guard security
  await protectRoute(["STUDENT_PARENT"]);

  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  // 1. Resolve student profile via logged-in userId
  const profile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, session.user.id),
    with: {
      admissionMeta: true,
    },
  });

  if (!profile || !profile.admissionMeta) {
    return (
      <div className="p-8 text-center bg-white border border-slate-100 rounded-3xl space-y-4">
        <h2 className="text-xl font-black text-slate-800 uppercase">Profile Roster Missing</h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Your student profile has not been initialized yet. Please contact the administration.</p>
      </div>
    );
  }

  // 2. Fetch the academic student record
  const studentRecord = await db.query.students.findFirst({
    where: eq(students.studentId, profile.admissionMeta.entryNumber),
  });

  if (!studentRecord) {
    return (
      <div className="p-8 text-center bg-white border border-slate-100 rounded-3xl space-y-4">
        <h2 className="text-xl font-black text-slate-800 uppercase">Student Record Missing</h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Your academic student record was not found. Please contact the office.</p>
      </div>
    );
  }

  // 3. Query their active school bus assignment
  const transportAssignment = await db
    .select({
      id: transportStudents.id,
      routeStop: transportStudents.routeStop,
      locationName: transportStudents.locationName,
      latitude: transportStudents.latitude,
      longitude: transportStudents.longitude,
      busId: transportStudents.busId,
    })
    .from(transportStudents)
    .where(eq(transportStudents.studentId, studentRecord.id))
    .limit(1);

  let busRecord = null;
  if (transportAssignment.length > 0) {
    const busesList = await db
      .select()
      .from(transportBuses)
      .where(eq(transportBuses.id, transportAssignment[0].busId))
      .limit(1);

    if (busesList.length > 0) {
      busRecord = busesList[0];
    }
  }

  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      <TransportStudentClient 
        student={studentRecord} 
        assignment={transportAssignment[0] || null} 
        bus={busRecord} 
      />
    </div>
  );
}
