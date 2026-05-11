"use server";

import { db } from "@/db";
import { scholarshipRecords, admissionMeta, inquiries } from "@/db/schema";
import { sql, eq, and } from "drizzle-orm";

export async function getMonthlyReports(school?: string): Promise<{ success: true; data: any[] } | { success: false; error: string }> {
  try {
    const reports = await db
      .select({
        month: scholarshipRecords.month,
        year: scholarshipRecords.year,
        totalAmount: sql<number>`sum(${scholarshipRecords.totalAmount})::int`,
        paidAmount: sql<number>`sum(case when ${scholarshipRecords.status} = 'PAID' then ${scholarshipRecords.totalAmount} else 0 end)::int`,
        pendingCount: sql<number>`count(case when ${scholarshipRecords.status} = 'PENDING' then 1 end)::int`,
        approvedCount: sql<number>`count(case when ${scholarshipRecords.status} = 'APPROVED' then 1 end)::int`,
        paidCount: sql<number>`count(case when ${scholarshipRecords.status} = 'PAID' then 1 end)::int`,
      })
      .from(scholarshipRecords)
      .innerJoin(admissionMeta, eq(scholarshipRecords.admissionId, admissionMeta.id))
      .innerJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
      .where(school && school !== "ALL" ? eq(inquiries.school, school) : undefined)
      .groupBy(scholarshipRecords.month, scholarshipRecords.year);

    return { success: true, data: reports };
  } catch (error: any) {
    console.error("getMonthlyReports error:", error);
    return { success: false, error: error.message };
  }
}
