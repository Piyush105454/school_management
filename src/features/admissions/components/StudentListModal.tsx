"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { getAdmissionsForList } from "../actions/admissionActions";
import { Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";

interface StudentListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StudentListModal({ isOpen, onClose }: StudentListModalProps) {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getAdmissionsForList().then((res: any) => {
        if (res.success) {
          setAdmissions(res.data);
        }
        setLoading(false);
      });
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Applications List">
      <div className="min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
          </div>
        ) : admissions.length === 0 ? (
          <p className="text-center text-slate-500 py-12">No applications found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admissions.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-slate-900">{adm.inquiry?.studentName}</p>
                        <p className="text-xs text-slate-500">{adm.inquiry?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                        Class {adm.inquiry?.appliedClass}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/office/admissions/${adm.id}`}
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10 active:scale-95"
                      >
                        View <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
