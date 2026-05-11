import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { inquiries, studentProfiles, admissionMeta, teachers, classes, students } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { Users, Presentation, BookOpen } from "lucide-react";
import GlobalExcelImportModal from "@/features/academy/components/GlobalExcelImportModal";
import ClassTable from "@/features/academy/components/ClassTable";


export default async function ClassManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ institute?: string }>;
}) {
  const { institute: selectedInstitute } = await searchParams;
  const session = await getServerSession(authOptions);
  
  // Fetch all classes from DB
  const dbClasses = await db.query.classes.findMany();
  
  // Fetch student counts grouped by class ID
  const studentCounts = await db
    .select({
      classId: students.classId,
      count: count(),
    })
    .from(students)
    .groupBy(students.classId);

  // Map to classData
  let classData = dbClasses.map((cls) => {
    const match = studentCounts.find((sc) => sc.classId === cls.id);
    return {
      id: cls.id,
      name: cls.name,
      institute: cls.institute || "Dhanpuri Public School",
      count: match ? match.count : 0,
    };
  });

  // If teacher, filter by assigned classes AND institute
  if (session?.user?.role === "TEACHER") {
    const teacherProfile = await db.query.teachers.findFirst({
      where: eq(teachers.userId, session.user.id)
    });
    
    if (teacherProfile) {
      const assigned = teacherProfile.classAssigned 
        ? teacherProfile.classAssigned.split(",").map(c => c.trim().toLowerCase()) 
        : [];
      const teacherInstitute = teacherProfile.institute;

      classData = classData.filter(c => {
        const nameMatch = assigned.includes(c.name.toLowerCase()) || assigned.includes(c.name.replace(/^Class\s+/i, '').toLowerCase());
        const instituteMatch = !teacherInstitute || c.institute === teacherInstitute;
        return nameMatch && instituteMatch;
      });
    } else {
      classData = [];
    }
  }

  // Apply Global Institute Filter (if selected and not "ALL")
  if (selectedInstitute && selectedInstitute !== "ALL") {
    const target = selectedInstitute.toLowerCase();
    classData = classData.filter(c => c.institute.toLowerCase() === target);
  }

  // Sort by institute then by grade/name
  classData.sort((a, b) => {
    if (a.institute < b.institute) return -1;
    if (a.institute > b.institute) return 1;
    return a.name.localeCompare(b.name, undefined, { numeric: true });
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
