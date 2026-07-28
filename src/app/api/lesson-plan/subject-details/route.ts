import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects, classes, chapters, teachers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const className = searchParams.get("className");
    const subjectName = searchParams.get("subjectName");

    if (!className || !subjectName) {
      return NextResponse.json(
        { error: "className and subjectName are required" },
        { status: 400 }
      );
    }

    // Find the class
    const classRecord = await db.query.classes.findFirst({
      where: eq(classes.name, className),
    });

    if (!classRecord) {
      return NextResponse.json(
        {
          reviewer1Name: "NA",
          reviewer2Name: "NA",
          chapters: [],
        },
        { status: 200 }
      );
    }

    // Find the subject
    const subjectRecord = await db.query.subjects.findFirst({
      where: and(
        eq(subjects.name, subjectName),
        eq(subjects.classId, classRecord.id)
      ),
    });

    if (!subjectRecord) {
      return NextResponse.json(
        {
          reviewer1Name: "NA",
          reviewer2Name: "NA",
          chapters: [],
        },
        { status: 200 }
      );
    }

    // Get reviewer names
    let reviewer1Name = "NA";
    let reviewer2Name = "NA";

    if (subjectRecord.reviewerId1) {
      const reviewer1 = await db.query.teachers.findFirst({
        where: eq(teachers.id, subjectRecord.reviewerId1),
      });
      if (reviewer1) {
        reviewer1Name = reviewer1.name;
      }
    }

    if (subjectRecord.reviewerId2) {
      const reviewer2 = await db.query.teachers.findFirst({
        where: eq(teachers.id, subjectRecord.reviewerId2),
      });
      if (reviewer2) {
        reviewer2Name = reviewer2.name;
      }
    }

    // Get chapters for this subject
    const chapterRecords = await db.query.chapters.findMany({
      where: eq(chapters.subjectId, subjectRecord.id),
    });

    const chaptersData = chapterRecords.map((ch) => ({
      id: ch.id,
      chapterNo: ch.chapterNo,
      name: ch.name,
      pageStart: ch.pageStart,
      pageEnd: ch.pageEnd,
    }));

    return NextResponse.json(
      {
        reviewer1Name,
        reviewer2Name,
        chapters: chaptersData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching subject details:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch subject details" },
      { status: 500 }
    );
  }
}
