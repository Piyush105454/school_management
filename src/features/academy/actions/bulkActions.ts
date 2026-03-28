"use server";

import { db } from "@/db";
import { units, chapters, chapterPdfs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface BulkImportRow {
  unitName: string;
  unitOrder: number;
  chapterName: string;
  chapterNo: number;
  pageStart?: number;
  pageEnd?: number;
  pdfUrl?: string; // Google Drive link or other
}

export async function bulkImportAcademyData(subjectId: number, rows: BulkImportRow[]) {
  try {
    // 1. Group by unit
    const unitGroups = new Map<string, BulkImportRow[]>();
    rows.forEach(row => {
      const key = row.unitName || "NA";
      if (!unitGroups.has(key)) unitGroups.set(key, []);
      unitGroups.get(key)!.push(row);
    });

    for (const [unitName, chapterRows] of unitGroups.entries()) {
      // Find or create unit
      let unitId: number;
      const existingUnit = await db.query.units.findFirst({
        where: and(eq(units.subjectId, subjectId), eq(units.name, unitName)),
      });

      if (existingUnit) {
        unitId = existingUnit.id;
      } else {
        const unitOrder = chapterRows[0].unitOrder || 0;
        const [newUnit] = await db.insert(units).values({
          subjectId,
          name: unitName,
          orderNo: unitOrder,
        }).returning({ id: units.id });
        unitId = newUnit.id;
      }

      // Create chapters
      for (const row of chapterRows) {
        const [newChapter] = await db.insert(chapters).values({
          unitId,
          name: row.chapterName,
          chapterNo: row.chapterNo,
          pageStart: row.pageStart || 0,
          pageEnd: row.pageEnd || 0,
          orderNo: row.chapterNo, // Default order to chapter number
        }).returning({ id: chapters.id });

        if (row.pdfUrl) {
          await db.insert(chapterPdfs).values({
            chapterId: newChapter.id,
            fileUrl: row.pdfUrl,
            uploadedBy: "Bulk Import",
          });
        }
      }
    }

    revalidatePath("/office/academy-management/classes/[className]/subjects/[subjectId]", "page");
    return { success: true };
  } catch (error: any) {
    console.error("bulkImportAcademyData error:", error);
    return { success: false, error: error.message };
  }
}
