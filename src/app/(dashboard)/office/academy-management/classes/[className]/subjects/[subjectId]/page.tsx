import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Layers, GripVertical, FileText } from "lucide-react";
import { db } from "@/db";
import { subjects, classes, units, chapters, chapterPdfs } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import ChapterPdfUploader from "@/features/academy/components/ChapterPdfUploader";
import AddUnitModal from "@/features/academy/components/AddUnitModal";
import AddChapterModal from "@/features/academy/components/AddChapterModal";

interface SubjectDetailsPageProps {
  params: Promise<{
    className: string;
    subjectId: string;
  }>;
}

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
  let subjectChapters: typeof chapters.$inferSelect[] = [];
  let pdfs: typeof chapterPdfs.$inferSelect[] = [];

  if (unitIds.length > 0) {
    subjectChapters = await db.query.chapters.findMany({
      where: inArray(chapters.unitId, unitIds),
      orderBy: (chapters, { asc }) => [asc(chapters.orderNo)],
    });

    const chapterIds = subjectChapters.map(c => c.id);
    if (chapterIds.length > 0) {
      pdfs = await db.query.chapterPdfs.findMany({
        where: inArray(chapterPdfs.chapterId, chapterIds),
        columns: {
          id: true,
          chapterId: true,
          uploadedBy: true,
          uploadedAt: true,
        }
      }) as any; // Cast safely as we omit fileUrl here
    }
  }

  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href={`/office/academy-management/classes/${decodedClassName}/subjects`}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">
                {subjectRecord.name}
              </h1>
              <span className="text-xs font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full uppercase tracking-wider">
                {subjectRecord.class.name}
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-medium">Manage units and chapters for this subject, and upload PDFs.</p>
          </div>
        </div>
        
        <div className="hidden sm:block mt-2">
          <AddUnitModal subjectId={subjectId} nextOrderNo={subjectUnits.length + 1} />
        </div>
      </div>
      
      <div className="sm:hidden w-full pt-2">
        <AddUnitModal subjectId={subjectId} nextOrderNo={subjectUnits.length + 1} />
      </div>

      {subjectUnits.length === 0 ? (
        <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-4 min-h-[400px] shadow-sm mt-6">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-blue-500/5 animate-pulse">
            <Layers className="h-8 w-8" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h2 className="text-xl font-bold text-slate-800">No Units Found</h2>
            <p className="text-sm text-slate-500">
              There are no units defined for this subject yet. Please ensure the database is seeded.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 mt-8">
          {subjectUnits.map((unit) => {
            const unitsChapters = subjectChapters.filter(c => c.unitId === unit.id);
            return (
              <div key={unit.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white shadow-sm border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center font-black">
                      U{unit.orderNo}
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">{unit.name}</h2>
                  </div>
                  <AddChapterModal unitId={unit.id} nextOrderNo={unitsChapters.length + 1} />
                </div>

                {unitsChapters.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm font-medium">
                    No chapters added to this unit yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {unitsChapters.map((chapter) => {
                      const chapterPdf = pdfs.find(p => p.chapterId === chapter.id);
                      return (
                        <div key={chapter.id} className="p-4 md:p-6 flex flex-col md:flex-row gap-6 md:items-center hover:bg-slate-50/50 transition-colors">
                          <div className="flex-1 flex gap-4">
                            <div className="mt-1">
                              <GripVertical className="h-5 w-5 text-slate-300" />
                            </div>
                            <div className="space-y-1">
                              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-500" />
                                {chapter.name}
                              </h3>
                              <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                                <span className="bg-slate-100 px-2 py-1 rounded-md">Chapter {chapter.chapterNo}</span>
                                {chapter.pageStart && chapter.pageEnd ? (
                                  <span className="px-2 py-1 border border-slate-200 rounded-md">Pages: {chapter.pageStart} - {chapter.pageEnd}</span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          
                          <div className="w-full md:w-64 shrink-0 border-l border-slate-100 pl-0 md:pl-6 pt-4 md:pt-0">
                            {chapterPdf ? (
                              <ChapterPdfUploader 
                                chapterId={chapter.id} 
                                existingPdfUrl={`/api/academy/chapter-pdf/${chapter.id}`}
                              />
                            ) : (
                              <ChapterPdfUploader 
                                chapterId={chapter.id} 
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
