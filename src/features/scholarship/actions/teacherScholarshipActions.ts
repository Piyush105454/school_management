"use server";

import { db } from "@/db";
import { 
  admissionMeta, 
  inquiries, 
  studentProfiles, 
  students, 
  scholarshipPtm, 
  scholarshipGuardian, 
  scholarshipRecords,
  studentAttendance,
  lessonPlans,
  homeworkSubmissions,
  teachers,
  classes
} from "@/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { saveKpiData } from "./kpiActions";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getStudentsWithCriteria(className: string, month: string, year: string) {
  try {
    const rawNum = className.replace(/^Class\s+/i, "").trim();
    const potentialNames = [
      className,
      `Class ${className}`,
      `CLASS ${className}`,
      rawNum,
      `Class ${rawNum}`,
      `CLASS ${rawNum}`
    ];

    // 1. Fetch fully admitted students in the selected class
    const studentsList = await db
      .select({
        admissionId: admissionMeta.id,
        studentName: inquiries.studentName,
        parentName: inquiries.parentName,
        appliedClass: inquiries.appliedClass,
        scholarNumber: students.scholarNumber,
        metaScholarNumber: admissionMeta.scholarNumber,
        admissionNumber: admissionMeta.admissionNumber,
        entryNumber: admissionMeta.entryNumber,
      })
      .from(studentProfiles)
      .innerJoin(admissionMeta, eq(studentProfiles.admissionMetaId, admissionMeta.id))
      .innerJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
      .leftJoin(students, eq(admissionMeta.entryNumber, students.studentId))
      .where(
        and(
          eq(studentProfiles.isFullyAdmitted, true),
          inArray(inquiries.appliedClass, potentialNames)
        )
      );

    const data = [];

    // 2. Fetch PTM and Guardian entries for each student for the selected month/year
    for (const student of studentsList) {
      const ptmRecord = await db.query.scholarshipPtm.findFirst({
        where: and(
          eq(scholarshipPtm.admissionId, student.admissionId),
          eq(scholarshipPtm.month, month),
          eq(scholarshipPtm.year, year)
        )
      });

      const guardianRecord = await db.query.scholarshipGuardian.findFirst({
        where: and(
          eq(scholarshipGuardian.admissionId, student.admissionId),
          eq(scholarshipGuardian.month, month),
          eq(scholarshipGuardian.year, year)
        )
      });

      const scholarshipRecord = await db.query.scholarshipRecords.findFirst({
        where: and(
          eq(scholarshipRecords.admissionId, student.admissionId),
          eq(scholarshipRecords.month, month),
          eq(scholarshipRecords.year, year)
        )
      });

      let parentImagesArray: string[] = [];
      if (ptmRecord?.parentImages) {
        try {
          parentImagesArray = JSON.parse(ptmRecord.parentImages);
        } catch (e) {
          parentImagesArray = [ptmRecord.parentImages];
        }
      }

      let guardianComments = null;
      if (guardianRecord?.comments) {
        try {
          guardianComments = JSON.parse(guardianRecord.comments);
        } catch (e) {
          guardianComments = null;
        }
      }

      data.push({
        admissionId: student.admissionId,
        studentName: student.studentName,
        parentName: student.parentName,
        scholarNumber: student.scholarNumber || student.metaScholarNumber || student.admissionNumber || student.entryNumber || "N/A",
        ptm: {
          attended: ptmRecord ? ptmRecord.attended : false,
          parentImages: parentImagesArray,
          attendee: ptmRecord ? ptmRecord.attendee : null,
          guardianName: ptmRecord ? ptmRecord.guardianName : null,
          guardianRelation: ptmRecord ? ptmRecord.guardianRelation : null,
          locked: ptmRecord ? ptmRecord.locked : false,
        },
        guardian: {
          rating: guardianRecord ? guardianRecord.rating : 0,
          comments: guardianComments || {},
          locked: guardianRecord ? guardianRecord.locked : false,
        },
        record: scholarshipRecord ? {
          totalAmount: scholarshipRecord.totalAmount,
          ptmAmount: scholarshipRecord.ptmAmount,
          guardianAmount: scholarshipRecord.guardianAmount,
          status: scholarshipRecord.status,
          locked: scholarshipRecord.locked,
          updatedAt: scholarshipRecord.updatedAt,
        } : null
      });
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("getStudentsWithCriteria error:", error);
    return { success: false, error: error.message };
  }
}

export async function saveStudentCriteria(
  admissionId: string, 
  month: string, 
  year: string, 
  data: { 
    attended?: boolean; 
    parentImages?: string[]; 
    rating?: number; 
    comments?: any;
    attendee?: string | null;
    guardianName?: string | null;
    guardianRelation?: string | null;
    ptmLocked?: boolean;
    guardianLocked?: boolean;
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const existingPtm = await db.query.scholarshipPtm.findFirst({
      where: and(
        eq(scholarshipPtm.admissionId, admissionId),
        eq(scholarshipPtm.month, month),
        eq(scholarshipPtm.year, year)
      ),
    });

    const existingGuardian = await db.query.scholarshipGuardian.findFirst({
      where: and(
        eq(scholarshipGuardian.admissionId, admissionId),
        eq(scholarshipGuardian.month, month),
        eq(scholarshipGuardian.year, year)
      ),
    });

    if (session.user.role === "TEACHER") {
      if (existingPtm?.locked && data.ptmLocked !== true && (data.attended !== undefined || data.ptmLocked !== undefined)) {
        return { success: false, error: "PTM record is locked and cannot be edited by teachers." };
      }
      if (existingGuardian?.locked && data.guardianLocked !== true && (data.rating !== undefined || data.guardianLocked !== undefined)) {
        return { success: false, error: "Guardian Ratings are locked and cannot be edited by teachers." };
      }
    }

    // 1. Save/Update PTM Record
    if (data.attended !== undefined || data.ptmLocked !== undefined) {
      const parentImagesStr = data.parentImages ? JSON.stringify(data.parentImages) : undefined;
      const ptmValues: any = {};
      if (data.attended !== undefined) ptmValues.attended = data.attended;
      if (parentImagesStr !== undefined) ptmValues.parentImages = parentImagesStr;
      if (data.attendee !== undefined) ptmValues.attendee = data.attendee;
      if (data.guardianName !== undefined) ptmValues.guardianName = data.guardianName;
      if (data.guardianRelation !== undefined) ptmValues.guardianRelation = data.guardianRelation;
      if (data.ptmLocked !== undefined) ptmValues.locked = data.ptmLocked;

      if (existingPtm) {
        await db.update(scholarshipPtm).set(ptmValues).where(eq(scholarshipPtm.id, existingPtm.id));
      } else {
        await db.insert(scholarshipPtm).values({ admissionId, month, year, ...ptmValues });
      }
    }

    // 2. Save/Update Guardian Record
    if (data.rating !== undefined || data.guardianLocked !== undefined) {
      const commentsStr = data.comments ? JSON.stringify(data.comments) : undefined;
      const guardianValues: any = {};
      if (data.rating !== undefined) guardianValues.rating = Math.round(data.rating);
      if (commentsStr !== undefined) guardianValues.comments = commentsStr;
      if (data.guardianLocked !== undefined) guardianValues.locked = data.guardianLocked;

      if (existingGuardian) {
        await db.update(scholarshipGuardian).set(guardianValues).where(eq(scholarshipGuardian.id, existingGuardian.id));
      } else {
        await db.insert(scholarshipGuardian).values({ admissionId, month, year, ...guardianValues });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("saveStudentCriteria error:", error);
    return { success: false, error: error.message };
  }
}

export async function calculateStudentScholarship(
  admissionId: string, 
  month: string, 
  year: string, 
  data: { 
    attended?: boolean; 
    rating?: number; 
    ptmLocked?: boolean; 
    guardianLocked?: boolean; 
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const existingPtm = await db.query.scholarshipPtm.findFirst({
      where: and(
        eq(scholarshipPtm.admissionId, admissionId),
        eq(scholarshipPtm.month, month),
        eq(scholarshipPtm.year, year)
      ),
    });

    const existingGuardian = await db.query.scholarshipGuardian.findFirst({
      where: and(
        eq(scholarshipGuardian.admissionId, admissionId),
        eq(scholarshipGuardian.month, month),
        eq(scholarshipGuardian.year, year)
      ),
    });

    if (session.user.role === "TEACHER") {
      if (existingPtm?.locked && data.ptmLocked !== true && (data.attended !== undefined || data.ptmLocked !== undefined)) {
        return { success: false, error: "PTM record is locked and cannot be edited by teachers." };
      }
      if (existingGuardian?.locked && data.guardianLocked !== true && (data.rating !== undefined || data.guardianLocked !== undefined)) {
        return { success: false, error: "Guardian Ratings are locked and cannot be edited by teachers." };
      }
    }
    const meta = await db.query.admissionMeta.findFirst({
      where: eq(admissionMeta.id, admissionId),
      columns: { entryNumber: true }
    });

    let realAttendance = { totalDays: 0, presentDays: 0 };
    if (meta?.entryNumber) {
      const student = await db.query.students.findFirst({
        where: eq(students.studentId, meta.entryNumber)
      });

      if (student) {
        const stats = await db.select({
          total: sql`count(case when status not in ('H', 'NA') then 1 end)`,
          present: sql`count(case when status in ('P', 'ML') then 1 end)`,
        })
        .from(studentAttendance)
        .where(and(
          eq(studentAttendance.studentId, student.id),
          eq(studentAttendance.month, month),
          eq(studentAttendance.year, parseInt(year))
        ));

        const total = Number(stats[0]?.total || 0);
        const present = Number(stats[0]?.present || 0);
        
        realAttendance = {
          totalDays: total,
          presentDays: present
        };
      }
    }

    let realHomework = { totalGiven: 0, totalDone: 0 };
    if (meta?.entryNumber) {
      const student = await db.query.students.findFirst({
        where: eq(students.studentId, meta.entryNumber)
      });

      if (student) {
        // Convert month name to 2-digit number string (e.g. "April" -> "04")
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthIndex = monthNames.indexOf(month);
        const monthStr = monthIndex >= 0 ? String(monthIndex + 1).padStart(2, '0') : null;

        if (monthStr) {
          // Total homeworks assigned to this class in this month
          const totalAssignedResult = await db.select({ count: sql`count(*)` })
            .from(lessonPlans)
            .where(and(
              eq(lessonPlans.classId, student.classId as number),
              sql`${lessonPlans.date} LIKE ${`${year}-${monthStr}%`}`
            ));

          // Total completed homeworks by this student in this month
          const totalCompletedResult = await db.select({ count: sql`count(*)` })
            .from(homeworkSubmissions)
            .innerJoin(lessonPlans, eq(homeworkSubmissions.lessonPlanId, lessonPlans.id))
            .where(and(
              eq(homeworkSubmissions.studentId, student.id),
              eq(homeworkSubmissions.status, "COMPLETED"),
              eq(lessonPlans.classId, student.classId as number),
              sql`${lessonPlans.date} LIKE ${`${year}-${monthStr}%`}`
            ));

          realHomework = {
            totalGiven: Number(totalAssignedResult[0]?.count || 0),
            totalDone: Number(totalCompletedResult[0]?.count || 0)
          };
        }
      }
    }



    // Call existing saveKpiData from kpiActions to calculate amounts and write/update everything
    const kpiResult = await saveKpiData(admissionId, month, year, {
      attendance: realAttendance,
      homework: realHomework,
      guardian: { rating: data.rating !== undefined ? data.rating : (existingGuardian ? existingGuardian.rating : 0) },
      ptm: { 
        attended: data.attended !== undefined ? data.attended : (existingPtm ? existingPtm.attended : false),
        attendee: existingPtm ? existingPtm.attendee : null,
        guardianName: existingPtm ? existingPtm.guardianName : null,
        guardianRelation: existingPtm ? existingPtm.guardianRelation : null
      },
      ptmLocked: data.ptmLocked,
      guardianLocked: data.guardianLocked
    });

    if (!kpiResult.success) {
      throw new Error(kpiResult.error || "Failed to calculate scholarship KPI record");
    }

    return { 
      success: true, 
      totalAmount: kpiResult.totalAmount,
      ptmAmount: (kpiResult as any).ptmAmount,
      guardianAmount: (kpiResult as any).guardianAmount,
      attendance: realAttendance,
      homework: realHomework
    };
  } catch (error: any) {
    console.error("calculateStudentScholarship error:", error);
    return { success: false, error: error.message };
  }
}

export async function getAssignedClassesForTeacher() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    if (session.user.role !== "TEACHER") {
      // For Admin/Office/Principal, load all classes from the database
      const dbClasses = await db.select().from(classes).orderBy(classes.grade);
      const classNames = dbClasses.map(c => c.name);
      return { success: true, data: classNames };
    }

    const teacherProfile = await db.query.teachers.findFirst({
      where: eq(teachers.userId, session.user.id)
    });

    if (!teacherProfile || !teacherProfile.classAssigned) {
      return { success: true, data: [] };
    }

    // Parse comma-separated classes
    const classNames = teacherProfile.classAssigned
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    return { success: true, data: classNames };
  } catch (error: any) {
    console.error("getAssignedClassesForTeacher error:", error);
    return { success: false, error: error.message };
  }
}
