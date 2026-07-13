import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { classes, students, users, projects, studentProfiles } from "@/db/schema";
import { eq, inArray, isNotNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (type === "institutes") {
      // Get unique institutes from classes
      const allClasses = await db.query.classes.findMany({
        columns: { institute: true },
        where: isNotNull(classes.institute)
      });
      const institutes = Array.from(new Set(allClasses.map(c => c.institute).filter(Boolean)));
      return NextResponse.json({ institutes });
    }

    if (type === "classes") {
      const institute = searchParams.get("institute");
      if (!institute) return NextResponse.json({ classes: [] });
      
      const instituteClasses = await db.query.classes.findMany({
        where: eq(classes.institute, institute),
        orderBy: (classes, { asc }) => [asc(classes.name)]
      });
      return NextResponse.json({ classes: instituteClasses });
    }

    if (type === "students") {
      const classId = searchParams.get("classId");
      if (!classId) return NextResponse.json({ students: [] });
      
      const classStudents = await db.query.students.findMany({
        where: eq(students.classId, parseInt(classId)),
        with: {
          profile: true
        }
      });
      return NextResponse.json({ students: classStudents });
    }

    if (type === "users") {
      // Return users that can be assigned tasks (Teachers, Coordinators, Admins)
      const assignableUsers = await db.query.users.findMany({
        where: inArray(users.role, ["TEACHER", "OFFICE", "PRINCIPAL", "ADMIN"]),
        columns: { id: true, email: true, role: true }
      });
      return NextResponse.json({ users: assignableUsers });
    }

    if (type === "projects") {
      const activeProjects = await db.query.projects.findMany({
        where: eq(projects.status, "ACTIVE"),
        columns: { id: true, name: true }
      });
      return NextResponse.json({ projects: activeProjects });
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });

  } catch (error) {
    console.error("Error fetching form options:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
