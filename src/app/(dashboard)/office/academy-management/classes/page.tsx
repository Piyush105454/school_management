import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { inquiries, studentProfiles, admissionMeta, teachers } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { Users, Presentation, BookOpen } from "lucide-react";
import GlobalExcelImportModal from "@/features/academy/components/GlobalExcelImportModal";
import ClassTable from "@/features/academy/components/ClassTable";


export default async function ClassManagementPage() {
  const session = await getServerSession(authOptions);
  let classesList = ["LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  
  // If teacher, filter classesList by assignment
  if (session?.user?.role === "TEACHER") {
    const teacherProfile = await db.query.teachers.findFirst({
      where: eq(teachers.userId, session.user.id)
    });
    
    if (teacherProfile?.classAssigned) {
      const assigned = teacherProfile.classAssigned.split(",").map(c => c.trim());
      classesList = classesList.filter(c => assigned.includes(c));
    } else {
      classesList = []; // No classes assigned
    }
  }

  // Fetch student counts grouped by class
  const studentCounts = await db
    .select({
      className: inquiries.appliedClass,
      count: count(),
    })
    .from(studentProfiles)
    .innerJoin(admissionMeta, eq(studentProfiles.admissionMetaId, admissionMeta.id))
    .innerJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
    .where(eq(studentProfiles.isFullyAdmitted, true))
    .groupBy(inquiries.appliedClass);

  // Map counts to classes List
  const classData = classesList.map((c) => {
    const match = studentCounts.find((sc) => String(sc.className) === c);
    return {
      name: c,
      count: match ? match.count : 0,
    };
  });

  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">Academic Class Management</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Manage classes, subjects and academic organization.</p>
        </div>
        <div className="shrink-0">
          <GlobalExcelImportModal />
        </div>
      </div>

      <ClassTable classData={classData} />

    </div>
  );
}
