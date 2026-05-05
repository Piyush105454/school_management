import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { classes, subjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import SubjectManagement from "@/features/academy/components/SubjectManagement";

interface SubjectPageProps {
  params: Promise<{
    className: string;
  }>;
  searchParams: Promise<{
    institute?: string;
  }>;
}

export default async function SubjectPage({ params, searchParams }: SubjectPageProps) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const decodedClassNameParam = decodeURIComponent(resolvedParams.className);
  const institute = resolvedSearchParams.institute || "Dhanpuri Public School";
  
  // Resolve DB class name ("1" -> "Class 1", "Nursery" -> "Nursery")
  const dbClassName =
    ["Nursery", "LKG", "UKG"].includes(decodedClassNameParam)
      ? decodedClassNameParam
      : `Class ${decodedClassNameParam}`;

  // Fetch the class ID with institute context
  const classRecord = await db.query.classes.findFirst({
    where: (cls, { and, eq }) => and(
      eq(cls.name, dbClassName),
      eq(cls.institute, institute)
    ),
  });

  if (!classRecord) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Class Not Found</h1>
        <p className="text-slate-500 mt-2">The class "{dbClassName}" does not exist in the database.</p>
        <Link href="/office/academy-management/classes" className="text-blue-600 font-bold mt-4 inline-block hover:underline">
          Back to Classes
        </Link>
      </div>
    );
  }

  // Fetch subjects for this class
  const classSubjects = await db.query.subjects.findMany({
    where: eq(subjects.classId, classRecord.id),
    orderBy: (subjects, { asc }) => [asc(subjects.name)],
  });

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/office/academy-management/classes"
            className="p-2.5 bg-white border border-slate-100 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400 hover:text-slate-600 shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">
              Subjects - {dbClassName}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">Add, delete and manage subjects for this class.</p>
          </div>
        </div>
      </div>

      <SubjectManagement 
        classId={classRecord.id}
        classNameParam={decodedClassNameParam}
        dbClassName={dbClassName}
        initialSubjects={classSubjects}
      />
    </div>
  );
}
