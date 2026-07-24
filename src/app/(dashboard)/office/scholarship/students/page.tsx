import { protectRoute } from "@/lib/roleGuard";
import StudentsClient from "./StudentsClient";
import { db } from "@/db";
import { teachers, classes } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function StudentsPage(props: {
  searchParams: Promise<{ institute?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await protectRoute(["OFFICE"], "/office/scholarship/students");
  
  let selectedInstitute = searchParams.institute;
  if (session?.user?.role === "PRINCIPAL" && session.user.institute) {
    selectedInstitute = session.user.institute; // Force override for principals
  } else if (!selectedInstitute && session?.user?.institute) {
    selectedInstitute = session.user.institute;
  }

  // Fetch classes from database based on institute
  let dbClasses = await db.select().from(classes);
  
  // Filter by institute if selected
  if (selectedInstitute && selectedInstitute !== "ALL") {
    dbClasses = dbClasses.filter(c => c.institute === selectedInstitute);
  }
  
  let classesList = dbClasses.map(c => c.name);
  
  if (session && session.user.role === "TEACHER") {
    const teacherProfile = await db.query.teachers.findFirst({
      where: eq(teachers.userId, session.user.id),
    });
    if (teacherProfile && teacherProfile.classAssigned) {
      const assigned = teacherProfile.classAssigned
        .split(",")
        .map((c) => c.trim());
      
      classesList = classesList.filter((clsName) => {
        return assigned.includes(clsName);
      });
    } else {
      classesList = [];
    }
  }

  return <StudentsClient classesList={classesList} />;
}
