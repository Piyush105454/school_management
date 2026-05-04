"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

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
import { ADMISSION_STEPS, getComputedStep, getStatusText, getStepRedirect } from "../utils/admissionSteps";

interface AdmissionProcessListProps {
  admissions: any[];
  role?: string;
}

export function AdmissionProcessList({ admissions, role }: AdmissionProcessListProps) {
  const router = useRouter();
  const [selectedAdm, setSelectedAdm] = useState<any | null>(null);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newCredentials, setNewCredentials] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const getStepBadge = (adm: any) => {
    const computedStep = getComputedStep(adm);
    const c = (ADMISSION_STEPS as any)[computedStep] || { name: `Step ${computedStep}`, icon: ClipboardCheck, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-100" };
    const Icon = c.icon;
    const redirectUrl = getStepRedirect(adm);

    return (
      <Link 
        href={redirectUrl}
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border transition-all hover:scale-105 active:scale-95 group/badge cursor-pointer", 
          c.color, c.bg, c.border
        )}
      >
        <Icon size={12} className="group-hover/badge:rotate-12 transition-transform"/> {c.name}
      </Link>
    );
  };

  const getStatusBadge = (adm: any) => {
    const status = getStatusText(adm);
    const hasScholarship = adm.awardedScholarship;

    const scholarshipBadge = hasScholarship && (
      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-tighter text-center italic">
        Scholarship Reward
      </span>
    );

    if (status === "Admitted") return (
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-200 uppercase tracking-wider text-center">Admitted</span>
        {scholarshipBadge}
      </div>
    );
    
    if (status === "Final Approved") return (
       <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 uppercase tracking-wider text-center">Final Approved</span>
          {scholarshipBadge}
       </div>
    );

    const colors: Record<string, string> = {
      "Remarks Sent": "text-amber-700 bg-amber-50 border-amber-200 shadow-sm shadow-amber-100/50",
      "Home Visit": "text-amber-600 bg-amber-50 border-amber-100",
      "Entrance Test": "text-cyan-600 bg-cyan-50 border-cyan-100",
      "Document Verified": "text-emerald-600 bg-emerald-50 border-emerald-100",
      "Awaiting Verification": "text-amber-600 bg-amber-50 border-amber-100",
      "Final Approval Pending": "text-blue-600 bg-blue-50 border-blue-100",
      "Drafting Application": "text-amber-600 bg-amber-50 border-amber-100",
    };

    return (
      <span className={cn(
        "text-[10px] font-black px-2 py-1 rounded-md border uppercase tracking-wider",
        colors[status] || "text-slate-600 bg-slate-50 border-slate-100"
      )}>
        {status}
      </span>
    );
  };


  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Applied Class</th>
                <th className="px-6 py-4">Roll No</th>
                <th className="px-6 py-4">Scholar No</th>
                <th className="px-6 py-4">Current Step</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Form Progress</th>

                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admissions.map((adm) => (
                <tr key={adm.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 whitespace-nowrap">
                      {adm.entryNumber || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{adm.inquiry?.studentName}</p>
                      <p className="text-xs text-slate-500">{adm.profile?.user?.email || adm.inquiry?.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                       {adm.inquiry?.appliedClass?.toLowerCase().startsWith('class') 
                         ? adm.inquiry?.appliedClass 
                         : `Class ${adm.inquiry?.appliedClass || 'N/A'}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 min-w-[40px] inline-block">
                      {adm.academyStudent?.rollNumber || "--"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                      {adm.academyStudent?.scholarNumber || "--"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getStepBadge(adm)}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(adm)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-1000",
                            adm.profile?.admissionStep >= 11 ? "w-full bg-green-500" : "bg-blue-500"
                          )}
                          style={{ width: `${Math.min((getComputedStep(adm) / 15) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {Math.min(Math.round((getComputedStep(adm) / 15) * 100), 100)}% Complete
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block text-left">
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === adm.id ? null : adm.id)}
                        className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="More Actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {openMenuId === adm.id && (
                        <>
                          {/* Backdrop for click outside */}
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                          
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-20 animate-in fade-in-0 zoom-in-95 duration-100">
                            <Link
                              href={`/office/admissions/${adm.id}`}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                              onClick={() => setOpenMenuId(null)}
                            >
                              <FileText size={14} className="text-indigo-600" />
                              <span>View Application</span>
                            </Link>
                            

                            <button 
                              onClick={() => {
                                setOpenMenuId(null);
                                setSelectedAdm(adm);
                                setNewCredentials(null);
                                setShowAccountModal(true);
                              }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors text-left cursor-pointer"
                            >
                              <Shield size={14} className="text-blue-600" />
                              <span>View Credentials</span>
                            </button>


                          </div>
                        </>
                      )}
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
                {newCredentials || selectedAdm.inquiry?.passwordPlain ? (
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded-xl border border-green-100">
                    <code className="text-green-700 font-bold">
                      {newCredentials ? newCredentials.password : selectedAdm.inquiry?.passwordPlain}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(newCredentials ? newCredentials.password : selectedAdm.inquiry?.passwordPlain)} 
                      className="p-2 hover:bg-green-100 rounded-lg text-green-600 transition-all"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-slate-100 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 italic">••••••••••••</span>
                    {role !== "TEACHER" && (
                      <button 
                        onClick={handleResetPassword}
                        disabled={resetting}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        {resetting ? <Loader2 size={12} className="animate-spin" /> : <Key size={12} />}
                        Reset & Show
                      </button>
                    )}
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

