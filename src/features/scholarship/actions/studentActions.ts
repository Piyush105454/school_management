"use server";

import { db } from "@/db";
import { admissionMeta, inquiries, studentProfiles, studentBio, students } from "@/db/schema";
import { eq, and, count, inArray } from "drizzle-orm";

export async function getStudentCountsByClass(school?: string, classesFilter?: string[]) {
  try {
    const result = await db
      .select({
        appliedClass: inquiries.appliedClass,
        studentCount: count(studentProfiles.id),
      })
      .from(studentProfiles)
      .innerJoin(admissionMeta, eq(studentProfiles.admissionMetaId, admissionMeta.id))
      .innerJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
      .where(
        and(
          eq(studentProfiles.isFullyAdmitted, true),
          school && school !== "ALL" ? eq(inquiries.school, school) : undefined,
          classesFilter && classesFilter.length > 0 ? inArray(inquiries.appliedClass, classesFilter) : undefined
        )
      )
      .groupBy(inquiries.appliedClass);

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getStudentsByClass(className: string, school?: string) {
  try {
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
          eq(inquiries.appliedClass, className),
          school && school !== "ALL" ? eq(inquiries.school, school) : undefined
        )
      );

    return { 
      success: true, 
      data: studentsList.map(s => ({
        ...s,
        scholarNumber: s.scholarNumber || s.metaScholarNumber || s.admissionNumber || s.entryNumber || null
      }))
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getStudentDetails(admissionId: string) {
  try {
    const student = await db
      .select({
        studentName: inquiries.studentName,
        parentName: inquiries.parentName,
        scholarNumber: students.scholarNumber,
        metaScholarNumber: admissionMeta.scholarNumber,
        admissionNumber: admissionMeta.admissionNumber,
        entryNumber: admissionMeta.entryNumber,
      })
      .from(admissionMeta)
      .innerJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
      .leftJoin(students, eq(admissionMeta.entryNumber, students.studentId))
      .where(eq(admissionMeta.id, admissionId))
      .limit(1);
      
    if (!student.length) return { success: true, data: null };
    
    return { 
      success: true, 
      data: {
        ...student[0],
        scholarNumber: student[0].scholarNumber || student[0].metaScholarNumber || student[0].admissionNumber || student[0].entryNumber || null
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAdmittedStudents() {
  try {
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
        appliedScholarship: admissionMeta.appliedScholarship,
        awardedScholarship: admissionMeta.awardedScholarship,
        scholarshipAmount: admissionMeta.scholarshipAmount,
      })
      .from(studentProfiles)
      .innerJoin(admissionMeta, eq(studentProfiles.admissionMetaId, admissionMeta.id))
      .innerJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
      .leftJoin(students, eq(admissionMeta.entryNumber, students.studentId))
      .where(eq(studentProfiles.isFullyAdmitted, true));

    return { 
      success: true, 
      data: studentsList.map(s => ({
        ...s,
        scholarNumber: s.scholarNumber || s.metaScholarNumber || s.admissionNumber || s.entryNumber || null
      }))
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
