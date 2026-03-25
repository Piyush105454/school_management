import React from "react";
import Link from "next/link";
import { db } from "@/db";
import { inquiries, studentProfiles, admissionMeta } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { Users, Presentation, BookOpen } from "lucide-react";

export default async function ClassManagementPage() {
  const classesList = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

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
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">Academic Class Management</h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Manage classes, subjects and academic organization.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classData.map((cls) => (
          <div key={cls.name} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Presentation className="h-6 w-6" />
              </div>
              <span className="text-xs font-black bg-slate-100 text-slate-600 px-3 py-1 rounded-full uppercase tracking-wider">
                Class
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-800">
                {cls.name === "Nursery" || cls.name === "LKG" || cls.name === "UKG" ? cls.name : `Class ${cls.name}`}
              </h2>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Users className="h-4 w-4" />
                <span>{cls.count} Confirmed Students</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <Link 
                href={`/office/school-management/classes/${cls.name}`}
                className="w-full text-center px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2"
              >
                <Users className="h-3.5 w-3.5" />
                View Students
              </Link>
              <Link 
                href={`/office/academy-management/classes/${cls.name}/subjects`}
                className="w-full text-center px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-500/10"
              >
                <BookOpen className="h-3.5 w-3.5" />
                View Subject
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
