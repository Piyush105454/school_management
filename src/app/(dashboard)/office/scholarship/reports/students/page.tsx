import { protectRoute } from "@/lib/roleGuard";
import { db } from "@/db";
import { teachers } from "@/db/schema";
import { eq } from "drizzle-orm";
import StudentReportsClient from "./StudentReportsClient";

export default async function StudentReportsPage() {
  const session = await protectRoute(["OFFICE"], "/office/scholarship/reports/students");
  
  let classesList = ["KG1", "KG2", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  let limitToClasses: string[] | undefined = undefined;

  if (session && session.user.role === "TEACHER") {
    const teacherProfile = await db.query.teachers.findFirst({
      where: eq(teachers.userId, session.user.id),
    });
    if (teacherProfile && teacherProfile.classAssigned) {
      const assigned = teacherProfile.classAssigned
        .split(",")
        .map((c) => c.trim().toLowerCase());
      
      limitToClasses = classesList.filter((clsName) => {
        return assigned.some((a) => {
          const cleanA = a.replace(/^class\s+/i, "");
          const cleanCls = clsName.toLowerCase().replace(/^class\s+/i, "");
          return cleanA === cleanCls;
        });
      });
    } else {
      limitToClasses = [];
    }
  }

  return <StudentReportsClient classesList={classesList} limitToClasses={limitToClasses} />;
}
