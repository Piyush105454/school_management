import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { classes, subjects, teachers, timetable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import SubjectManagement from "@/features/academy/components/SubjectManagement";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
  
  const session = await getServerSession(authOptions);
  const isAdmin = ["ADMIN", "OFFICE", "PRINCIPAL"].includes(session?.user?.role ?? "");
  
  let dbClassName = decodedClassNameParam;

  // Fetch the class ID with institute context (try exact match first)
  let classRecord = await db.query.classes.findFirst({
    where: (cls, { and, eq }) => and(
      eq(cls.name, decodedClassNameParam),
      eq(cls.institute, institute)
    ),
  });

  // If exact match not found, resolve fallback name ("1" -> "Class 1", "Nursery" -> "Nursery")
  if (!classRecord) {
    const fallbackClassName =
      ["Nursery", "LKG", "UKG", "KG1", "KG2"].includes(decodedClassNameParam) || decodedClassNameParam.startsWith("Class ")
        ? decodedClassNameParam
        : `Class ${decodedClassNameParam}`;

    classRecord = await db.query.classes.findFirst({
      where: (cls, { and, eq }) => and(
        eq(cls.name, fallbackClassName),
        eq(cls.institute, institute)
      ),
    });

    if (classRecord) {
      dbClassName = fallbackClassName;
    }
  }

  if (!classRecord) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Class Not Found</h1>
        <p className="text-slate-500 mt-2">The class "{decodedClassNameParam}" does not exist in the database.</p>
        <Link href="/office/academy-management/classes" className="text-blue-600 font-bold mt-4 inline-block hover:underline">
          Back to Classes
        </Link>
      </div>
    );
  }

  // Fetch subjects for this class with assigned teacher and reviewers
  let classSubjects = await db.query.subjects.findMany({
    where: eq(subjects.classId, classRecord.id),
    with: {
      assignedTeacher: true,
      reviewer1: true,
      reviewer2: true,
    },
    orderBy: (subjects, { asc }) => [asc(subjects.name)],
  });

  if (session?.user?.role === "TEACHER") {
    const teacherProfile = await db.query.teachers.findFirst({
      where: eq(teachers.userId, session.user.id)
    });
    
    if (teacherProfile) {
      // Primary: show only subjects where this teacher is the assigned teacher
      classSubjects = classSubjects.filter(s => s.assignedTeacherId === teacherProfile.id);

      // Secondary: if none found via direct assignment, check timetable entries for this class
      if (classSubjects.length === 0) {
        const normalizeName = (name: string) => {
          if (!name) return "";
          const n = name.trim();
          if (/^kg\s*ii$/i.test(n)) return "kg2";
          if (/^kg\s*i$/i.test(n)) return "kg1";
          return n.toLowerCase().replace(/^class\s+/i, "").trim();
        };

        const teacherTimetable = await db.query.timetable.findMany({
          where: eq(timetable.teacherId, teacherProfile.id),
          columns: { subjectId: true, classId: true, className: true }
        });

        const classNorm = normalizeName(classRecord.name);
        const relevantRows = teacherTimetable.filter(t =>
          t.classId === classRecord.id ||
          (t.className && normalizeName(t.className) === classNorm)
        );
        const timetableSubjectIds = new Set(relevantRows.map(t => t.subjectId).filter(Boolean));

        const allSubjects = await db.query.subjects.findMany({
          where: eq(subjects.classId, classRecord.id),
          with: { 
            assignedTeacher: true,
            reviewer1: true,
            reviewer2: true,
          }
        });
        classSubjects = allSubjects.filter(s => timetableSubjectIds.has(s.id));
      }
    } else {
      classSubjects = [];
    }
  }

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
        isAdmin={isAdmin}
      />
    </div>
  );
}
