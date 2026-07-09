import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students, studentBio, admissionMeta } from "@/db/schema";
import { eq, ilike, and, inArray, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const classesParam = searchParams.get("classes");

    if (q.length < 2 && (!classesParam || classesParam === "ALL")) {
      return NextResponse.json([]);
    }

    let query = db.select({
      id: students.studentId,
      firstName: studentBio.firstName,
      lastName: studentBio.lastName,
      admissionNumber: admissionMeta.entryNumber,
      classId: students.classId,
    })
    .from(students)
    .innerJoin(admissionMeta, eq(students.studentId, admissionMeta.entryNumber))
    .innerJoin(studentBio, eq(admissionMeta.id, studentBio.admissionId));

    let conditions: any[] = [];
    
    if (q.length >= 2) {
      conditions.push(or(
        ilike(studentBio.firstName, `%${q}%`),
        ilike(studentBio.lastName, `%${q}%`)
      ));
    }

    if (classesParam && classesParam !== "ALL") {
      const classIds = classesParam.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (classIds.length > 0) {
        conditions.push(inArray(students.classId, classIds));
      }
    }

    query = query.where(and(...conditions)).limit(20);

    const results = await query;
    return NextResponse.json(results.map(r => ({
      id: r.id,
      name: `${r.firstName} ${r.lastName} (${r.admissionNumber})`,
    })));

  } catch (error: any) {
    console.error("Student Search Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
