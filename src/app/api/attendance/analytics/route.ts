export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studentAttendance, students, classes, studentBio, parentGuardianDetails, admissionMeta } from "@/db/schema";
import { eq, and, inArray, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const monthsParam = searchParams.get("months"); // e.g. "April,May"
    const year = searchParams.get("year");
    const classesParam = searchParams.get("classes");
    const studentIdsParam = searchParams.get("studentIds"); // e.g. "uuid1,uuid2"
    const gender = searchParams.get("gender");
    const religion = searchParams.get("religion");
    const occupation = searchParams.get("occupation");
    const institute = searchParams.get("institute");

    if (!monthsParam || !year) {
      return NextResponse.json({ error: "Missing months or year" }, { status: 400 });
    }

    const monthsList = monthsParam.split(",").map(m => m.trim());

    // Base conditions for studentAttendance
    const attendanceConditions = [
      inArray(studentAttendance.month, monthsList),
      eq(studentAttendance.year, parseInt(year)),
    ];

    if (classesParam && classesParam !== "ALL") {
      const classIds = classesParam.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (classIds.length > 0) {
        attendanceConditions.push(inArray(studentAttendance.classId, classIds));
      }
    }
    
    let specificStudents = false;
    if (studentIdsParam && studentIdsParam.trim().length > 0) {
      const studentIds = studentIdsParam.split(",").map(id => id.trim()).filter(id => id.length > 0);
      if (studentIds.length > 0) {
        attendanceConditions.push(inArray(studentAttendance.studentId, studentIds));
        specificStudents = true;
      }
    }

    // Build query - ALWAYS join studentBio to get gender and name
    let query = db.select({
      classId: classes.id,
      className: classes.name,
      grade: classes.grade,
      status: studentAttendance.status,
      gender: studentBio.gender,
      studentId: students.id,
      firstName: studentBio.firstName,
      lastName: studentBio.lastName,
    })
    .from(studentAttendance)
    .innerJoin(classes, eq(studentAttendance.classId, classes.id))
    .innerJoin(students, eq(studentAttendance.studentId, students.id))
    .innerJoin(admissionMeta, eq(students.studentId, admissionMeta.entryNumber))
    .innerJoin(studentBio, eq(admissionMeta.id, studentBio.admissionId));

    let dynamicWheres: any[] = [];

    if (institute && institute !== "ALL") {
      dynamicWheres.push(eq(classes.institute, institute));
    }

    if (gender && gender !== "ALL" && gender !== "COMPARE") {
      const dbGender = gender === "Male" ? "M" : gender === "Female" ? "F" : "O";
      dynamicWheres.push(eq(studentBio.gender, dbGender));
    }
    if (religion && religion !== "ALL") {
      dynamicWheres.push(eq(studentBio.religion, religion));
    }

    if (occupation && occupation !== "ALL") {
      query = query.innerJoin(parentGuardianDetails, eq(admissionMeta.id, parentGuardianDetails.admissionId));
      dynamicWheres.push(eq(parentGuardianDetails.occupation, occupation));
    }

    // Apply conditions
    query = query.where(and(...attendanceConditions, ...dynamicWheres));

    const rawRecords = await query;
    const calcPct = (present: number, total: number) => total > 0 ? Math.round((present / total) * 100) : 0;

    if (specificStudents) {
      // Aggregate by student instead of class
      const studentMap = new Map();
      for (const record of rawRecords) {
        if (!studentMap.has(record.studentId)) {
          studentMap.set(record.studentId, {
            studentId: record.studentId,
            name: `${record.firstName} ${record.lastName}`,
            className: record.className,
            gender: record.gender,
            total: 0,
            present: 0
          });
        }
        const stat = studentMap.get(record.studentId);
        stat.total++;
        if (record.status === 'P' || record.status === 'HD' || record.status === 'ML') {
          stat.present++;
        }
      }

      const studentsData = Array.from(studentMap.values()).map(stat => ({
        ...stat,
        attendancePct: calcPct(stat.present, stat.total)
      }));

      return NextResponse.json({
        type: 'students',
        students: studentsData
      });
    }

    // Otherwise Aggregate by Class
    const classMap = new Map();
    let totalOverall = 0;
    let presentOverall = 0;
    let totalMaleOverall = 0;
    let presentMaleOverall = 0;
    let totalFemaleOverall = 0;
    let presentFemaleOverall = 0;
    
    // For primary group
    let totalPrimary = 0;
    let presentPrimary = 0;
    let totalMalePrimary = 0;
    let presentMalePrimary = 0;
    let totalFemalePrimary = 0;
    let presentFemalePrimary = 0;

    for (const record of rawRecords) {
      if (!classMap.has(record.classId)) {
        classMap.set(record.classId, {
          classId: record.classId,
          className: record.className,
          grade: record.grade,
          total: 0,
          present: 0,
          totalMale: 0,
          presentMale: 0,
          totalFemale: 0,
          presentFemale: 0
        });
      }
      
      const stat = classMap.get(record.classId);
      
      const isPresent = record.status === 'P' || record.status === 'HD' || record.status === 'ML';
      const isMale = record.gender === 'M';
      const isFemale = record.gender === 'F';
      const isPrimary = record.grade >= 1 && record.grade <= 5;

      // Class aggregations
      stat.total++;
      if (isPresent) stat.present++;
      
      if (isMale) {
        stat.totalMale++;
        if (isPresent) stat.presentMale++;
      } else if (isFemale) {
        stat.totalFemale++;
        if (isPresent) stat.presentFemale++;
      }

      // Overall aggregations
      totalOverall++;
      if (isPresent) presentOverall++;
      
      if (isMale) {
        totalMaleOverall++;
        if (isPresent) presentMaleOverall++;
      } else if (isFemale) {
        totalFemaleOverall++;
        if (isPresent) presentFemaleOverall++;
      }
      
      // Primary aggregations
      if (isPrimary) {
        totalPrimary++;
        if (isPresent) presentPrimary++;
        if (isMale) {
          totalMalePrimary++;
          if (isPresent) presentMalePrimary++;
        } else if (isFemale) {
          totalFemalePrimary++;
          if (isPresent) presentFemalePrimary++;
        }
      }
    }

    // Male/Female pct relative to the ENTIRE group total so they stack correctly.
    const calcStackedMalePct = (presentMale: number, totalGroup: number) => totalGroup > 0 ? Math.round((presentMale / totalGroup) * 100) : 0;
    const calcStackedFemalePct = (presentFemale: number, totalGroup: number) => totalGroup > 0 ? Math.round((presentFemale / totalGroup) * 100) : 0;

    const classStats = Array.from(classMap.values()).map(stat => ({
      ...stat,
      attendancePct: calcPct(stat.present, stat.total),
      malePct: calcStackedMalePct(stat.presentMale, stat.total),
      femalePct: calcStackedFemalePct(stat.presentFemale, stat.total)
    })).sort((a, b) => a.grade - b.grade);

    return NextResponse.json({
      type: 'classes',
      overall: {
        total: totalOverall,
        present: presentOverall,
        pct: calcPct(presentOverall, totalOverall),
        malePct: calcStackedMalePct(presentMaleOverall, totalOverall),
        femalePct: calcStackedFemalePct(presentFemaleOverall, totalOverall)
      },
      primary: {
        total: totalPrimary,
        present: presentPrimary,
        pct: calcPct(presentPrimary, totalPrimary),
        malePct: calcStackedMalePct(presentMalePrimary, totalPrimary),
        femalePct: calcStackedFemalePct(presentFemalePrimary, totalPrimary)
      },
      classes: classStats
    });

  } catch (error: any) {
    console.error("Attendance Analytics Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
