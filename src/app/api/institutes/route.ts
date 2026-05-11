
import { NextResponse } from "next/server";
import { db } from "@/db";
import { classes, teachers, inquiries } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const allClasses = await db.select({ institute: classes.institute }).from(classes);
    const allTeachers = await db.select({ institute: teachers.institute }).from(teachers);
    const allInquiries = await db.select({ institute: inquiries.school }).from(inquiries);
    
    const institutesSet = new Set<string>();
    
    allClasses.forEach(c => {
      if (c.institute) institutesSet.add(c.institute);
    });
    
    allTeachers.forEach(t => {
      if (t.institute) institutesSet.add(t.institute);
    });

    allInquiries.forEach(i => {
      if (i.institute) institutesSet.add(i.institute);
    });
    
    // Default values if none found in DB yet
    if (institutesSet.size === 0) {
      institutesSet.add("DPS Dhanpuri");
      institutesSet.add("Academy");
    }
    
    return NextResponse.json(Array.from(institutesSet).sort());
  } catch (error) {
    console.error("API Error fetching institutes:", error);
    return NextResponse.json(["DPS Dhanpuri", "Academy"], { status: 200 }); // Fallback
  }
}
