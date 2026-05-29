import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, teachers, students, classes, studentProfiles, admissionMeta } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    if (!role) {
      return NextResponse.json({ error: "Missing role parameter" }, { status: 400 });
    }

    if (role === "TEACHER") {
      const teacherList = await db
        .select({
          userId: teachers.userId,
          name: teachers.name,
        })
        .from(teachers);
      return NextResponse.json(teacherList);
    }

    if (role === "PRINCIPAL") {
      const principalList = await db
        .select({
          userId: users.id,
          name: users.email,
        })
        .from(users)
        .where(eq(users.role, "PRINCIPAL"));
      return NextResponse.json(principalList);
    }

    if (role === "OFFICE") {
      const officeList = await db
        .select({
          userId: users.id,
          name: users.email,
        })
        .from(users)
        .where(eq(users.role, "OFFICE"));
      return NextResponse.json(officeList);
    }

    if (role === "ADMIN") {
      const adminList = await db
        .select({
          userId: users.id,
          name: users.email,
        })
        .from(users)
        .where(eq(users.role, "ADMIN"));
      return NextResponse.json(adminList);
    }

    if (role === "STUDENT_PARENT") {
      const classIdStr = searchParams.get("classId");
      if (!classIdStr) {
        // Return classes
        const classesList = await db.select().from(classes).orderBy(classes.name);
        return NextResponse.json({ classes: classesList });
      }

      const classId = parseInt(classIdStr);
      const studentList = await db
        .select({
          userId: studentProfiles.userId,
          name: students.name,
          studentId: students.studentId,
        })
        .from(students)
        .innerJoin(admissionMeta, eq(students.studentId, admissionMeta.entryNumber))
        .innerJoin(studentProfiles, eq(admissionMeta.id, studentProfiles.admissionMetaId))
        .where(eq(students.classId, classId));

      return NextResponse.json({ students: studentList });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in fetch users api:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
