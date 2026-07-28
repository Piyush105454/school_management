import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { classes, subjects } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const className = searchParams.get("className");

    if (!className) {
      return NextResponse.json({ subjects: [] });
    }

    // Find the class by name
    const classRecord = await db.query.classes.findFirst({
      where: eq(classes.name, className),
    });

    if (!classRecord) {
      return NextResponse.json({ subjects: [] });
    }

    // Get all subjects for this class
    const classSubjects = await db.query.subjects.findMany({
      where: eq(subjects.classId, classRecord.id),
      columns: { name: true },
    });

    const subjectNames = classSubjects
      .map((s) => s.name)
      .filter(Boolean)
      .sort();

    return NextResponse.json({ subjects: subjectNames });
  } catch (error) {
    console.error("Error fetching class subjects:", error);
    return NextResponse.json({ subjects: [] }, { status: 500 });
  }
}
