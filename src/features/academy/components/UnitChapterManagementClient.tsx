"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  Eye, 
  Edit3, 
  BookOpen, 
  PlusCircle, 
  PenTool, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  ClipboardList,
  MoreVertical,
  Edit2,
  Table as TableIcon
} from "lucide-react";
import { ActionDropdown } from "@/components/ui/ActionDropdown";
import EditUnitModal from "@/features/academy/components/EditUnitModal";
import EditChapterModal from "@/features/academy/components/EditChapterModal";
import { useRouter } from "next/navigation";

interface Chapter {
  id: number;
  unitId: number;
  name: string;
  chapterNo: number;
  pageStart: number;
  pageEnd: number;
  orderNo: number;
}

interface Unit {
  id: number;
  name: string;
  orderNo: number;
  subjectId: number;
}

interface Pdf {
  id: string;
  chapterId: number;
  uploadedBy?: string | null;
  uploadedAt?: Date | null;
  fileUrl?: string | null;
}

interface UnitChapterManagementClientProps {
  units: Unit[];
  chapters: Chapter[];
  pdfs: Pdf[];
  className: string;
  subjectName: string;
  subjectId: number;
}

export default function UnitChapterManagementClient({
  units,
  chapters,
  pdfs,
  className,
  subjectName,
  subjectId
}: UnitChapterManagementClientProps) {
  const router = useRouter();
  
  // State for controlling modals
  const [editingUnit, setEditingUnit] = useState<{ id: number; name: string } | null>(null);
  const [editingChapter, setEditingChapter] = useState<{ chapter: Chapter; pdfUrl?: string } | null>(null);

  interface DisplayRow {
    unit: Unit;
    chapter: Chapter | null;
    isEmptyUnit: boolean;
  }

  // Flatten the data for the table
  // Each row represents a chapter. Units with no chapters will be handled separately if needed.
  const displayRows = units.flatMap((unit): DisplayRow[] => {
    const unitChapters = chapters.filter(c => c.unitId === unit.id);
    if (unitChapters.length === 0) {
      return [{
        unit,
        chapter: null,
        isEmptyUnit: true
      }];
    }
    return unitChapters.map(chapter => ({
      unit,
      chapter,
      isEmptyUnit: false
    }));
  });

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">Unit No</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[150px]">Unit Name</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">Ch. No</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Chapter Name</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-32">Pages</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-40">View Chapter</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayRows.map((row, index) => {
              const { unit, chapter, isEmptyUnit } = row;
              const isNA = unit.name === "NA";
              
              const chapterPdf = chapter ? pdfs.find(p => p.chapterId === chapter.id) : null;
              const resourceUrl = chapterPdf ? (
                chapterPdf.fileUrl?.startsWith("data:") 
                  ? `/api/academy/chapter-pdf/${chapter!.id}` 
                  : chapterPdf.fileUrl
              ) : undefined;

              return (
                <tr key={`${unit.id}-${chapter?.id || 'empty'}-${index}`} className="hover:bg-slate-50/50 transition-colors group">
                  {/* Unit No */}
                  <td className="px-6 py-5 text-center">
                    {!isNA ? (
                      <span className="inline-flex items-center justify-center h-8 w-8 bg-blue-50 text-blue-600 text-[11px] font-black rounded-lg border border-blue-100 shadow-sm">
                        U{unit.orderNo}
                      </span>
                    ) : (
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Direct</span>
                    )}
                  </td>

                  {/* Unit Name */}
                  <td className="px-6 py-5">
                    <span className={`text-sm font-bold ${isNA ? "text-slate-400 italic" : "text-slate-700"}`}>
                      {isNA ? "Direct Chapters" : unit.name}
                    </span>
                  </td>

                  {/* Chapter No */}
                  <td className="px-6 py-5 text-center">
                    {chapter ? (
                      <span className="inline-flex items-center justify-center h-7 w-7 bg-slate-100 text-slate-500 text-[10px] font-black rounded-lg border border-slate-200">
                        {chapter.chapterNo}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Chapter Name */}
                  <td className="px-6 py-5">
                    {chapter ? (
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center border border-slate-100">
                          <FileText className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-800 tracking-tight">
                          {chapter.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400 italic">No chapters in this unit</span>
                    )}
                  </td>

                  {/* Pages */}
                  <td className="px-6 py-5 text-center">
                    {chapter && chapter.pageStart && chapter.pageEnd ? (
                      <span className="text-[10px] font-black text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm whitespace-nowrap">
                        {chapter.pageStart} — {chapter.pageEnd}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* View Chapter */}
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      {resourceUrl ? (
                        <button
                          onClick={() => window.open(resourceUrl, '_blank')}
                          className="flex items-center gap-1.5 py-1.5 px-3 bg-white text-emerald-600 hover:bg-emerald-50 font-black rounded-xl transition-all text-[10px] uppercase tracking-wider border border-emerald-100 shadow-sm group active:scale-95"
                        >
                          <Eye className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                          View Resource
                        </button>
                      ) : (
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">No Link</span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-5 text-right">
                    <ActionDropdown 
                      actions={[
                        ...(chapter ? [
                          {
                            label: "Edit Chapter",
                            icon: <Edit3 className="h-4 w-4" />,
                            onClick: () => setEditingChapter({ chapter: chapter!, pdfUrl: chapterPdf?.fileUrl || "" })
                          },
                          {
                            label: "Add Lesson Plan",
                            icon: <PenTool className="h-4 w-4" />,
                            onClick: () => {
                              const unitName = isNA ? "" : unit.name;
                              const params = new URLSearchParams({
                                class: className,
                                subject: subjectName,
                                unitChapter: `${unitName ? unitName + ', ' : ''}${chapter!.name}`,
                                pages: chapter!.pageStart && chapter!.pageEnd ? `${chapter!.pageStart}-${chapter!.pageEnd}` : ""
                              });
                              router.push(`/office/academy-management/lesson-plan?${params.toString()}`);
                            }
                          },
                          {
                            label: "Add Homework",
                            icon: <ClipboardList className="h-4 w-4" />,
                            onClick: () => {
                              const unitName = isNA ? "" : unit.name;
                              const params = new URLSearchParams({
                                class: className,
                                subject: subjectName,
                                unitChapter: `${unitName ? unitName + ', ' : ''}${chapter!.name}`,
                                pages: chapter!.pageStart && chapter!.pageEnd ? `${chapter!.pageStart}-${chapter!.pageEnd}` : "",
                                type: "homework"
                              });
                              router.push(`/office/academy-management/lesson-plan?${params.toString()}`);
                            }
                          }
                        ] : []),
                        ...(!isNA ? [
                          {
                            label: "Edit Unit",
                            icon: <Edit2 className="h-4 w-4" />,
                            onClick: () => setEditingUnit({ id: unit.id, name: unit.name })
                          }
                        ] : [])
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Render Modals Controlled */}
      {editingUnit && (
        <EditUnitModal 
          unitId={editingUnit.id} 
          initialName={editingUnit.name} 
          showTrigger={false}
          isOpen={!!editingUnit}
          onClose={() => setEditingUnit(null)}
        />
      )}

      {editingChapter && (
        <EditChapterModal 
          chapter={editingChapter.chapter} 
          availableUnits={units} 
          initialPdfUrl={editingChapter.pdfUrl}
          showTrigger={false}
          isOpen={!!editingChapter}
          onClose={() => setEditingChapter(null)}
        />
      )}
    </div>
  );
}
