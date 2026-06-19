export const dynamic = "force-dynamic";

import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { protectRoute } from "@/lib/roleGuard";
import TimetableClient from "../../office/timetable/TimetableClient";

export default async function TeacherTimetablePage() {
  // Protect route for TEACHER role (with optional dynamic DB override check)
  await protectRoute(["TEACHER"], "/teacher/timetable");

  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role || "TEACHER";

  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      <TimetableClient userRole={userRole} />
    </div>
  );
}
