"use client";
import React, { useState } from "react";
import { 
  FileText, 
  Eye, 
  Edit3, 
  BookOpen, 
  PenTool, 
  ExternalLink,
  ChevronRight,
  ClipboardList,
  Layers
} from "lucide-react";
import { ActionDropdown } from "@/components/ui/ActionDropdown";
import EditChapterModal from "@/features/academy/components/EditChapterModal";
import DivideChapterModal from "@/features/academy/components/DivideChapterModal";
import { useRouter, useSearchParams } from "next/navigation";

interface Chapter {
  id: number;
  subjectId: number;
  name: string;
  chapterNo: number;
  pageStart: number;
  pageEnd: number;
  orderNo: number;
  divisions?: {
    id: number;
    pageStart: number;
    pageEnd: number;
  }[];
}

interface Pdf {
  id: string;
  chapterId: number;
  uploadedBy?: string | null;
  uploadedAt?: Date | null;
  fileUrl?: string | null;
}

interface UnitChapterManagementClientProps {
  chapters: Chapter[];
  pdfs: Pdf[];
  className: string;
  subjectName: string;
  subjectId: number;
}

export default function UnitChapterManagementClient({
  chapters,
  pdfs,
  className,
  subjectName,
  subjectId
}: UnitChapterManagementClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const institute = searchParams.get("institute");
  
  // State for controlling modals
  const [editingChapter, setEditingChapter] = useState<{ chapter: Chapter; pdfUrl?: string } | null>(null);
  const [dividingChapter, setDividingChapter] = useState<{ id: number; name: string; pageStart: number; pageEnd: number; unitName: string } | null>(null);

  // Sort chapters by chapterNo ascending
  const displayChapters = [...chapters].sort((a, b) => a.chapterNo - b.chapterNo);

  if (displayChapters.length === 0) {
    return (
      <div className="bg-white border border-slate-200 border-dashed rounded-[2rem] p-16 flex flex-col items-center justify-center text-center gap-4 min-h-[300px] shadow-sm animate-in fade-in duration-500">
        <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/5">
          <BookOpen className="h-8 w-8" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h2 className="text-xl font-bold text-slate-800">No Chapters Found</h2>
          <p className="text-sm text-slate-500">
            There are no chapters defined for {subjectName} yet. Click "Add Chapter" above to create one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm animate-in fade-in duration-500">
      <div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">Ch. No</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Chapter Name</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-32">Pages</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-40">Divide Chapter</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-40">View Chapter</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayChapters.map((chapter) => {
              const chapterPdf = pdfs.find(p => p.chapterId === chapter.id);
              const resourceUrl = chapterPdf ? (
                chapterPdf.fileUrl?.startsWith("data:") 
                  ? `/api/academy/chapter-pdf/${chapter.id}` 
                  : chapterPdf.fileUrl
              ) : undefined;

              return (
                <tr key={chapter.id} className="hover:bg-slate-50/50 transition-colors group">
                  {/* Chapter No */}
                  <td className="px-6 py-5 text-center">
                    <span className="inline-flex items-center justify-center h-7 w-7 bg-slate-100 text-slate-500 text-[10px] font-black rounded-lg border border-slate-200">
                      {chapter.chapterNo}
                    </span>
                  </td>

                  {/* Chapter Name */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center border border-slate-100">
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-800 tracking-tight">
                        {chapter.name}
                      </span>
                    </div>
                  </td>

                  {/* Pages */}
                  <td className="px-6 py-5 text-center">
                    {chapter.pageStart && chapter.pageEnd ? (
                      <span className="text-[10px] font-black text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm whitespace-nowrap">
                        {chapter.pageStart} — {chapter.pageEnd}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Divide Chapter */}
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-center gap-2">
                      {chapter.pageStart && chapter.pageEnd ? (
                        <>
                          <button
                            onClick={() => setDividingChapter({
                              id: chapter.id,
                              name: chapter.name,
                              pageStart: chapter.pageStart,
                              pageEnd: chapter.pageEnd,
                              unitName: ""
                            })}
                            className="flex items-center gap-1.5 py-1.5 px-3 bg-white text-purple-600 hover:bg-purple-50 font-black rounded-xl transition-all text-[10px] uppercase tracking-wider border border-purple-100 shadow-sm group active:scale-95"
                          >
                            <Layers className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                            Divide
                          </button>
                          
                          {/* Division Badges for Direct Redirect */}
                          {chapter.divisions && chapter.divisions.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-1 mt-1">
                              {chapter.divisions.map((div) => (
                                <button
                                  key={div.id}
                                  onClick={() => {
                                    const params = new URLSearchParams({
                                      class: className,
                                      subject: subjectName,
                                      chapterId: chapter.id.toString(),
                                      unitChapter: chapter.name,
                                      pages: `${div.pageStart}-${div.pageEnd}`,
                                      ...(institute ? { institute } : {})
                                    });
                                    router.push(`/office/academy-management/lesson-plan?${params.toString()}`);
                                  }}
                                  className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[9px] font-black hover:bg-blue-100 transition-colors"
                                  title="Create Lesson Plan for this range"
                                >
                                  Pg {div.pageStart}-{div.pageEnd}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">N/A</span>
                      )}
                    </div>
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
                        {
                          label: "Edit Chapter",
                          icon: <Edit3 className="h-4 w-4" />,
                          onClick: () => setEditingChapter({ chapter: chapter, pdfUrl: chapterPdf?.fileUrl || "" })
                        },
                        {
                          label: "Add Lesson Plan",
                          icon: <PenTool className="h-4 w-4" />,
                          onClick: () => {
                            const params = new URLSearchParams({
                              class: className,
                              subject: subjectName,
                              chapterId: chapter.id.toString(),
                              unitChapter: chapter.name,
                              pages: chapter.pageStart && chapter.pageEnd ? `${chapter.pageStart}-${chapter.pageEnd}` : "",
                              ...(institute ? { institute } : {})
                            });
                            router.push(`/office/academy-management/lesson-plan?${params.toString()}`);
                          }
                        },
                        {
                          label: "Add Homework",
                          icon: <ClipboardList className="h-4 w-4" />,
                          onClick: () => {
                            const params = new URLSearchParams({
                              class: className,
                              subject: subjectName,
                              unitChapter: chapter.name,
                              pages: chapter.pageStart && chapter.pageEnd ? `${chapter.pageStart}-${chapter.pageEnd}` : "",
                              type: "homework",
                              ...(institute ? { institute } : {})
                            });
                            router.push(`/office/academy-management/lesson-plan?${params.toString()}`);
                          }
                        }
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingChapter && (
        <EditChapterModal 
          chapter={editingChapter.chapter} 
          initialPdfUrl={editingChapter.pdfUrl}
          showTrigger={false}
          isOpen={!!editingChapter}
          onClose={() => setEditingChapter(null)}
        />
      )}

      {dividingChapter && (
        <DivideChapterModal
          isOpen={!!dividingChapter}
          onClose={() => setDividingChapter(null)}
          chapterId={dividingChapter?.id || 0}
          chapterName={dividingChapter?.name || ""}
          pageStart={dividingChapter?.pageStart || 0}
          pageEnd={dividingChapter?.pageEnd || 0}
          className={className}
          subjectName={subjectName}
          unitName={dividingChapter?.unitName || ""}
        />
      )}
    </div>
  );
}
