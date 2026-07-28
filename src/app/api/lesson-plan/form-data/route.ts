import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects, classes, chapters, chapterDivisions, teachers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Consolidated API endpoint to fetch all form data needed for lesson plan step 1
 * Returns chapters with their divisions for proper page range handling
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const className = searchParams.get("className");
    const subjectName = searchParams.get("subjectName");

    // Default response structure
    const response: any = {
      reviewer1Name: "NA",
      reviewer2Name: "NA",
      approverName: "NA",
      chapters: [],
    };

    // If className is provided, fetch class and approver
    if (className) {
      const classRecord = await db.query.classes.findFirst({
        where: eq(classes.name, className),
      });

      if (classRecord) {
        // Find the principal/approver for this class's institute
        const approver = await db.query.teachers.findFirst({
          where: eq(teachers.institute, classRecord.institute || ""),
        });
        
        if (approver?.assignedRole === "PRINCIPAL" || approver?.role === "PRINCIPAL") {
          response.approverName = approver.name;
        } else if (approver) {
          response.approverName = approver.name;
        }

        // If both className and subjectName provided, fetch subject details
        if (subjectName) {
          const subjectRecord = await db.query.subjects.findFirst({
            where: and(
              eq(subjects.name, subjectName),
              eq(subjects.classId, classRecord.id)
            ),
          });

          if (subjectRecord) {
            // Get reviewer names
            if (subjectRecord.reviewerId1) {
              const reviewer1 = await db.query.teachers.findFirst({
                where: eq(teachers.id, subjectRecord.reviewerId1),
              });
              if (reviewer1) {
                response.reviewer1Name = reviewer1.name;
              }
            }

            if (subjectRecord.reviewerId2) {
              const reviewer2 = await db.query.teachers.findFirst({
                where: eq(teachers.id, subjectRecord.reviewerId2),
              });
              if (reviewer2) {
                response.reviewer2Name = reviewer2.name;
              }
            }

            // Get chapters for this subject
            const chapterRecords = await db.query.chapters.findMany({
              where: eq(chapters.subjectId, subjectRecord.id),
            });

            // For each chapter, fetch its divisions
            const chaptersWithDivisions = await Promise.all(
              chapterRecords.map(async (ch) => {
                const divisionsRecords = await db.query.chapterDivisions.findMany({
                  where: eq(chapterDivisions.chapterId, ch.id),
                });

                return {
                  id: ch.id,
                  chapterNo: ch.chapterNo,
                  name: ch.name,
                  pageStart: ch.pageStart,
                  pageEnd: ch.pageEnd,
                  divisions: divisionsRecords.map((div) => ({
                    id: div.id,
                    pageStart: div.pageStart,
                    pageEnd: div.pageEnd,
                    orderNo: div.orderNo,
                  })),
                };
              })
            );

            response.chapters = chaptersWithDivisions;
          }
        }
      }
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
