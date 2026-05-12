import React from "react";
export const dynamic = 'force-dynamic';
import Link from "next/link";
import { db } from "@/db";
import { inquiries, studentProfiles, admissionMeta, classes, teachers } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { Users, Presentation } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ClassManagementPage({
  searchParams
}: {
  searchParams: Promise<{ institute?: string }>
}) {
  const { institute: selectedInstitute } = await searchParams;
  const session = await getServerSession(authOptions);
  
  let classData: { id: number; name: string; institute: string; count: number }[] = [];
  let dbError = false;

  try {
    // Fetch all classes from DB
    const dbClasses = await db.select().from(classes).orderBy(classes.grade);
    
    // Fetch student counts grouped by class name AND institute (via inquiry.school)
    const studentCounts = await db
      .select({
        className: inquiries.appliedClass,
        school: inquiries.school,
        count: count(),
      })
      .from(studentProfiles)
      .innerJoin(admissionMeta, eq(studentProfiles.admissionMetaId, admissionMeta.id))
      .innerJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
      .where(eq(studentProfiles.isFullyAdmitted, true))
      .groupBy(inquiries.appliedClass, inquiries.school);

    // Map DB classes to counts
    classData = dbClasses.map((cls) => {
      const match = studentCounts.find(
        (sc) => String(sc.className) === cls.name && sc.school === cls.institute
      );
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
    
    // Apply global institute filter
    if (selectedInstitute && selectedInstitute !== "ALL") {
      const target = selectedInstitute.toLowerCase();
      classData = classData.filter(c => c.institute.toLowerCase() === target);
    }
  } catch (error) {
    console.error("Database query failed:", error);
    dbError = true;
  }

  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">Class Management</h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Manage and organize school classes and view admitted students.</p>
      </div>

      {dbError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-700 font-bold">Database Quota Exceeded</p>
          <p className="text-red-600 text-sm">Your database provider (Neon) has limited access to your data. Please upgrade your plan to restore full functionality.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classData.map((cls) => (
          <div key={`${cls.name}-${cls.institute}`} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Presentation className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-3 py-1 rounded-full uppercase tracking-wider">
                {cls.institute}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-800">
                {cls.name.startsWith("Class ") || ["LKG", "UKG", "KG1", "KG2"].includes(cls.name) 
                  ? cls.name 
                  : `Class ${cls.name}`}
              </h2>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Users className="h-4 w-4" />
                <span>{cls.count} Confirmed Students</span>
              </div>
            </div>

            <Link 
              href={`/office/school-management/classes/${cls.name}?institute=${encodeURIComponent(cls.institute)}`}
              className="mt-2 w-full text-center px-4 py-3 bg-slate-900 text-white font-weight-bold rounded-xl hover:bg-slate-800 transition-colors text-sm uppercase tracking-wider font-bold"
            >
              View Students
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
