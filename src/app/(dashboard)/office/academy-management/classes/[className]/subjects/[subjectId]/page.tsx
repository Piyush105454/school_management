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
        
        <div className="hidden sm:flex items-center gap-3 mt-2">
          <ExcelImportModal subjectId={subjectId} />
          <AddUnitModal subjectId={subjectId} nextOrderNo={subjectUnits.length + 1} />
        </div>
      </div>
      
      <div className="sm:hidden flex flex-col gap-3 w-full pt-2">
        <ExcelImportModal subjectId={subjectId} />
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
            const isNA = unit.name === "NA";

            return (
              <div key={unit.id} className={cn(
                "bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm",
                isNA && "border-none shadow-none bg-transparent"
              )}>
                <div className={cn(
                  "p-4 border-b border-slate-200 flex items-center justify-between gap-3",
                  isNA ? "bg-transparent border-none px-0" : "bg-slate-50"
                )}>
                  <div className="flex items-center gap-3">
                    {!isNA && (
                      <div className="h-10 w-10 bg-white shadow-sm border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center font-black">
                        U{unit.orderNo}
                      </div>
                    )}
                    <h2 className={cn(
                      "font-bold text-slate-800",
                      isNA ? "text-xl uppercase italic tracking-tight" : "text-lg"
                    )}>
                      {isNA ? "Direct Chapters" : unit.name}
                    </h2>
                    {!isNA && <EditUnitModal unitId={unit.id} initialName={unit.name} />}
                  </div>
                  <AddChapterModal unitId={unit.id} nextOrderNo={unitsChapters.length + 1} />
                </div>

                <div className={cn(
                  isNA && "bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm"
                )}>

                {unitsChapters.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm font-medium">
                    No chapters added to this unit yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">#</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20 text-center">CH. NO</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chapter Name</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pages</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center min-w-[150px]">View Chapter</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {unitsChapters.map((chapter, index) => {
                          const chapterPdf = pdfs.find(p => p.chapterId === chapter.id);
                          const resourceUrl = chapterPdf ? (
                            chapterPdf.fileUrl?.startsWith("data:") 
                              ? `/api/academy/chapter-pdf/${chapter.id}` 
                              : chapterPdf.fileUrl
                          ) : undefined;

                          return (
                            <tr key={chapter.id} className="hover:bg-slate-50/30 transition-colors group">
                              <td className="px-6 py-4">
                                <span className="text-xs font-bold text-slate-400">{(index + 1).toString().padStart(2, '0')}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-flex items-center justify-center h-7 w-7 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg border border-slate-200 shadow-sm">
                                  {chapter.chapterNo}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center shadow-sm border border-blue-100/50">
                                    <FileText className="h-4 w-4" />
                                  </div>
                                  {resourceUrl ? (
                                    <button 
                                      onClick={() => window.open(resourceUrl, '_blank')}
                                      className="text-sm font-bold text-slate-800 tracking-tight hover:text-blue-600 hover:underline transition-all text-left"
                                    >
                                      {chapter.name}
                                    </button>
                                  ) : (
                                    <span className="text-sm font-bold text-slate-800 tracking-tight">
                                      {chapter.name}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {chapter.pageStart && chapter.pageEnd ? (
                                  <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 whitespace-nowrap">
                                    {chapter.pageStart} — {chapter.pageEnd}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex justify-center">
                                  {resourceUrl ? (
                                    <button
                                      onClick={() => window.open(resourceUrl, '_blank')}
                                      className="flex items-center gap-1.5 py-1.5 px-3 bg-white text-slate-700 hover:bg-slate-50 font-bold rounded-lg transition-all text-[10px] uppercase tracking-wider border border-slate-200 shadow-sm whitespace-nowrap group"
                                    >
                                      <Eye className="h-3.5 w-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
                                      View Link
                                    </button>
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-300 italic uppercase tracking-wider">No Resource</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <EditChapterModal 
                                    chapter={chapter} 
                                    availableUnits={subjectUnits} 
                                    initialPdfUrl={chapterPdf?.fileUrl}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {isNA && <div className="mb-8" />}
              </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
