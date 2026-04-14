import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Layers, GripVertical, FileText, Eye } from "lucide-react";
import { db } from "@/db";
import { subjects, classes, units, chapters, chapterPdfs } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import ChapterPdfUploader from "@/features/academy/components/ChapterPdfUploader";
import AddUnitModal from "@/features/academy/components/AddUnitModal";
import AddChapterModal from "@/features/academy/components/AddChapterModal";
import ExcelImportModal from "@/features/academy/components/ExcelImportModal";
import EditUnitModal from "@/features/academy/components/EditUnitModal";
import EditChapterModal from "@/features/academy/components/EditChapterModal";

interface SubjectDetailsPageProps {
  params: Promise<{
    className: string;
    subjectId: string;
  }>;
}

import UnitChapterManagementClient from "@/features/academy/components/UnitChapterManagementClient";

export default async function SubjectDetailsPage({ params }: SubjectDetailsPageProps) {
  const resolvedParams = await params;
  const decodedClassName = decodeURIComponent(resolvedParams.className);
  const subjectId = parseInt(resolvedParams.subjectId, 10);

  // Fetch subject details
  const subjectRecord = await db.query.subjects.findFirst({
    where: eq(subjects.id, subjectId),
    with: {
      class: true,
    },
  });

  if (!subjectRecord) {
    return (
      <div className="p-6 md:p-10 space-y-6">
        <h1 className="text-2xl font-bold text-red-500">Subject Not Found</h1>
        <Link href={`/office/academy-management/classes/${decodedClassName}/subjects`} className="text-blue-600 underline">
          Go Back
        </Link>
      </div>
    );
  }

  // Fetch units for this subject
  const subjectUnits = await db.query.units.findMany({
    where: eq(units.subjectId, subjectId),
    orderBy: (units, { asc }) => [asc(units.orderNo)],
  });

  const unitIds = subjectUnits.map(u => u.id);

  // Fetch chapters for these units
  let subjectChapters: any[] = [];
  let pdfs: any[] = [];

  if (unitIds.length > 0) {
    subjectChapters = await db.query.chapters.findMany({
      where: inArray(chapters.unitId, unitIds),
      orderBy: (chapters, { asc }) => [asc(chapters.orderNo)],
    });

    const chapterIds = subjectChapters.map(c => c.id);
    if (chapterIds.length > 0) {
      pdfs = await db.query.chapterPdfs.findMany({
        where: inArray(chapterPdfs.chapterId, chapterIds),
      });
    }
  }

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Link 
            href={`/office/academy-management/classes/${decodedClassName}/subjects`}
            className="p-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-slate-900 shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-4xl font-black text-slate-900 font-outfit uppercase tracking-tight">
                {subjectRecord.name}
              </h1>
              <span className="text-[10px] font-black bg-blue-600 text-white px-3 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20">
                {subjectRecord.class.name}
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-medium tracking-wide">Manage units and chapters for this subject, and upload PDFs.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <ExcelImportModal subjectId={subjectId} />
          <AddUnitModal subjectId={subjectId} nextOrderNo={subjectUnits.length + 1} />
        </div>
      </div>
      
      <UnitChapterManagementClient 
        units={subjectUnits}
        chapters={subjectChapters}
        pdfs={pdfs}
        className={subjectRecord.class.name}
        subjectName={subjectRecord.name}
        subjectId={subjectId}
      />
    </div>
  );
}
