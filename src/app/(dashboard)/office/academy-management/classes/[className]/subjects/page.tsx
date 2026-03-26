import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronRight, Layers } from "lucide-react";
import { db } from "@/db";
import { classes, subjects, units, chapters } from "@/db/schema";
import { eq } from "drizzle-orm";

interface SubjectPageProps {
  params: Promise<{
    className: string;
  }>;
}

export default async function SubjectPage({ params }: SubjectPageProps) {
  const resolvedParams = await params;
  const decodedClassNameParam = decodeURIComponent(resolvedParams.className);
  
  // Resolve DB class name ("1" -> "Class 1", "Nursery" -> "Nursery")
  const dbClassName =
    ["Nursery", "LKG", "UKG"].includes(decodedClassNameParam)
      ? decodedClassNameParam
      : `Class ${decodedClassNameParam}`;

  // Fetch the class ID
  const classRecord = await db.query.classes.findFirst({
    where: eq(classes.name, dbClassName),
  });

  // Fetch subjects for this class
  let classSubjects: typeof subjects.$inferSelect[] = [];
  if (classRecord) {
    classSubjects = await db.query.subjects.findMany({
      where: eq(subjects.classId, classRecord.id),
      orderBy: (subjects, { asc }) => [asc(subjects.name)],
    });
  }

  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <Link 
          href="/office/academy-management/classes"
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">
            Subjects - {dbClassName}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Manage and organize subjects for this class.</p>
        </div>
      </div>

      {!classRecord || classSubjects.length === 0 ? (
        <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-4 min-h-[400px] shadow-sm">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-blue-500/5 animate-pulse">
            <BookOpen className="h-8 w-8" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h2 className="text-xl font-bold text-slate-800">No Subjects Found</h2>
            <p className="text-sm text-slate-500">
              There are no subjects defined for this class yet. Please ensure the database is seeded.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classSubjects.map((subject) => (
            <div key={subject.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-6 w-6" />
                </div>
                <span className="text-xs font-black bg-slate-100 text-slate-600 px-3 py-1 rounded-full uppercase tracking-wider">
                  {subject.medium}
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                  {subject.name}
                </h2>
              </div>

              <div className="pt-2">
                <Link 
                  href={`/office/academy-management/classes/${decodedClassNameParam}/subjects/${subject.id}`}
                  className="w-full text-center px-4 py-3 bg-slate-50 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors text-xs uppercase tracking-wider flex items-center justify-between group border border-slate-100"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-blue-500" />
                    View Units & Chapters
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
