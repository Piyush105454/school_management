"use server";

import { db } from "@/db";
import { units, chapters, chapterPdfs, classes, subjects } from "@/db/schema";
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

export interface GlobalBulkImportRow extends BulkImportRow {
  className: string;
  subjectName: string;
}

function normalizeAcademicName(name: string) {
  return name.toLowerCase().replace(/^(class|grade|standard|std)\s+/i, '').trim();
}

async function importSubjectData(tx: any, subjectId: number, rows: BulkImportRow[], clearExisting = false) {
  // If clearExisting is true, we wipe units for this subject (cascades to chapters, pdfs)
  if (clearExisting) {
    await tx.delete(units).where(eq(units.subjectId, subjectId));
  }

  // Pre-fetch everything for this subject in one heavy query
  const existingUnits = clearExisting ? [] : await tx.query.units.findMany({
    where: eq(units.subjectId, subjectId),
    with: {
      chapters: {
        with: {
          chapterPdfs: true
        }
      }
    }
  });

  // Stats
  let created = 0;
  let updated = 0;

  // Group rows by unit
  const unitGroups = new Map<string, BulkImportRow[]>();
  rows.forEach(row => {
    const key = row.unitName || "NA";
    if (!unitGroups.has(key)) unitGroups.set(key, []);
    unitGroups.get(key)!.push(row);
  });

  for (const [unitName, chapterRows] of unitGroups.entries()) {
    let currentUnit = existingUnits.find((u: any) => normalizeAcademicName(u.name) === normalizeAcademicName(unitName));
    let unitId: number;
    const unitOrder = chapterRows[0].unitOrder || 0;

    if (currentUnit) {
      unitId = currentUnit.id;
      if (unitOrder && currentUnit.orderNo !== unitOrder) {
        await tx.update(units).set({ orderNo: unitOrder }).where(eq(units.id, unitId));
      }
    } else {
      const [newUnit] = await tx.insert(units).values({
        subjectId,
        name: unitName,
        orderNo: unitOrder,
      }).returning({ id: units.id });
      unitId = newUnit.id;
      currentUnit = { id: unitId, name: unitName, orderNo: unitOrder, subjectId, chapters: [] };
    }

    // Now, split chapterRows into "toInsert" and "toUpdate"
    const chaptersToInsert: any[] = [];
    const pdfsToInsert: any[] = [];

    for (const row of chapterRows) {
      const existingChapter = currentUnit?.chapters?.find((c: any) => 
        normalizeAcademicName(c.name) === normalizeAcademicName(row.chapterName) || 
        c.chapterNo === row.chapterNo
      );
      
      if (existingChapter) {
        // Update check
        const needsUpdate = 
          existingChapter.name !== row.chapterName || 
          existingChapter.pageStart !== (row.pageStart || 0) || 
          existingChapter.pageEnd !== (row.pageEnd || 0);

        if (needsUpdate) {
          await tx.update(chapters).set({
            name: row.chapterName,
            pageStart: row.pageStart || 0,
            pageEnd: row.pageEnd || 0,
            orderNo: row.chapterNo,
          }).where(eq(chapters.id, existingChapter.id));
          updated++;
        }

        const existingPdf = (existingChapter as any)?.chapterPdfs?.[0];
        if (row.pdfUrl) {
          if (existingPdf) {
            if (existingPdf.fileUrl !== row.pdfUrl) {
              await tx.update(chapterPdfs).set({ fileUrl: row.pdfUrl, uploadedBy: "Bulk Update" }).where(eq(chapterPdfs.id, existingPdf.id));
            }
          } else {
            pdfsToInsert.push({ chapterId: existingChapter.id, fileUrl: row.pdfUrl, uploadedBy: "Bulk Import" });
          }
        }
      } else {
        chaptersToInsert.push({
          unitId,
          name: row.chapterName,
          chapterNo: row.chapterNo,
          pageStart: row.pageStart || 0,
          pageEnd: row.pageEnd || 0,
          orderNo: row.chapterNo,
          _pdfUrl: row.pdfUrl 
        });
      }
    }

    if (chaptersToInsert.length > 0) {
      const newChapters = await tx.insert(chapters).values(
        chaptersToInsert.map(({ _pdfUrl, ...rest }) => rest)
      ).returning({ id: chapters.id });
      
      created += newChapters.length;

      newChapters.forEach((nc: any, idx: number) => {
        const pdfUrl = chaptersToInsert[idx]._pdfUrl;
        if (pdfUrl) {
          pdfsToInsert.push({
            chapterId: nc.id,
            fileUrl: pdfUrl,
            uploadedBy: "Bulk Import"
          });
        }
      });
    }

    if (pdfsToInsert.length > 0) {
      await tx.insert(chapterPdfs).values(pdfsToInsert);
    }
  }

  return { created, updated };
}

export async function bulkImportAcademyData(subjectId: number, rows: BulkImportRow[]) {
  try {
    const stats = await db.transaction(async (tx) => {
      return await importSubjectData(tx, subjectId, rows);
    });
    revalidatePath("/office/academy-management/classes/[className]/subjects/[subjectId]", "page");
    return { success: true, stats };
  } catch (error: any) {
    console.error("bulkImportAcademyData error:", error);
    return { success: false, error: error.message };
  }
}

export async function globalBulkImportAcademyData(rows: GlobalBulkImportRow[], clearExisting = false) {
  try {
    const totalStats = { created: 0, updated: 0 };
    
    // Pre-fetch all classes to avoid name mismatches
    const allClasses = await db.select().from(classes);

    // Grouping by Class and Subject first
    const groupedData = new Map<string, Map<string, GlobalBulkImportRow[]>>();
    
    rows.forEach(row => {
      const className = row.className || "Unknown";
      const subjectName = row.subjectName || "Unknown";
      
      if (!groupedData.has(className)) {
        groupedData.set(className, new Map());
      }
      
      const subjectMap = groupedData.get(className)!;
      if (!subjectMap.has(subjectName)) {
        subjectMap.set(subjectName, []);
      }
      
      subjectMap.get(subjectName)!.push(row);
    });

    // Process each class and subject
    // We do subjects one by one with their own transactions to avoid locking the whole DB
    // and to handle large datasets more reliably.
    for (const [className, subjectsMap] of groupedData.entries()) {
      let classId: number;
      const matchedClass = allClasses.find(c => 
        normalizeAcademicName(c.name) === normalizeAcademicName(className)
      );

      if (matchedClass) {
        classId = matchedClass.id;
      } else {
        const derivedGrade = parseInt(normalizeAcademicName(className)) || 0;
        const [newClass] = await db.insert(classes).values({ 
          name: className,
          grade: derivedGrade
        }).returning({ id: classes.id });
        classId = newClass.id;
        allClasses.push({ id: classId, name: className, grade: derivedGrade });
      }

      // Fetch subjects for this class
      const allSubjectsForClass = await db.select().from(subjects).where(eq(subjects.classId, classId));

      for (const [subjectName, subjectRows] of subjectsMap.entries()) {
        let subjectId: number;
        const matchedSubject = allSubjectsForClass.find(s => 
          normalizeAcademicName(s.name) === normalizeAcademicName(subjectName)
        );

        if (matchedSubject) {
          subjectId = matchedSubject.id;
        } else {
          const [newSubject] = await db.insert(subjects).values({
            classId,
            name: subjectName,
            medium: "English/Hindi"
          }).returning({ id: subjects.id });
          subjectId = newSubject.id;
          allSubjectsForClass.push({ id: subjectId, classId, name: subjectName, medium: "English/Hindi" });
        }

        // Run transaction PER SUBJECT
        const res = await db.transaction(async (tx) => {
          return await importSubjectData(tx, subjectId, subjectRows, clearExisting);
        });
        
        totalStats.created += res.created;
        totalStats.updated += res.updated;
      }
    }

    revalidatePath("/office/academy-management/classes", "page");
    return { success: true, stats: totalStats };
  } catch (error: any) {
    console.error("globalBulkImportAcademyData error:", error);
    return { success: false, error: error.message };
  }
}

