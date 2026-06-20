export const dynamic = "force-dynamic";

import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { protectRoute } from "@/lib/roleGuard";
import TimetableClient from "./TimetableClient";
import { db } from "@/db";
import { teachers } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ institute?: string }>;
}) {
  // Allow OFFICE, PRINCIPAL, ADMIN, and TEACHER roles (with dynamic DB override check)
  await protectRoute(["OFFICE", "PRINCIPAL", "ADMIN", "TEACHER"], "/office/timetable");

  const resolvedSearchParams = await searchParams;
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role || "TEACHER";

  let initialInstitute = resolvedSearchParams.institute || "";
  if (!initialInstitute && session?.user?.id) {
    const teacherProfile = await db.query.teachers.findFirst({
      where: eq(teachers.userId, session.user.id),
    });
    if (teacherProfile?.institute) {
      initialInstitute = teacherProfile.institute;
    }
  }

  if (!initialInstitute) {
    initialInstitute = "Dhanpuri Public School";
  }

  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      <TimetableClient userRole={userRole} initialInstitute={initialInstitute} />
    </div>
  );
}
