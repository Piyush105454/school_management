"use client";

import React, { useState } from "react";
import { 
  CheckCircle, 
  XCircle,
  Eye,
  Download,
  FileText,
  User,
  MapPin,
  GraduationCap,
  Banknote,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdmissionReviewProps {
  admissionId: string;
  initialData: any;
}

export function AdmissionReview({ admissionId, initialData }: AdmissionReviewProps) {
  if (!initialData) {
    return (
      <div className="p-10 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No data available.</p>
      </div>
    );
  }

  const formatDate = (date: any) => {
    if (!date) return "-";
    if (typeof date === 'string') return date;
    if (date instanceof Date) return date.toLocaleDateString('en-IN');
    return String(date);
  };

  const bio = initialData.studentBio || {};
  const addr = initialData.address || {};
  const academic = initialData.previousAcademic || {};
  const bank = initialData.bankDetails || {};
  const parents = initialData.parentsGuardians || [];
  const siblings = initialData.siblings || [];
  const docs = initialData.documents || {};

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
            {bio.firstName} {bio.lastName}
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Application ID: <span className="text-slate-900">{admissionId.slice(0, 10)}</span>
          </p>
        </div>
        <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100">
           Reviewing Application
        </div>
      </div>

      {/* Vertical Steps */}
      <div className="space-y-4">
        
        {/* Step 1 & 2: Bio Data */}
        <ReviewSection title="Step 1 & 2: Student Identification" icon={User}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DataField label="First Name" value={bio.firstName} />
            <DataField label="Middle Name" value={bio.middleName} />
            <DataField label="Last Name" value={bio.lastName} />
            <DataField label="Gender" value={bio.gender === "M" ? "Male" : "Female"} />
            <DataField label="DOB" value={formatDate(bio.dob)} />
            <DataField label="Age" value={bio.age} />
            <DataField label="Caste" value={bio.caste} />
            <DataField label="Religion" value={bio.religion} />
            <DataField label="Aadhaar" value={bio.aadhaarNumber} />
            <DataField label="Samagra ID" value={bio.samagraId} />
            <DataField label="Family ID" value={bio.familyId} />
            <DataField label="Blood Group" value={bio.bloodGroup} />
          </div>
        </ReviewSection>

        {/* Step 3: Address */}
        <ReviewSection title="Step 3: Residential Address" icon={MapPin}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <DataField label="Full Address" value={`${addr.houseNo || ""}, ${addr.street || ""}`} />
            </div>
            <DataField label="Village/City" value={addr.village} />
            <DataField label="District" value={addr.district} />
            <DataField label="State" value={addr.state} />
            <DataField label="PIN Code" value={addr.pinCode} />
          </div>
        </ReviewSection>

        {/* Step 4: Academic */}
        <ReviewSection title="Step 4: Academic Details" icon={GraduationCap}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DataField label="Previous School" value={academic.schoolName} />
            <DataField label="Class Last Attended" value={academic.classLastAttended} />
            <DataField label="Total Marks" value={academic.totalMarks} />
            <DataField label="Percentage" value={academic.percentage ? `${academic.percentage}%` : ""} />
            <DataField label="APAAR ID" value={academic.apaarId} />
            <DataField label="PEN Number" value={academic.penNumber} />
          </div>
        </ReviewSection>

        {/* Step 5: Siblings */}
        <ReviewSection title="Step 5: Siblings" icon={Users}>
          {siblings.length > 0 ? (
            <div className="space-y-2">
              {siblings.map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-4 text-xs bg-white p-2 border border-slate-100 rounded-lg">
                  <span className="font-black text-slate-400">#{i+1}</span>
                  <span className="font-bold text-slate-700 min-w-[150px]">{s.name}</span>
                  <span className="text-slate-500 uppercase text-[10px]">Class: {s.classCurrent}</span>
                  <span className="text-slate-500 uppercase text-[10px]">Age: {s.age}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 italic">No siblings mentioned.</p>
          )}
        </ReviewSection>

        {/* Step 6: Parents */}
        <ReviewSection title="Step 6: Parents/Guardians" icon={Users}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parents.map((p: any, i: number) => (
              <div key={i} className="p-3 border border-slate-100 rounded-xl bg-slate-50/30">
                <p className="text-[9px] font-black text-blue-600 uppercase mb-2">{p.personType}</p>
                <div className="grid grid-cols-2 gap-3">
                  <DataField label="Name" value={p.name} />
                  <DataField label="Mobile" value={p.mobileNumber} />
                  <DataField label="Qualification" value={p.qualification} />
                  <DataField label="Occupation" value={p.occupation} />
                </div>
              </div>
            ))}
          </div>
        </ReviewSection>

        {/* Step 7: Bank */}
        <ReviewSection title="Step 7: Bank Details" icon={Banknote}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DataField label="Bank Name" value={bank.bankName} />
            <DataField label="Account Holder" value={bank.accountHolderName} />
            <DataField label="Account Number" value={bank.accountNumber} />
            <DataField label="IFSC Code" value={bank.ifscCode} />
          </div>
        </ReviewSection>

        {/* Step 8: Documents */}
        <ReviewSection title="Step 8: Document Verification" icon={FileText}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <DocPreview label="Birth Certificate" fieldName="birthCertificate" admissionId={admissionId} data={docs.birthCertificate} />
            <DocPreview label="Student Photo" fieldName="studentPhoto" admissionId={admissionId} data={docs.studentPhoto} />
            <DocPreview label="Marksheet" fieldName="marksheet" admissionId={admissionId} data={docs.marksheet} />
            <DocPreview label="Caste Cert" fieldName="casteCertificate" admissionId={admissionId} data={docs.casteCertificate} />
            <DocPreview label="TC" fieldName="transferCertificate" admissionId={admissionId} data={docs.transferCertificate} />
          </div>
        </ReviewSection>
      </div>

      {/* Action Footer */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="text-center md:text-left">
           <p className="text-sm font-bold text-slate-900 uppercase">Decision Required</p>
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Verify all documents before approval</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:px-8 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-black uppercase border border-slate-200 hover:bg-slate-200 transition-all">
             Reject
          </button>
          <button className="flex-1 md:px-8 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-black uppercase shadow-lg shadow-blue-600/10 hover:bg-blue-700 transition-all">
             Approve Admission
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewSection({ title, children, icon: Icon }: { title: string, children: React.ReactNode, icon: any }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
        <Icon size={14} className="text-slate-400" />
        <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em]">{title}</h3>
      </div>
      <div className="p-4 md:p-5">
        {children}
      </div>
    </div>
  );
}

function DataField({ label, value }: { label: string, value: any }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-xs font-bold text-slate-800 break-words">{value || "-"}</p>
    </div>
  );
}

function DocPreview({ label, fieldName, admissionId, data }: { label: string, fieldName: string, admissionId: string, data: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="group border border-slate-100 rounded-lg p-2 bg-slate-50/50 hover:bg-white transition-all flex flex-col gap-2">
        <div className="aspect-square bg-slate-200 rounded-md overflow-hidden relative cursor-pointer" onClick={() => setOpen(true)}>
          {data ? (
            <img 
              src={data?.startsWith("data:") ? data : `/api/view-doc?id=${admissionId}&field=${fieldName}&type=standard`} 
              alt={label} 
              className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all" 
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-400">
              <FileText size={20} />
            </div>
          )}
          {data && (
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <Eye size={16} className="text-white" />
            </div>
          )}
        </div>
        <div className="flex flex-col text-center">
            <span className="text-[9px] font-black text-slate-600 uppercase truncate">{label}</span>
            {data ? (
              <a 
                href={`/api/view-doc?id=${admissionId}&field=${fieldName}&type=standard`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[8px] font-bold text-blue-600 uppercase hover:underline flex items-center justify-center gap-1 mt-0.5"
              >
                <Download size={10} /> Get File
              </a>
            ) : (
              <span className="text-[8px] font-bold text-slate-300 uppercase mt-0.5 italic">Empty</span>
            )}
        </div>
      </div>

      {open && data && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 p-4 flex items-center justify-center" onClick={() => setOpen(false)}>
          <div className="max-w-3xl w-full bg-white p-2 rounded-xl" onClick={e => e.stopPropagation()}>
             <img 
               src={data?.startsWith("data:") ? data : `/api/view-doc?id=${admissionId}&field=${fieldName}&type=standard`} 
               alt={label} 
               className="max-h-[80vh] w-full object-contain mx-auto" 
             />
             <div className="mt-2 flex justify-between items-center px-2 pb-1">
                <span className="text-xs font-black uppercase text-slate-900">{label}</span>
                <button onClick={() => setOpen(false)} className="px-4 py-1.5 bg-slate-900 text-white rounded text-[10px] font-black uppercase">Close</button>
             </div>
          </div>
        </div>
      )}
    </>
  );
}
