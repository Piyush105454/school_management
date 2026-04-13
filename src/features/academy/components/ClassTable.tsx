"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Users, BookOpen, Trash2, Presentation, Loader2 } from "lucide-react";
import { ActionDropdown } from "@/components/ui/ActionDropdown";
import { deleteClass } from "@/features/academy/actions/academyActions";
import { useRouter } from "next/navigation";

interface ClassData {
  name: string;
  count: number;
}

interface ClassTableProps {
  classData: ClassData[];
}

export default function ClassTable({ classData }: ClassTableProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (className: string) => {
    if (confirm(`Are you sure you want to delete ${className}? This will remove all associated subjects, units, and chapters.`)) {
      setIsDeleting(className);
      const result = await deleteClass(className);
      setIsDeleting(null);
      
      if (result.success) {
        router.refresh();
      } else {
        alert("Error deleting class: " + result.error);
      }
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Class Detail</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Confirmed Students</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Manage Subjects</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {classData.map((cls) => (
              <tr key={cls.name} className="hover:bg-slate-50/30 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Presentation className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {cls.name === "LKG" || cls.name === "UKG" ? cls.name : `Class ${cls.name}`}
                      </p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Section A</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full items-center gap-1.5 ring-1 ring-slate-200/50">
                      <Users className="h-3.5 w-3.5" />
                      <span className="text-xs font-black tracking-tight">{cls.count}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <Link 
                    href={`/office/academy-management/classes/${cls.name}/subjects`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10 active:scale-95"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    View Subjects
                  </Link>
                </td>
                <td className="px-8 py-5 text-right">
                  <ActionDropdown 
                    actions={[
                      {
                        label: "View Students",
                        icon: <Users className="h-4 w-4" />,
                        onClick: () => router.push(`/office/school-management/classes/${cls.name}`)
                      },
                      {
                        label: isDeleting === cls.name ? "Deleting..." : "Delete Class",
                        icon: isDeleting === cls.name ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />,
                        variant: "danger",
                        onClick: () => handleDelete(cls.name)
                      }
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
