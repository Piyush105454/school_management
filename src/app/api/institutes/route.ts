import { db } from "@/db";
import { teachers } from "@/db/schema";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get distinct institutes from teachers table
    const institutes = await db
      .selectDistinct({ institute: teachers.institute })
      .from(teachers)
      .where(sql`${teachers.institute} IS NOT NULL`)
      .orderBy(teachers.institute);

    const instituteList = institutes
      .map((row) => row.institute)
      .filter((institute): institute is string => institute !== null && institute !== undefined && institute.trim() !== "");

    return NextResponse.json(instituteList);
  } catch (error) {
    console.error("Error fetching institutes:", error);
    return NextResponse.json(
      { error: "Failed to fetch institutes" },
      { status: 500 }
    );
  }
}
