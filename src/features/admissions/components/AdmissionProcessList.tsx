"use client";

import React, { useState } from "react";
import { 
  UserCheck,
  ClipboardCheck, 
  Clock, 
  CheckCircle2, 
  MoreVertical,
  Mail,
  UserPlus,
  MapPin,
  BookOpen,
  Users,
  CreditCard,
  Shield,
  Key,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  FileText
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { resetStudentPassword } from "../actions/inquiryActions";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AdmissionProcessListProps {
  admissions: any[];
}

export function AdmissionProcessList({ admissions }: AdmissionProcessListProps) {
  const [selectedAdm, setSelectedAdm] = useState<any | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newCredentials, setNewCredentials] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const handleResetPassword = async () => {
    if (!selectedAdm?.profile?.user?.email) return;
    setResetting(true);
    const result = await resetStudentPassword(selectedAdm.profile.user.email) as any;
    setResetting(false);
    if (result.success) {
      setNewCredentials(result.credentials);
    } else {
      alert("Error: " + result.error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 font-outfit">Admission Progress</h2>
          <p className="text-sm text-slate-500 mt-1">Track students who have started their admission forms.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Applied Class</th>
                <th className="px-6 py-4">Current Step</th>
                <th className="px-6 py-4">Form Progress</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admissions.map((adm) => (
                <tr key={adm.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{adm.inquiry?.studentName}</p>
                      <p className="text-xs text-slate-500">{adm.profile?.user?.email || adm.inquiry?.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                      Class {adm.inquiry?.appliedClass}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {adm.profile?.admissionStep === 1 && <span className="flex items-center gap-1.5 text-xs font-bold text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-full border border-yellow-100"><Clock size={12}/> Bio Info</span>}
                      {adm.profile?.admissionStep === 2 && <span className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100"><UserCheck size={12}/> Stats/ID</span>}
                      {adm.profile?.admissionStep === 3 && <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100"><MapPin size={12}/> Address</span>}
                      {adm.profile?.admissionStep === 4 && <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100"><BookOpen size={12}/> Academic</span>}
                      {adm.profile?.admissionStep === 5 && <span className="flex items-center gap-1.5 text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100"><Users size={12}/> Siblings</span>}
                      {adm.profile?.admissionStep === 6 && <span className="flex items-center gap-1.5 text-xs font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-100"><Users size={12}/> Parents</span>}
                      {adm.profile?.admissionStep === 7 && <span className="flex items-center gap-1.5 text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100"><CreditCard size={12}/> Bank</span>}
                      {adm.profile?.admissionStep >= 8 && <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100"><CheckCircle2 size={12}/> Submitted</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-1000",
                            adm.profile?.admissionStep >= 8 ? "w-full bg-green-500" :
                            `bg-blue-500`
                          )}
                          style={{ width: `${(adm.profile?.admissionStep / 8) * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {Math.round((adm.profile?.admissionStep / 8) * 100)}% Complete
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/office/admissions/${adm.id}`}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View Application"
                      >
                        <FileText size={18} />
                      </Link>
                      <button 
                        onClick={() => {
                          setSelectedAdm(adm);
                          setNewCredentials(null);
                          setShowAccountModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Login Details"
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={showAccountModal} 
        onClose={() => setShowAccountModal(false)}
        title="Student Login Details"
      >
        {selectedAdm && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <UserCheck size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Student Name</p>
                  <p className="text-lg font-black text-slate-900">{selectedAdm.inquiry?.studentName}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Login Email</p>
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                  <code className="text-blue-600 font-bold">{selectedAdm.profile?.user?.email || selectedAdm.inquiry?.email}</code>
                  <button onClick={() => copyToClipboard(selectedAdm.profile?.user?.email || selectedAdm.inquiry?.email)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-all">
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Password</p>
                {newCredentials ? (
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded-xl border border-green-100">
                    <code className="text-green-700 font-bold">{newCredentials.password}</code>
                    <button onClick={() => copyToClipboard(newCredentials.password)} className="p-2 hover:bg-green-100 rounded-lg text-green-600 transition-all">
                      <Copy size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-slate-100 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 italic">••••••••••••</span>
                    <button 
                      onClick={handleResetPassword}
                      disabled={resetting}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      {resetting ? <Loader2 size={12} className="animate-spin" /> : <Key size={12} />}
                      Reset & Show
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowAccountModal(false)}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Close
              </button>
              <Link 
                href="/" 
                target="_blank"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                Go to Login <ExternalLink size={18} />
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

