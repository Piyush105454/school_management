"use server";

import { db } from "@/db";
import { admissionMeta, inquiries, studentProfiles, studentBio } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";

export async function getStudentCountsByClass() {
  try {
    const result = await db
      .select({
        appliedClass: inquiries.appliedClass,
        studentCount: count(studentProfiles.id),
      })
      .from(studentProfiles)
      .innerJoin(admissionMeta, eq(studentProfiles.admissionMetaId, admissionMeta.id))
      .innerJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
      .where(eq(studentProfiles.isFullyAdmitted, true))
      .groupBy(inquiries.appliedClass);

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getStudentsByClass(className: string) {
  try {
    const students = await db
      .select({
        admissionId: admissionMeta.id,
        studentName: inquiries.studentName,
        parentName: inquiries.parentName,
        appliedClass: inquiries.appliedClass,
        scholarNumber: admissionMeta.scholarNumber,
        admissionNumber: admissionMeta.admissionNumber,
      })
      .from(studentProfiles)
      .innerJoin(admissionMeta, eq(studentProfiles.admissionMetaId, admissionMeta.id))
      .innerJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
      .where(
        and(
          eq(studentProfiles.isFullyAdmitted, true),
          eq(inquiries.appliedClass, className)
        )
      );

    return { success: true, data: students };
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
        scholarNumber: admissionMeta.scholarNumber,
        admissionNumber: admissionMeta.admissionNumber,
      })
      .from(admissionMeta)
      .innerJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
      .where(eq(admissionMeta.id, admissionId))
      .limit(1);
      
    return { success: true, data: student[0] || null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
