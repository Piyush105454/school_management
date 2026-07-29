import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { classes, teachers, students, studentBio, admissionMeta } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * High-performance consolidated API endpoint for lesson plan step 1 data & class student roster.
 * Fetches approver, subject options, reviewer names, chapters, divisions and class students
 * in a single database query.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const className = searchParams.get("className");
    const subjectName = searchParams.get("subjectName");

    const response: any = {
      reviewer1Name: "NA",
      reviewer2Name: "NA",
      approverName: "NA",
      chapters: [],
      subjects: [],
      students: [],
    };

    if (!className) {
      return NextResponse.json(response, { status: 200 });
    }

    // Relational query for class
    let classRecord = await db.query.classes.findFirst({
      where: eq(classes.name, className),
      with: {
        subjects: {
          with: {
            reviewer1: true,
            reviewer2: true,
            chapters: {
              with: {
                divisions: true,
              },
            },
          },
        },
      },
    });

    // Fallback: Case-insensitive match if exact match returned nothing
    if (!classRecord) {
      const allClasses = await db.query.classes.findMany({
        with: {
          subjects: {
            with: {
              reviewer1: true,
              reviewer2: true,
              chapters: {
                with: {
                  divisions: true,
                },
              },
            },
          },
        },
      });
      classRecord = allClasses.find(
        (c) =>
          c.name.trim().toLowerCase() === className.trim().toLowerCase() ||
          c.name.toLowerCase().includes(className.toLowerCase()) ||
          className.toLowerCase().includes(c.name.toLowerCase())
      );
    }

    if (classRecord) {
      // Find approver for this institute
      const approver = await db.query.teachers.findFirst({
        where: eq(teachers.institute, classRecord.institute || ""),
      });
      if (approver?.name) {
        response.approverName = approver.name;
      }

      // Collect subject names for dropdown
      response.subjects = (classRecord.subjects || [])
        .map((s) => s.name)
        .filter(Boolean)
        .sort();

      // Fetch class students directly from students table
      const classStudents = await db
        .select({
          id: students.id,
          name: students.name,
          rollNumber: students.rollNumber,
        })
        .from(students)
        .where(eq(students.classId, classRecord.id));

      response.students = classStudents
        .map((s) => ({
          id: s.id,
          name: s.name ? s.name.trim() : `Student #${s.id}`,
        }))
        .filter((s) => s.name.length > 0)
        .sort((a, b) => a.name.localeCompare(b.name));

      // If subjectName provided, pick matching subject details
      if (subjectName && classRecord.subjects) {
        const subjectRecord = classRecord.subjects.find(
          (s) => s.name.toLowerCase() === subjectName.toLowerCase()
        );
        if (subjectRecord) {
          if (subjectRecord.reviewer1?.name) {
            response.reviewer1Name = subjectRecord.reviewer1.name;
          }
          if (subjectRecord.reviewer2?.name) {
            response.reviewer2Name = subjectRecord.reviewer2.name;
          }

          response.chapters = (subjectRecord.chapters || [])
            .sort((a, b) => (parseInt(String(a.chapterNo)) || 0) - (parseInt(String(b.chapterNo)) || 0))
            .map((ch) => ({
              id: ch.id,
              chapterNo: ch.chapterNo,
              name: ch.name,
              pageStart: ch.pageStart,
              pageEnd: ch.pageEnd,
              divisions: (ch.divisions || [])
                .sort((a, b) => (a.orderNo || 0) - (b.orderNo || 0))
                .map((div) => ({
                  id: div.id,
                  pageStart: div.pageStart,
                  pageEnd: div.pageEnd,
                  orderNo: div.orderNo,
                })),
            }));
        }
      }
    } else {
      // If no class found, load all students as fallback list so dropdown is never empty
      const allStudents = await db
        .select({
          id: students.id,
          name: students.name,
        })
        .from(students)
        .limit(100);

      response.students = allStudents
        .map((s) => ({
          id: s.id,
          name: s.name ? s.name.trim() : `Student #${s.id}`,
        }))
        .filter((s) => s.name.length > 0)
        .sort((a, b) => a.name.localeCompare(b.name));
    }


    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching form data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch form data" },
      { status: 500 }
    );
  }
}


