import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students, studentBio, admissionMeta, classes, inquiries } from "@/db/schema";
import { eq, inArray, sql, like, or } from "drizzle-orm";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 0. Cleanup junk data from previous failed imports
    await db.delete(students).where(
      or(
        like(students.name, "CLASS %"),
        like(students.name, "Class %"),
        like(students.name, "undefined"),
        eq(students.name, "STUDENT NAME")
      )
    );

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet) as any[];

    const allClasses = await db.select().from(classes);
    const classMap = new Map();
    allClasses.forEach(c => {
      const name = c.name.toLowerCase().trim();
      classMap.set(name, c.id);
      classMap.set(`class ${name}`, c.id);
      if (name.startsWith("class ")) classMap.set(name.replace("class ", ""), c.id);
    });

    const excelAadhars = rows
      .map(r => String(r["Aadhar Card"] || r["Aadhar"] || "").trim())
      .filter(a => a.length > 0);

    if (excelAadhars.length === 0) {
      return NextResponse.json({ error: "No valid Aadhar numbers found in file" }, { status: 400 });
    }

    // Bulk fetch admission data
    const admissionData = await db
      .select({
        aadhar: studentBio.aadhaarNumber,
        entryNumber: admissionMeta.entryNumber,
        firstName: studentBio.firstName,
        lastName: studentBio.lastName,
        scholarNumber: admissionMeta.scholarNumber,
        appliedClass: inquiries.appliedClass,
      })
      .from(studentBio)
      .innerJoin(admissionMeta, eq(studentBio.admissionId, admissionMeta.id))
      .innerJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
      .where(inArray(studentBio.aadhaarNumber, excelAadhars));

    const admissionMap = new Map();
    admissionData.forEach(d => {
      if (d.aadhar) admissionMap.set(d.aadhar, d);
    });

    const toUpsert: any[] = [];
    const matchedNames: string[] = [];
    const skippedAadhars: string[] = [];

    for (const row of rows) {
      const aadhar = String(row["Aadhar Card"] || row["Aadhar"] || "").trim();
      const rollNo = String(row["Roll No"] || row["Roll Number"] || row["Roll"] || "").trim();
      const excelScholarNo = String(row["Scholar Number"] || row["Scholar No"] || row["Scholar"] || "").trim();

      const admissionMatch = admissionMap.get(aadhar);
      
      if (!admissionMatch || !rollNo) {
        if (aadhar) skippedAadhars.push(aadhar);
        continue;
      }

      const className = admissionMatch.appliedClass.toLowerCase().trim();
      const classId = classMap.get(className) || classMap.get(`class ${className}`) || classMap.get(className.replace("class ", ""));

      if (!classId) {
        skippedAadhars.push(`${aadhar} (Class ${className} not found)`);
        continue;
      }

      const studentName = `${admissionMatch.firstName} ${admissionMatch.lastName}`;
      toUpsert.push({
        studentId: admissionMatch.entryNumber,
        name: studentName,
        classId: classId,
        rollNumber: rollNo,
        scholarNumber: excelScholarNo || admissionMatch.scholarNumber,
      });
      matchedNames.push(`${studentName} (Roll: ${rollNo})`);
    }

    // 5. High-Speed Bulk Upsert (Single Query)
    if (toUpsert.length > 0) {
      // Postgres-specific bulk upsert
      await db.insert(students).values(toUpsert).onConflictDoUpdate({
        target: students.studentId,
        set: { 
          rollNumber: sql`EXCLUDED.roll_number`,
          scholarNumber: sql`EXCLUDED.scholar_number`,
          classId: sql`EXCLUDED.class_id`,
          name: sql`EXCLUDED.name`
        }
      });
    }

    const report = matchedNames.length > 0 
      ? `✅ Matched & Updated (${matchedNames.length}):\n${matchedNames.slice(0, 5).join("\n")}${matchedNames.length > 5 ? `\n...and ${matchedNames.length - 5} more` : ""}`
      : "No students were matched.";

    const skipReport = skippedAadhars.length > 0
      ? `\n\n❌ Skipped (${skippedAadhars.length}):\n${skippedAadhars.slice(0, 3).join("\n")}${skippedAadhars.length > 3 ? `\n...and ${skippedAadhars.length - 3} more` : ""}`
      : "";

    return NextResponse.json({ 
      success: true, 
      message: report + skipReport 
    });
  } catch (error: any) {
    console.error("Bulk Map Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
