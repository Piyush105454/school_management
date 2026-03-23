"use server";

import { db } from "@/db";
import { scholarshipRecords } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function getMonthlyReports(): Promise<{ success: true; data: any[] } | { success: false; error: string }> {
  try {
    // Group by month and year, sum amounts, count approved/paid
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
      .groupBy(scholarshipRecords.month, scholarshipRecords.year);

    return { success: true, data: reports };
  } catch (error: any) {
    console.error("getMonthlyReports error:", error);
    return { success: false, error: error.message };
  }
}
