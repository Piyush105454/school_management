"use client";

import React, { useState } from "react";
import { useForm, FormProvider, useFormContext, useFieldArray } from "react-hook-form";
import { 
  GraduationCap, 
  MapPin, 
  BookOpen, 
  Users, 
  CreditCard, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  Loader2,
  Plus,
  Trash2,
  UserCheck,
  Download,
  FileText,
  Eye,
  X,
  Verified,
  ClipboardCheck,
  Phone,
  Calendar,
  Clock,
  MapPinned,
  AlertCircle,
  Upload,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { submitFullAdmissionForm, saveAdmissionStep, verifyAdmission, getDocumentContent, deleteDocument, saveOfficeRemark, finalizeFinalAdmission, resetFeeRoute, getDirectUploadUrl } from "../actions/admissionActions";
import { rejectAffidavit } from "../actions/documentActions";
import { scheduleEntranceTest, getEntranceTestData, updateTestResult } from "../actions/testActions";
import { generateAdmissionPDF } from "../utils/generateAdmissionPDF";
import { OfficeTestManager } from "./OfficeTestManager";
import { OfficeHomeVisitManager } from "./OfficeHomeVisitManager";
import { ensureCompressed, compressImageToBase64 } from "@/lib/compression";

const steps = [
  { id: 1, name: "Bio Info", icon: GraduationCap },
  { id: 2, name: "Stats/ID", icon: UserCheck },
  { id: 3, name: "Address", icon: MapPin },
  { id: 4, name: "Academic", icon: BookOpen },
  { id: 5, name: "Siblings", icon: Users },
  { id: 6, name: "Parents", icon: Users },
  { id: 7, name: "Bank", icon: CreditCard },
  { id: 8, name: "Docs", icon: FileText },
  { id: 9, name: "Review", icon: Download },
  { id: 10, name: "Verify", icon: ClipboardCheck },
  { id: 11, name: "Test", icon: Calendar },
  { id: 12, name: "Visit", icon: MapPinned },
  { id: 13, name: "Final", icon: CheckCircle },
];

export function OfficeAdmissionForm({ 
  admissionId, 
  initialData, 
  maxStep = 1,
  initialStep,
  teachers = [],
  role = "OFFICE"
}: { 
  admissionId: string, 
  initialData?: any, 
  maxStep?: number,
  initialStep?: number,
  teachers?: any[],
  role?: string
}) {
  const [currentStep, setCurrentStep] = useState(initialStep || (maxStep >= 13 ? 13 : Math.max(1, Math.min(maxStep, 12))));
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const openInNewTab = async (data: string) => {
    if (!data) return;
    if (data.startsWith("data:")) {
      try {
        const parts = data.split(",");
        const mime = parts[0].match(/:(.*?);/)?.[1] || "application/octet-stream";
        const binary = atob(parts[1]);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
          array.push(binary.charCodeAt(i));
        }
        const blob = new Blob([new Uint8Array(array)], { type: mime });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        // We don't revoke immediately because the new tab needs it to load
      } catch (err) {
        console.error("New tab opening error:", err);
        window.open(data, "_blank");
      }
    } else {
      window.open(data, "_blank");
    }
  };


  const defaults = {
    studentBio: {
      firstName: "", middleName: "", lastName: "", gender: "M", dob: "", age: 0,
      religion: "", caste: "GEN", familyId: "", bloodGroup: "", heightCm: "",
      weightKg: "", aadhaarNumber: "", samagraId: "", cwsn: false, cwsnProblemDesc: ""
    },
    address: {
      houseNo: "", wardNo: "", street: "", village: "", tehsil: "", district: "", state: "", pinCode: ""
    },
    previousAcademic: {
      schoolName: "", schoolType: "PRIVATE", apaarId: "", penNumber: "",
      classLastAttended: "", sessionYear: "", marksObtained: "", totalMarks: "", percentage: "", passFail: "PASS"
    },
    parentsGuardians: [
      { personType: "FATHER", name: "", mobileNumber: "", occupation: "", qualification: "", aadhaarNumber: "", samagraNumber: "", photo: "" },
      { personType: "MOTHER", name: "", mobileNumber: "", occupation: "", qualification: "", aadhaarNumber: "", samagraNumber: "", photo: "" }
    ],
    siblings: [],
    bankDetails: {
      bankName: "", accountHolderName: "", accountNumber: "", ifscCode: "", note: ""
    },
    documents: {
      birthCertificate: "", studentPhoto: "", marksheet: "", casteCertificate: "", affidavit: "", transferCertificate: "", scholarshipSlip: ""
    },
    declaration: {
      declarationAccepted: false,
      guardianName: ""
    },
  };

  const methods = useForm({
    defaultValues: defaults
  });

  const storageKey = `admission_draft_office_${admissionId}`;

  React.useEffect(() => {
    const loadData = () => {
      let mergedData = { ...defaults };
      if (initialData) {
        if (initialData.studentBio?.dob) {
          initialData.studentBio.dob = new Date(initialData.studentBio.dob).toISOString().split('T')[0];
        }
        Object.keys(initialData).forEach(key => {
          const val = initialData[key];
          if (val !== null && val !== undefined) {
             if (Array.isArray(val)) {
                if (val.length > 0) mergedData[key as keyof typeof defaults] = val as any;
             } else if (typeof val === 'object') {
                if (Object.keys(val).length > 0) {
                  mergedData[key as keyof typeof defaults] = { 
                    ...(mergedData[key as keyof typeof defaults] as object),
                    ...val 
                  } as any;
                }
             } else {
                mergedData[key as keyof typeof defaults] = val;
             }
          }
        });
      }
      methods.reset(mergedData);
      const targetStep = maxStep && maxStep > 13 ? 13 : maxStep || 1;
      setCurrentStep(targetStep);
    };
    loadData();
  }, [initialData, methods, admissionId, maxStep]);


  const dob = methods.watch("studentBio.dob");
  React.useEffect(() => {
    if (dob) {
      const birthDate = new Date(dob);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age >= 0) {
          methods.setValue("studentBio.age", age);
        }
      }
    }
  }, [dob, methods]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    const result = await submitFullAdmissionForm(admissionId, data, 9) as any;
    setLoading(false);
    if (result.success) {
      alert("Changes saved successfully!");
    } else {
      alert("Error: " + (result.error?.message || result.error || "Unknown error"));
    }
  };

  const nextStep = async () => {
    const fieldsByStep: Record<number, any> = {
      1: "studentBio", 2: "studentBio", 3: "address", 4: "previousAcademic",
      5: "siblings", 6: "parentsGuardians", 7: "bankDetails", 8: "documents", 9: "declaration",
      10: [], 11: [], 12: []
    };
    const currentFields = fieldsByStep[currentStep];
    const isValid = !currentFields || currentFields.length === 0 ? true : await methods.trigger(currentFields);
    if (isValid) {
      if (currentStep === 8) {
        const docs = methods.getValues("documents");
        if (!docs?.studentPhoto) {
          alert("Student Photo is mandatory!");
          return;
        }
      }
      setLoading(true);
      const prevStepVal = currentStep;
      setCurrentStep(prev => Math.min(prev + 1, 14));
      const data = methods.getValues();
      const stepData: any = { [currentFields]: (data as any)[currentFields] };
      const saveRes = await saveAdmissionStep(admissionId, prevStepVal, stepData) as any;
      setLoading(false);
      if (!saveRes.success) {
         console.error("saveAdmissionStep error:", saveRes.error);
         alert("Progress could not be saved to server.");
      }
    }
  };



  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to approve this admission?")) return;
    setVerifying(true);
    const res = await verifyAdmission(admissionId);
    setVerifying(false);
    if (res.success) {
      alert("Documents Verified Successfully!");
      window.location.reload();
    } else {
      alert("Error verifying documents: " + res.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-inter">
      <div className="max-w-6xl mx-auto mb-8 space-y-4 animate-in slide-in-from-top-4 duration-500">
        {initialData?.admissionMeta?.officeRemarks && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 md:p-6 flex items-start gap-4 shadow-sm">
                <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                    <ClipboardCheck className="text-red-600" size={20} />
                </div>
                <div className="space-y-1">
                    <h4 className="text-sm font-black text-red-900 uppercase tracking-tight">General Requirement Remark</h4>
                    <p className="text-xs font-bold text-red-700 leading-relaxed italic">
                        "{initialData.admissionMeta.officeRemarks}"
                    </p>
                </div>
            </div>
        )}

        {initialData?.admissionMeta?.documentRemarks && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 md:p-6 flex items-start gap-4 shadow-sm">
                <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="text-amber-600" size={20} />
                </div>
                <div className="space-y-1">
                    <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Document Review Remark</h4>
                    <p className="text-xs font-bold text-amber-700 leading-relaxed italic">
                        "{initialData.admissionMeta.documentRemarks}"
                    </p>
                </div>
            </div>
        )}

        {initialData?.admissionMeta?.verificationRemarks && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 md:p-6 flex items-start gap-4 shadow-sm">
                <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <ClipboardCheck className="text-blue-600" size={20} />
                </div>
                <div className="space-y-1">
                    <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Verification Step Remark</h4>
                    <p className="text-xs font-bold text-blue-700 leading-relaxed italic">
                        "{initialData.admissionMeta.verificationRemarks}"
                    </p>
                </div>
            </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto mb-10 overflow-x-auto no-scrollbar pb-2">
        <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between min-w-[750px] px-2 md:px-4">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isPast = (currentStep > step.id);
              const isUnlocked = true; 
              
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-1.5 group transition-all duration-200 cursor-pointer" onClick={() => setCurrentStep(step.id)}>
                    <div className={cn(
                      "h-8 w-8 md:h-9 md:w-9 rounded-lg flex items-center justify-center transition-all duration-300 border-2",
                      isActive ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/10" : 
                      isPast ? "bg-emerald-500 border-emerald-500" : "border-slate-100 text-slate-400 bg-slate-50"
                    )}>
                      <step.icon size={16} className={cn(isActive || isPast ? "text-white" : "text-slate-400")} />
                    </div>
                    <span className={cn("text-[9px] font-bold uppercase tracking-widest text-center", isActive ? "text-blue-600" : isPast ? "text-emerald-600" : "text-slate-400")}>
                      {step.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "h-px flex-1 mx-1 md:mx-2",
                      isPast ? "bg-emerald-200" : "bg-slate-100")} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 mb-6">
        <div className="p-4 md:p-8 flex flex-col bg-white">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="flex-1">
              {maxStep >= 10 && role === "OFFICE" && (
                <div className="flex justify-end max-w-3xl mx-auto mb-4 px-4 md:px-0">
                  <button 
                    type="button" 
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl font-black uppercase text-[10px] md:text-xs tracking-wider transition-all shadow-sm border",
                      isEditMode ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                    )}
                  >
                    {isEditMode ? "Cancel Editing" : "Unlock Details Editing"}
                  </button>
                </div>
              )}

              <div className="max-w-3xl mx-auto">
                <fieldset disabled={maxStep >= 13 && !isEditMode} className="space-y-4">
                  {currentStep === 1 && <BioStep />}
                  {currentStep === 2 && <ProfileStatsStep />}
                  {currentStep === 3 && <AddressStep />}
                  {currentStep === 4 && <AcademicStep />}
                  {currentStep === 5 && <SiblingsStep />}
                  {currentStep === 6 && <ParentsStep />}
                  {currentStep === 7 && <BankStep />}
                  {currentStep === 8 && <OfficeDocumentsStep admissionId={admissionId} initialData={initialData} onPreviewDirect={openInNewTab} />}
                  {currentStep === 9 && <DownloadApplicationStep data={methods.getValues()} onDownload={(type: 'ADMISSION' | 'FULL_PACKAGE') => generateAdmissionPDF(methods.getValues(), `${methods.getValues("studentBio.firstName")} ${methods.getValues("studentBio.lastName")}`)} downloading={loading} />}
                  {currentStep === 10 && <OfficeVerificationStep admissionId={admissionId} initialData={initialData} onPreviewDirect={openInNewTab} />}
                  {currentStep === 11 && <OfficeEntranceTestStep admissionId={admissionId} initialData={initialData} teachers={teachers} role={role} />}
                  {currentStep === 12 && <OfficeHomeVisitStep admissionId={admissionId} initialData={initialData} teachers={teachers} role={role} />}
                  {currentStep === 13 && <OfficeFinalStep admissionId={admissionId} initialData={initialData} userRole={role} />}
                </fieldset>
                {currentStep >= 14 && maxStep >= 14 && <SubmissionSuccessStep data={initialData} />}
              </div>
            </form>
          </FormProvider>

          {currentStep < 14 && (
            <div className="mt-10 md:mt-16 flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-200/60 max-w-3xl mx-auto w-full gap-4">
              <div className="flex gap-2 w-full md:w-auto">
                <button 
                  type="button"
                  onClick={prevStep} 
                  disabled={currentStep === 1} 
                  className="flex-1 md:w-auto group flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl text-slate-600 font-bold hover:bg-slate-200/50 transition-all duration-200 disabled:opacity-30 border border-slate-100"
                >
                  <ChevronLeft size={22} className="group-hover:-translate-x-1 transition-transform" /> Previous
                </button>

              </div>
              
              <div className="flex gap-3 w-full md:w-auto">
                 {currentStep < 13 ? (
                   <button 
                     type="button" 
                     onClick={nextStep} 
                     className="flex-1 md:w-auto group flex items-center justify-center gap-3 px-10 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-slate-900/10"
                   >
                      Next Step <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                 ) : currentStep === 13 && maxStep >= 14 ? (
                    <button 
                      type="button"
                      onClick={() => setCurrentStep(14)}
                      className="flex-1 md:w-auto flex items-center justify-center gap-3 px-10 py-3.5 bg-blue-600 text-white rounded-2xl font-black tracking-tight hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30"
                    >
                      View Success Status <CheckCircle size={22} />
                    </button>
                 ) : null}
              </div>
            </div>
          )}
          
          {(currentStep === 9 || currentStep === 10) && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => generateAdmissionPDF(methods.getValues(), methods.getValues("studentBio.firstName") + " " + methods.getValues("studentBio.lastName"))}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold uppercase tracking-widest text-xs bg-blue-50 px-6 py-3 rounded-xl border border-blue-100 transition-all hover:bg-blue-100"
              >
                <Download size={16} /> Download Filled Form (PDF)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// SHARED COMPONENTS - EXACT PARITY WITH STUDENT AdmissionForm.tsx
const inputStyles = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-200 placeholder:text-slate-400 font-medium text-slate-700 text-sm md:text-base";
const labelStyles = "text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block";

const ErrorMessage = ({ error }: { error: any }) => {
  if (!error) return null;
  const message = error.message || "This field is required";
  return <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{message}</p>;
};

const getInputClass = (error: any) => cn(
  inputStyles,
  error && "border-red-500 focus:ring-red-500/10 focus:border-red-500 bg-red-50/10"
);

function BioStep() {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="space-y-1">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Basic Bio-Data</h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Step 1: Primary identification details.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="space-y-1">
          <label className={labelStyles}>First Name*</label>
          <input {...register("studentBio.firstName", { required: true })} className={getInputClass((errors.studentBio as any)?.firstName)} placeholder="John" />
          <ErrorMessage error={(errors.studentBio as any)?.firstName} />
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>Middle Name</label>
          <input {...register("studentBio.middleName")} className={inputStyles} placeholder="Albert" />
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>Last Name*</label>
          <input {...register("studentBio.lastName", { required: true })} className={getInputClass((errors.studentBio as any)?.lastName)} placeholder="Doe" />
          <ErrorMessage error={(errors.studentBio as any)?.lastName} />
        </div>
        
        <div className="space-y-1">
          <label className={labelStyles}>Date of Birth*</label>
          <input type="date" {...register("studentBio.dob", { required: true })} className={getInputClass((errors.studentBio as any)?.dob)} />
          <ErrorMessage error={(errors.studentBio as any)?.dob} />
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>Gender*</label>
          <select {...register("studentBio.gender", { required: true })} className={getInputClass((errors.studentBio as any)?.gender)}>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </select>
          <ErrorMessage error={(errors.studentBio as any)?.gender} />
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>Age*</label>
          <input type="number" {...register("studentBio.age", { required: true, min: 0 })} className={getInputClass((errors.studentBio as any)?.age)} placeholder="Years" />
          <ErrorMessage error={(errors.studentBio as any)?.age} />
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>Religion</label>
          <input {...register("studentBio.religion")} className={inputStyles} placeholder="Hinduism" />
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>Category*</label>
          <select {...register("studentBio.caste", { required: true })} className={getInputClass((errors.studentBio as any)?.caste)}>
            <option value="GEN">General</option>
            <option value="OBC">OBC</option>
            <option value="SC">SC</option>
            <option value="ST">ST</option>
          </select>
          <ErrorMessage error={(errors.studentBio as any)?.caste} />
        </div>
        <div className="space-y-1 md:col-span-2">
           <label className={labelStyles}>Family ID</label>
           <input {...register("studentBio.familyId")} className={inputStyles} placeholder="8 Digit Family ID" />
        </div>
      </div>
    </div>
  );
}

function ProfileStatsStep() {
    const { register, watch, formState: { errors } } = useFormContext();
    return (
      <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-1">
          <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Identity & Health</h3>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Step 2: ID numbers and physical metrics.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-1">
                <label className={labelStyles}>Aadhaar Number (12 Digits)*</label>
                <input {...register("studentBio.aadhaarNumber", { 
                    required: "Student Aadhaar is required", 
                    pattern: { value: /^\d{12}$/, message: "Must be 12 digits" } 
                })} className={getInputClass((errors.studentBio as any)?.aadhaarNumber)} placeholder="0000 0000 0000" maxLength={12} />
                <ErrorMessage error={(errors.studentBio as any)?.aadhaarNumber} />
            </div>
            <div className="space-y-1">
                <label className={labelStyles}>Samagra ID*</label>
                <input {...register("studentBio.samagraId", { 
                    required: "Samagra ID is required", 
                    pattern: { value: /^\d{9}$/, message: "Must be 9 digits" } 
                })} className={getInputClass((errors.studentBio as any)?.samagraId)} placeholder="9 Digit ID" maxLength={9} />
                <ErrorMessage error={(errors.studentBio as any)?.samagraId} />
            </div>
            <div className="space-y-1">
                <label className={labelStyles}>Blood Group</label>
                <select {...register("studentBio.bloodGroup")} className={inputStyles}>
                    <option value="">Select</option>
                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
            </div>
            <div className="space-y-1 flex gap-3 md:gap-4">
                <div className="flex-1">
                    <label className={labelStyles}>Height (cm)</label>
                    <input type="number" step="0.1" {...register("studentBio.heightCm")} className={inputStyles} placeholder="0.0" />
                </div>
                <div className="flex-1">
                    <label className={labelStyles}>Weight (kg)</label>
                    <input type="number" step="0.1" {...register("studentBio.weightKg")} className={inputStyles} placeholder="0.0" />
                </div>
            </div>

            <div className="md:col-span-2 space-y-3 p-4 md:p-6 rounded-xl bg-blue-50/50 border border-blue-100">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" {...register("studentBio.cwsn")} className="h-4 w-4 md:h-5 md:w-5 rounded border-slate-300 text-blue-600" />
                    <span className="text-xs md:text-sm font-bold text-slate-700 uppercase">Child with Special Needs?</span>
                </label>
                {watch("studentBio.cwsn") && (
                    <div className="space-y-1">
                        <label className={labelStyles}>Description</label>
                        <textarea {...register("studentBio.cwsnProblemDesc")} className={cn(inputStyles, "h-20 resize-none")} placeholder="Describe the condition..." />
                    </div>
                )}
            </div>
        </div>
      </div>
    );
}

function SiblingsStep() {
    const { control, register } = useFormContext();
    const { fields, append, remove } = useFieldArray({ control, name: "siblings" });
  
    return (
      <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-2 flex justify-between items-end gap-2">
            <div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Siblings</h3>
                <p className="text-xs md:text-sm text-slate-500 font-medium">Step 5: Information about brothers/sisters.</p>
            </div>
            <button 
                type="button"
                onClick={() => append({ name: "", age: "", gender: "M", classCurrent: "", schoolName: "This School" })}
                className="flex items-center gap-2 bg-slate-900 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold hover:bg-black transition-all uppercase tracking-widest"
            >
                <Plus size={14} /> Add New
            </button>
        </div>
  
        <div className="space-y-3 md:space-y-4">
          {fields.length === 0 && (
            <div className="p-8 md:p-12 text-center border-2 border-dashed border-slate-100 rounded-2xl md:rounded-3xl">
                <p className="text-xs md:text-sm text-slate-400 font-medium italic">No sibling records added.</p>
            </div>
          )}
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-white border border-slate-100 shadow-sm relative group">
              <button 
                type="button"
                onClick={() => remove(index)}
                className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="space-y-1">
                  <label className={labelStyles}>Name</label>
                  <input {...register(`siblings.${index}.name`)} className={inputStyles} />
                </div>
                <div className="space-y-1">
                  <label className={labelStyles}>Age</label>
                  <input type="number" {...register(`siblings.${index}.age`)} className={inputStyles} />
                </div>
                <div className="space-y-1">
                  <label className={labelStyles}>Class</label>
                  <select {...register(`siblings.${index}.classCurrent`)} className={inputStyles}>
                    <option value="">Select Class</option>
                    {["LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
}

function AddressStep() {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-1">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Address</h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Step 3: Residential address.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-1 md:col-span-2">
          <label className={labelStyles}>House No / Street / Colony*</label>
          <input {...register("address.houseNo", { required: true })} className={getInputClass((errors.address as any)?.houseNo)} placeholder="Building name, Street address" />
          <ErrorMessage error={(errors.address as any)?.houseNo} />
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>Village / City*</label>
          <input {...register("address.village", { required: true })} className={getInputClass((errors.address as any)?.village)} placeholder="Enter your city" />
          <ErrorMessage error={(errors.address as any)?.village} />
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>Tehsil / Block</label>
          <input {...register("address.tehsil")} className={inputStyles} placeholder="Local block" />
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>District*</label>
          <input {...register("address.district", { required: true })} className={getInputClass((errors.address as any)?.district)} placeholder="District" />
          <ErrorMessage error={(errors.address as any)?.district} />
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>Pin Code*</label>
          <input {...register("address.pinCode", { required: true })} className={getInputClass((errors.address as any)?.pinCode)} placeholder="6 Digit Code" maxLength={6} />
          <ErrorMessage error={(errors.address as any)?.pinCode} />
        </div>
      </div>
    </div>
  );
}

function AcademicStep() {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-1">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Academic</h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Step 4: Last school attended.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-1 md:col-span-2">
          <label className={labelStyles}>Last School Name*</label>
          <input {...register("previousAcademic.schoolName", { required: "Last school name is required" })} className={getInputClass((errors.previousAcademic as any)?.schoolName)} placeholder="Enter full school name" />
          <ErrorMessage error={(errors.previousAcademic as any)?.schoolName} />
        </div>
        <div className="grid grid-cols-2 gap-4 md:col-span-2">
            <div className="space-y-1">
                <label className={labelStyles}>APAAR ID</label>
                <input {...register("previousAcademic.apaarId")} className={inputStyles} />
            </div>
            <div className="space-y-1">
                <label className={labelStyles}>PEN Number</label>
                <input {...register("previousAcademic.penNumber")} className={inputStyles} />
            </div>
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>Class Attended</label>
          <select {...register("previousAcademic.classLastAttended")} className={inputStyles}>
            <option value="">Select Class</option>
            {["LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>Percentage (%)</label>
          <input type="number" step="0.01" {...register("previousAcademic.percentage")} className={inputStyles} placeholder="0.00" />
        </div>
      </div>
    </div>
  );
}

function ParentsStep() {
  const { control, register, getValues, setValue, watch, formState: { errors } } = useFormContext();
  const { fields, append } = useFieldArray({ control, name: "parentsGuardians" });
  const [uploading, setUploading] = useState<Record<number, boolean>>({});

  React.useEffect(() => {
    if (fields.length === 0) {
      append([
        { personType: "FATHER", name: "", mobileNumber: "", occupation: "", qualification: "", aadhaarNumber: "", samagraNumber: "", photo: "" },
        { personType: "MOTHER", name: "", mobileNumber: "", occupation: "", qualification: "", aadhaarNumber: "", samagraNumber: "", photo: "" }
      ]);
    }
  }, [fields, append]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(prev => ({ ...prev, [index]: true }));
      try {
        // Auto-compress photos to 500KB if they are larger
        const finalFile = await ensureCompressed(file, 0.5);
        
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const compressed = reader.result as string;
            setValue(`parentsGuardians.${index}.photo`, compressed, { shouldValidate: true, shouldDirty: true });
          } catch (e) {
            console.error("Reader error:", e);
          } finally {
            setUploading(prev => ({ ...prev, [index]: false }));
          }
        };
        reader.readAsDataURL(finalFile);
      } catch (err) {
        console.error("Compression failed:", err);
        alert("Failed to process image.");
        setUploading(prev => ({ ...prev, [index]: false }));
      }
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-4 md:pb-6">
      <div className="space-y-1 flex flex-col md:flex-row justify-between items-start md:items-end gap-3 md:gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Parents</h3>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Step 6: Father and Mother information.</p>
        </div>
        <button 
          type="button"
          onClick={() => append({ personType: "GUARDIAN", name: "", mobileNumber: "", occupation: "", qualification: "", aadhaarNumber: "", samagraNumber: "", photo: "" })}
          className="bg-slate-900 text-white px-3 md:px-5 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold hover:bg-black transition-all flex items-center gap-2 uppercase tracking-widest"
        >
          <Plus size={14} /> Add Guard
        </button>
      </div>

      <div className="space-y-4 md:space-y-6">
        {fields.map((field, index) => {
          const parentErrors = (errors.parentsGuardians as any)?.[index];
          const photoValue = watch(`parentsGuardians.${index}.photo`);
          const isUploading = uploading[index];

          return (
            <div key={field.id} className="p-4 md:p-6 rounded-xl bg-white border border-slate-100 shadow-sm space-y-4 md:space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="inline-flex px-3 py-1 rounded-full bg-slate-900 text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none">
                  {(getValues as any)(`parentsGuardians.${index}.personType`)}
                </h4>

                <div className="flex items-center gap-4">
                   <div className="relative group">
                     <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200 group-hover:border-blue-400 overflow-hidden relative transition-all shadow-inner">
                       {photoValue ? (
                         <div className="relative h-full w-full">
                           <img src={photoValue} className="w-full h-full object-cover" alt="Parent preview" />
                           {/* Preview Overlay */}
                           <button 
                             type="button"
                             onClick={() => {
                                if (photoValue.startsWith("data:")) {
                                  // For temporary base64 preview
                                  const win = window.open();
                                  win?.document.write(`<img src="${photoValue}" />`);
                                } else {
                                  // For S3 documents, use the Secure Proxy
                                  const pType = (getValues as any)(`parentsGuardians.${index}.personType`);
                                  // id will be handled by the backend if we pass the admissionId context, 
                                  // but here we just need to ensure the URL is correct.
                                  // The actual admissionId is passed to the main form, we can use window location if needed
                                  // but let's just use the current form state.
                                  const searchParams = new URLSearchParams(window.location.search);
                                  const idFromPath = window.location.pathname.split('/').pop();
                                  window.open(`/api/view-doc?id=${idFromPath}&field=parent_${pType}&type=standard&v=${Date.now()}`, "_blank");
                                }
                             }}
                             className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                             title="View Photo"
                           >
                             <Eye size={16} />
                           </button>
                         </div>
                       ) : isUploading ? (
                         <Loader2 className="animate-spin text-blue-500 h-5 w-5" />
                       ) : (
                         <div className="flex flex-col items-center">
                            <Plus size={16} className="text-slate-300" />
                            <span className="text-[8px] font-black text-slate-300 uppercase">Add</span>
                         </div>
                       )}
                     </div>
                     
                     {/* Floating Upload Button */}
                     <label className={cn(
                        "absolute -bottom-1 -right-1 cursor-pointer bg-white rounded-full p-1.5 border border-slate-200 shadow-sm hover:bg-slate-50 transition-all",
                        isUploading && "pointer-events-none opacity-50"
                      )}>
                       <Upload size={10} className="text-blue-500" />
                       <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, index)} />
                     </label>
                   </div>

                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Photo</span>
                       <p className="text-[9px] font-medium uppercase tracking-tighter">
                          {photoValue ? (
                            <span className="text-emerald-600 font-black">Available</span>
                          ) : (
                            <span className="text-red-500 font-black">Missing</span>
                          )}
                       </p>
                    </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1">
                  <label className={labelStyles}>Full Name*</label>
                  <input {...register(`parentsGuardians.${index}.name`, { required: true })} className={getInputClass(parentErrors?.name)} />
                  <ErrorMessage error={parentErrors?.name} />
                </div>
                <div className="space-y-1">
                  <label className={labelStyles}>Mobile Number*</label>
                  <input {...register(`parentsGuardians.${index}.mobileNumber`, { required: true })} className={getInputClass(parentErrors?.mobileNumber)} />
                  <ErrorMessage error={parentErrors?.mobileNumber} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1">
                  <label className={labelStyles}>Occupation</label>
                  <input {...register(`parentsGuardians.${index}.occupation`)} className={inputStyles} />
                </div>
                <div className="space-y-1">
                  <label className={labelStyles}>Aadhaar Number*</label>
                  <input {...register(`parentsGuardians.${index}.aadhaarNumber`, { 
                      required: "Parent Aadhaar is required", 
                      pattern: { value: /^\d{12}$/, message: "Must be 12 digits" } 
                  })} className={getInputClass(parentErrors?.aadhaarNumber)} placeholder="12 Digit Aadhaar" maxLength={12} />
                  <ErrorMessage error={parentErrors?.aadhaarNumber} />
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelStyles}>Qualification</label>
                <input {...register(`parentsGuardians.${index}.qualification`)} className={inputStyles} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BankStep() {
    const { register, formState: { errors } } = useFormContext();
    return (
      <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-1">
          <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Bank</h3>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Step 7: For scholarship and DBT.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-1">
                <label className={labelStyles}>Bank Name*</label>
                <input {...register("bankDetails.bankName", { required: "Bank name is required" })} className={getInputClass((errors.bankDetails as any)?.bankName)} placeholder="e.g. State Bank of India" />
                <ErrorMessage error={(errors.bankDetails as any)?.bankName} />
            </div>
            <div className="space-y-1">
                <label className={labelStyles}>IFSC Code*</label>
                <input {...register("bankDetails.ifscCode", { 
                    required: "IFSC code is required",
                    pattern: { value: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: "Invalid IFSC format (e.g. SBIN0001234)" }
                })} className={getInputClass((errors.bankDetails as any)?.ifscCode)} placeholder="11 Digit IFSC" maxLength={11} />
                <ErrorMessage error={(errors.bankDetails as any)?.ifscCode} />
            </div>
            <div className="space-y-1 md:col-span-2">
                <label className={labelStyles}>Account Holder Name*</label>
                <input {...register("bankDetails.accountHolderName", { required: "Account holder name is required" })} className={getInputClass((errors.bankDetails as any)?.accountHolderName)} placeholder="Same as in passbook" />
                <ErrorMessage error={(errors.bankDetails as any)?.accountHolderName} />
            </div>
            <div className="space-y-1 md:col-span-2">
                <label className={labelStyles}>Account Number*</label>
                <input {...register("bankDetails.accountNumber", { 
                    required: "Account number is required",
                    minLength: { value: 9, message: "Min 9 digits" },
                    maxLength: { value: 18, message: "Max 18 digits" }
                })} className={getInputClass((errors.bankDetails as any)?.accountNumber)} placeholder="Enter 9 to 18 digits" />
                <ErrorMessage error={(errors.bankDetails as any)?.accountNumber} />
            </div>
        </div>
      </div>
    );
}

function OfficeDocumentsStep({ admissionId, initialData, onPreviewDirect }: { admissionId: string, initialData: any, onPreviewDirect: (url: string) => void }) {
  const { watch, setValue } = useFormContext();
  const [fetchingDoc, setFetchingDoc] = useState<string | null>(null);

  const documentList = [
    { id: "birthCertificate", name: "Birth Certificate", hindi: "जन्म प्रमाण पत्र" },
    { id: "studentPhoto", name: "Student Photo", hindi: "विद्यार्थी की फोटो" },
    { id: "marksheet", name: "Previous Marksheet", hindi: "पिछली कक्षा की अंकसूची" },
    { id: "casteCertificate", name: "Caste Certificate", hindi: "जाति प्रमाण पत्र" },
    { id: "affidavit", name: "Affidavit", hindi: "शपथ पत्र" },
    { id: "transferCertificate", name: "Transfer Certificate (TC)", hindi: "स्थानांतरण प्रमाण पत्र" },
    { id: "scholarshipSlip", name: "Scholarship Slip", hindi: "छात्रवृत्ति पर्ची" },
  ];
  const [remark, setRemark] = useState((initialData?.admissionMeta?.documentRemarks as string) || "");
  const [savingRemark, setSavingRemark] = useState(false);

  const handleSaveRemark = async (unlock: boolean) => {
    setSavingRemark(true);
    const res = await saveOfficeRemark(admissionId, remark, unlock ? 8 : undefined, "documentRemarks");
    setSavingRemark(false);
    if (res.success) {
      alert(unlock ? "Remark saved and Document Upload step (8) UNLOCKED for student!" : "Remark saved successfully.");
    } else {
      alert("Error saving remark: " + ((res as any).error));
    }
  };
  const handlePreview = (docId: string) => {
    window.open(`/api/view-doc?id=${admissionId}&field=${docId}`, "_blank");
  };

  const handleDelete = async (docId: string) => {
    if (!confirm(`Are you sure you want to REJECT and DELETE this document (${docId})?`)) return;
    setFetchingDoc(docId);
    const res = await deleteDocument(admissionId, docId);
    setFetchingDoc(null);
    if (res.success) {
      setValue(`documents.${docId}`, null);
      alert("Document deleted successfully. Status is now PENDING.");
    } else {
      alert("Error deleting document: " + res.error);
    }
  };

  const [verifying, setVerifying] = useState(false);

  const documents = watch("documents") || {};
  const isGeneral = initialData?.studentBio?.caste === "GEN";

  const missingDocs = [
    !documents.studentPhoto && "Student Photo",
    !documents.affidavit && "Affidavit",
    (!isGeneral && !documents.casteCertificate) && "Caste Certificate"
  ].filter(Boolean) as string[];

  const canVerify = missingDocs.length === 0;

  const handleVerifyAll = async () => {
    if (!canVerify) {
      alert("Missing required documents: " + missingDocs.join(", "));
      return;
    }
    if (!confirm("Are all documents verified? This will mark the application as 100% complete.")) return;
    
    setVerifying(true);
    const res = await verifyAdmission(admissionId);
    setVerifying(false);
    
    if (res.success) {
      alert("Documents Verified Successfully! Application is now 100% complete.");
      window.location.reload();
    } else {
      alert("Error: " + res.error);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto pb-20">
      <div className="space-y-1 text-center">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase italic underline decoration-blue-500 decoration-4 underline-offset-8">Review Documents</h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Step 8: Verify all uploaded records.</p>
      </div>
      
      <div className="space-y-2 md:space-y-3">
        {documentList.map((doc) => {
          const fileData = watch(`documents.${doc.id}`);
          
          return (
            <DocumentRow 
                key={doc.id} 
                doc={doc} 
                fileData={fileData} 
                fetching={fetchingDoc === doc.id}
                onPreview={() => handlePreview(doc.id)}
                onDelete={() => handleDelete(doc.id)}
            />
          );
        })}
      </div>

      <div className="mt-10 p-6 bg-slate-50 rounded-[32px] border border-blue-100 shadow-inner space-y-6">
        <div className="flex items-center gap-3 px-2">
            <ClipboardCheck size={18} className="text-blue-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Admission Office Remark</span>
        </div>
        
        <textarea 
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            className="w-full text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-2xl p-5 min-h-[120px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 shadow-sm"
            placeholder="Type document problems or verification remarks here..."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
                type="button"
                onClick={() => handleSaveRemark(false)}
                disabled={savingRemark}
                className="px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
                {savingRemark && !verifying ? <Loader2 size={16} className="animate-spin" /> : "Save Remark Only"}
            </button>
            <button
                type="button"
                onClick={() => handleSaveRemark(true)}
                disabled={savingRemark}
                className="px-6 py-4 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl font-black text-xs hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
            >
                <UserCheck size={16} /> Mark Correction Needed
            </button>
        </div>

        <button
            type="button"
            onClick={handleVerifyAll}
            disabled={verifying || !canVerify}
            className={cn(
                "w-full px-6 py-5 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95",
                canVerify ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20" : "bg-slate-200 text-slate-400 cursor-not-allowed grayscale"
            )}
        >
            {verifying ? <Loader2 size={18} className="animate-spin" /> : <Verified size={18} />}
            {canVerify ? "Complete Verification (100%)" : "Pending Required Records"}
        </button>

        {!canVerify && (
            <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 text-center">
                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">
                    Missing: {missingDocs.join(" | ")}
                </p>
                <p className="text-[8px] font-bold text-red-400 uppercase tracking-widest mt-0.5">
                    (Birth Cert, Marksheet, TC and Scholarship Slip are Optional)
                </p>
            </div>
        )}
      </div>
    </div>
  );
}

function DocumentRow({ doc, fileData, fetching, onPreview, onDelete }: { doc: any, fileData: any, fetching: boolean, onPreview: () => void, onDelete: () => void }) {
  const { formState: { errors } } = useFormContext();
  const hasError = (errors.documents as any)?.[doc.id];
  
  return (
    <div key={doc.id} className={cn(
       "flex items-center justify-between p-3 md:p-4 rounded-xl border bg-white shadow-sm transition-all",
       hasError ? "border-red-200 bg-red-50/10" : "border-slate-100 hover:border-blue-100"
    )}>
      <div className="flex-1 min-w-0 pr-4">
        <p className={cn("text-[10px] md:text-xs font-black uppercase tracking-tight truncate", hasError ? "text-red-600" : "text-slate-900")}>{doc.name}</p>
        <p className="text-[9px] md:text-[10px] text-slate-500 font-bold truncate">{doc.hindi}</p>
        {hasError && <p className="text-[8px] font-black text-red-500 uppercase mt-0.5">Missing from student</p>}
      </div>
      
      <div className="flex items-center gap-2">
        {fileData ? (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[8px] md:text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 md:px-3 py-1 rounded-full border border-emerald-100">
              <CheckCircle size={10} /> DONE
            </span>
            <button 
                type="button"
                disabled={fetching}
                onClick={onPreview}
                className="h-8 w-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
            >
                {fetching ? <Loader2 size={14} className="animate-spin" /> : <Eye size={16} />}
            </button>
            <button 
                type="button"
                disabled={fetching}
                onClick={onDelete}
                className="h-8 w-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
            >
                {fetching ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={16} />}
            </button>
          </div>
        ) : (
          <span className="text-[8px] md:text-[9px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 uppercase">
            Pending
          </span>
        )}
      </div>
    </div>
  );
}

function DownloadApplicationStep({ data, onDownload, downloading }: { data: any, onDownload: (type: 'ADMISSION' | 'FULL_PACKAGE') => void, downloading: boolean }) {
  const handleDownload = () => onDownload('FULL_PACKAGE');

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="space-y-1">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Review Application</h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium font-outfit">Step 9: Review filled application PDF.</p>
      </div>
      
      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-5 mt-4 group hover:bg-white hover:border-blue-100 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-blue-50">
              <Download size={28} />
          </div>
          <div className="space-y-1">
              <h4 className="font-black text-slate-800 uppercase tracking-tight font-outfit">PDF Generated</h4>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Review the complete application for accuracy</p>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-3 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-[11px] px-8 py-4 rounded-2xl shadow-xl shadow-slate-900/10 transition-all hover:shadow-2xl active:scale-95 disabled:opacity-50"
          >
            {downloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            {downloading ? "Generating..." : "View Application PDF"}
          </button>
      </div>
    </div>
  );
}

function OfficeVerificationStep({ admissionId, initialData, onPreviewDirect }: { admissionId: string, initialData: any, onPreviewDirect: (url: string) => void }) {
  const { watch } = useFormContext();
  const [loading, setLoading] = useState(false);
  const [fetchingPreview, setFetchingPreview] = useState(false);
  const [remark, setRemark] = useState((initialData?.admissionMeta?.verificationRemarks as string) || "");
  const [savingRemark, setSavingRemark] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  const checklist = initialData?.documentChecklist || {};
  const hasAffidavit = checklist.parentAffidavit === "SUBMITTED" || checklist.parentAffidavit === "VERIFIED";

  const documents = watch("documents") || {};
  const isGeneral = initialData?.studentBio?.caste === "GEN";

  const missingDocs = [
    !documents.studentPhoto && "Student Photo",
    !documents.affidavit && "Affidavit",
    (!isGeneral && !documents.casteCertificate) && "Caste Certificate"
  ].filter(Boolean) as string[];

  const canVerify = missingDocs.length === 0;

  const handlePreviewAffidavit = () => {
    window.open(`/api/view-doc?id=${admissionId}&field=affidavit&type=affidavit`, "_blank");
  };

  const handleApprove = async () => {
    if (!confirm("Approve this affidavit? This will mark admission as verified.")) return;
    setLoading(true);
    const res = await verifyAdmission(admissionId);
    setLoading(false);
    if (res.success) {
      alert("Verified Successfully!");
      window.location.reload();
    } else {
      alert("Error: " + res.error);
    }
  };

  const handleReject = async () => {
    if (!confirm("Reject this affidavit? Student will need to upload again.")) return;
    setLoading(true);
    const res = await rejectAffidavit(admissionId);
    setLoading(false);
    if (res.success) {
      alert("Affidavit Rejected.");
      window.location.reload();
    } else {
      alert("Error: " + res.error);
    }
  };

  const handleSaveRemark = async (unlock: boolean) => {
    setSavingRemark(true);
    const res = await saveOfficeRemark(admissionId, remark, unlock ? 10 : undefined, "verificationRemarks");
    setSavingRemark(false);
    if (res.success) {
      alert(unlock ? "Remark saved and Affidavit Verification step (10) UNLOCKED for student!" : "Remark saved successfully.");
    } else {
      alert("Error saving remark: " + ((res as any).error));
    }
  };

  const handleVerifyAll = async () => {
    if (!canVerify) {
      alert("Missing required documents: " + missingDocs.join(", "));
      return;
    }
    if (!confirm("Are all documents verified? This will mark the application as 100% complete.")) return;
    
    setVerifying(true);
    const res = await verifyAdmission(admissionId);
    setVerifying(false);
    
    if (res.success) {
      alert("Documents Verified Successfully! Application is now 100% complete.");
      window.location.reload();
    } else {
      alert("Error: " + res.error);
    }
  };

  const isVerified = (initialData?.studentProfile?.admissionStep ?? 0) >= 11;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto pb-20">
      <div className="space-y-1 text-center">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Affidavit Verification</h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Step 10: Review and sign off on submitted documents.</p>
      </div>

      <div className="w-full">
        {!hasAffidavit ? (
          <div className="bg-amber-50 border border-amber-100 p-10 rounded-3xl text-center space-y-4">
            <div className="h-16 w-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <FileText size={32} />
            </div>
            <p className="text-sm font-black text-amber-900 uppercase tracking-tight">Affidavit Not Uploaded</p>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Waiting for student to upload</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Submitted Affidavit</p>
                <button 
                  type="button" 
                  disabled={fetchingPreview}
                  onClick={handlePreviewAffidavit} 
                  className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline disabled:opacity-50 flex items-center gap-2"
                >
                  {fetchingPreview ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Fetching Document...
                    </>
                  ) : (
                    "Click to View Full Document (New Tab)"
                  )}
                </button>
              </div>
            </div>

            {!isVerified ? (
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  type="button"
                  onClick={handleReject}
                  disabled={loading}
                  className="py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-100 transition-all flex items-center justify-center gap-2 border border-red-100 shadow-sm shadow-red-500/5"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} Reject
                </button>
                <button 
                  type="button"
                  onClick={handleApprove}
                  disabled={loading}
                  className="py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Approve
                </button>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center gap-4">
                 <div className="h-10 w-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
                    <CheckCircle size={20} />
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-emerald-900 uppercase tracking-tight leading-none">Officially Verified</h4>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Review locked for this record</p>
                 </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-10 p-6 bg-slate-50 rounded-[32px] border border-blue-100 shadow-inner space-y-6">
        <div className="flex items-center gap-3 px-2">
            <ClipboardCheck size={18} className="text-blue-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Admission Office Remark</span>
        </div>
        
        <textarea 
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            disabled={savingRemark}
            className={cn(
                "w-full text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-2xl p-5 min-h-[120px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 shadow-sm",
                savingRemark && "bg-slate-50 opacity-50"
            )}
            placeholder="Type document problems or verification remarks here..."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
                type="button"
                onClick={() => handleSaveRemark(false)}
                disabled={savingRemark}
                className="px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
                {savingRemark && !verifying ? <Loader2 size={16} className="animate-spin" /> : "Save Remark Only"}
            </button>
            <button
                type="button"
                onClick={() => handleSaveRemark(true)}
                disabled={savingRemark}
                className="px-6 py-4 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl font-black text-xs hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
            >
                <UserCheck size={16} /> Mark Correction Needed
            </button>
        </div>

        <button
            type="button"
            onClick={handleVerifyAll}
            disabled={verifying || !canVerify || isVerified}
            className={cn(
                "w-full px-6 py-5 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95",
                isVerified ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default" :
                canVerify ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20" : "bg-slate-200 text-slate-400 cursor-not-allowed grayscale"
            )}
        >
            {verifying ? <Loader2 size={18} className="animate-spin" /> : isVerified ? <CheckCircle size={18} /> : <Verified size={18} />}
            {isVerified ? "RECORD VERIFIED" : canVerify ? "Complete Verification (100%)" : "Pending Required Records"}
        </button>

        {!canVerify && !isVerified && (
            <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 text-center">
                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">
                    Missing: {missingDocs.join(" | ")}
                </p>
                <p className="text-[8px] font-bold text-red-400 uppercase tracking-widest mt-0.5">
                    (Birth Cert, Marksheet, TC and Scholarship Slip are Optional)
                </p>
            </div>
        )}
      </div>
    </div>
  );
}

function OfficeEntranceTestStep({ admissionId, initialData, teachers = [], role = "OFFICE" }: { admissionId: string, initialData: any, teachers?: any[], role?: string }) {
  // Use a wrapper that provides the same interface as OfficeTestManager but formatted for a form step
  const applicant = {
    id: admissionId,
    entryNumber: initialData.admissionMeta?.entryNumber,
    entranceTest: initialData.entranceTest,
    inquiry: initialData.admissionMeta?.inquiry,
    studentProfile: initialData.studentProfile
  };

  // Note: We'll import a simplified version or just use the logic directly here for deep integration
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto pb-20">
      <div className="space-y-1 text-center">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Entrance Test</h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Step 11: Schedule and record test results.</p>
      </div>
      
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <OfficeTestManager applicant={applicant} teachers={teachers} role={role} />
      </div>
    </div>
  );
}

function OfficeHomeVisitStep({ admissionId, initialData, teachers = [], role = "OFFICE" }: { admissionId: string, initialData: any, teachers?: any[], role?: string }) {
  const applicant = {
    id: admissionId,
    entryNumber: initialData.admissionMeta?.entryNumber,
    homeVisit: initialData.homeVisit,
    inquiry: initialData.admissionMeta?.inquiry,
    studentProfile: initialData.studentProfile,
    entranceTest: initialData.entranceTest
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto pb-20">
      <div className="space-y-1 text-center">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Home Visit</h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Step 12: Conduct and document the home observation.</p>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <OfficeHomeVisitManager applicant={applicant} teachers={teachers} role={role} />
      </div>
    </div>
  );
}

function SubmissionSuccessStep({ data }: { data: any }) {
  const bio = data.studentBio || {};
  return (
    <div className="animate-in zoom-in-95 fade-in duration-500 py-4 md:py-8">
      <div className="text-center space-y-4 md:space-y-6 mb-8 md:mb-12">
        <div className="inline-flex items-center justify-center h-20 w-20 md:h-24 md:w-24 rounded-[32px] bg-blue-50 text-blue-600 shadow-xl shadow-blue-500/10 border border-blue-100">
          <Verified size={48} strokeWidth={2.5} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 font-outfit tracking-tight uppercase italic">Admission Finalized</h2>
          <p className="text-sm md:text-lg text-slate-500 font-bold uppercase tracking-widest leading-none">Record has been successfully moved to regular administration.</p>
        </div>
      </div>

      <div className="bg-slate-50/50 rounded-[32px] border border-slate-100 p-6 md:p-10 space-y-8 md:space-y-12 shadow-inner text-center">
            <p className="font-black text-2xl uppercase">{bio.firstName} {bio.lastName}</p>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em]">Process Complete</p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
                <button
                    type="button"
                    onClick={() => window.location.href = "/office/admissions-progress"}
                    className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.15em] text-xs hover:bg-black transition-all active:scale-95 shadow-2xl"
                >
                    Back to Admissions List
                </button>
            </div>
      </div>
    </div>
  );
}
function OfficeFinalStep({ admissionId, initialData, userRole }: { admissionId: string, initialData: any, userRole: string }) {
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [approveScholarship, setApproveScholarship] = useState(false);
  const studentName = initialData?.inquiry?.studentName || "the student";
  const isAdmitted = initialData?.studentProfile?.isFullyAdmitted;
  const appliedScholarship = initialData?.admissionMeta?.appliedScholarship;
  const isFeeChoicePending = appliedScholarship === null;

  const handleFinalize = async () => {
    if (isFeeChoicePending) {
        alert("Cannot finalize: Student must select a fee route first.");
        return;
    }
    if (!confirm(`Are you sure you want to officially ADMIT ${studentName}?${approveScholarship ? ' (with Scholarship)' : ''}`)) return;
    setLoading(true);
    const res = await finalizeFinalAdmission(admissionId, approveScholarship, 36000) as any;
    setLoading(false);
    if (res.success) {
      alert("Student Admitted Successfully!");
      window.location.reload();
    } else {
      alert("Error: " + (res.error || "Unknown error"));
    }
  };

  const handleResetFeeRoute = async () => {
    if (!confirm(`Are you sure you want to UNLOCK the fee route? This will reset the selection to PENDING and move the student back to Step 9.`)) return;
    setResetting(true);
    const res = await resetFeeRoute(admissionId) as any;
    setResetting(false);
    if (res.success) {
      alert("Fee route unlocked successfully!");
      window.location.reload();
    } else {
      alert("Error: " + (res.error || "Unknown error"));
    }
  };

  return (
    <div className="space-y-10 py-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="text-center space-y-4">
        <div className="mx-auto h-20 w-20 bg-blue-50 text-blue-600 rounded-[28px] flex items-center justify-center shadow-xl shadow-blue-500/10 border border-blue-100/50">
          <CheckCircle size={40} strokeWidth={2.5} />
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tight font-outfit">Final Admission Approval</h2>
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">Official enrollment confirmation of {studentName}</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 p-8 space-y-8 shadow-sm">
        {!isAdmitted ? (
          <div className="space-y-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Fee Route</p>
                  <div className="flex items-center gap-2">
                    {appliedScholarship === true && (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm shadow-emerald-500/10">SCHOLARSHIP APPLIED</span>
                    )}
                    {appliedScholarship === false && (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-800 border border-blue-200 shadow-sm shadow-blue-500/10">NORMAL FEE SELECTED</span>
                    )}
                    {isFeeChoicePending && (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200">CHOICE PENDING</span>
                    )}
                  </div>
                </div>

                {!isAdmitted && appliedScholarship !== null && userRole === "OFFICE" && (
                  <button
                    type="button"
                    onClick={handleResetFeeRoute}
                    disabled={resetting}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all font-black uppercase text-[9px] tracking-widest mt-4 disabled:opacity-50"
                  >
                    {resetting ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                    Unlock Fee Option
                  </button>
                )}
              </div>
              
              {appliedScholarship === true && userRole === "OFFICE" && (
                <label className="flex items-center gap-3 cursor-pointer bg-emerald-600 text-white px-5 py-3 rounded-2xl border border-emerald-500 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 group">
                  <input 
                    type="checkbox" 
                    checked={approveScholarship} 
                    onChange={(e) => setApproveScholarship(e.target.checked)}
                    className="rounded-lg border-white/20 text-emerald-800 focus:ring-emerald-500 h-5 w-5 bg-white/20"
                  />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Approve Scholarship</span>
                    <span className="text-[8px] font-bold opacity-80 uppercase tracking-wider mt-0.5">36,000 Total Award</span>
                  </div>
                </label>
              )}
              {appliedScholarship === true && userRole === "TEACHER" && (
                <div className="flex flex-col items-end">
                   <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-md border border-emerald-100">Scholarship Approval Pending</span>
                   <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Office Action Required</p>
                </div>
              )}
            </div>

            {isFeeChoicePending ? (
              <div className="p-10 bg-amber-50 border-2 border-dashed border-amber-200 rounded-[32px] text-center space-y-3">
                 <AlertCircle size={40} className="text-amber-500 mx-auto opacity-50" />
                 <p className="text-sm font-black text-amber-900 uppercase tracking-tight">Pending for Fee Choice</p>
                 <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest max-w-xs mx-auto">Admission cannot be finalized until the student selects between scholarship or normal fee route (Step 9).</p>
              </div>
            ) : userRole === "TEACHER" ? (
              <div className="p-10 bg-blue-50 border-2 border-dashed border-blue-100 rounded-[32px] text-center space-y-3">
                 <Shield size={40} className="text-blue-500 mx-auto opacity-50" />
                 <p className="text-sm font-black text-blue-900 uppercase tracking-tight">Teacher View Only</p>
                 <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest max-w-xs mx-auto">The final admission approval button is restricted to office administrative staff. Please contact the office for finalization.</p>
              </div>
            ) : (
              <>
                <div className="p-6 bg-blue-50/30 rounded-2xl border border-blue-100/50 space-y-4 shadow-inner">
                  <div className="flex items-start gap-4 text-blue-800">
                      <AlertCircle size={24} className="shrink-0 mt-0.5 opacity-60" />
                      <div className="space-y-1">
                        <p className="text-xs font-black uppercase tracking-widest leading-none">Confirming Admission</p>
                        <p className="text-[10px] font-bold opacity-80 leading-relaxed uppercase pt-1.5">By clicking confirm, you are officially registering {studentName} in our school database. This will generate an official scholar number and trigger academic profile creation.</p>
                      </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleFinalize}
                    disabled={loading}
                    className="w-full bg-slate-900 text-white p-6 rounded-[32px] font-black uppercase tracking-[0.2em] text-sm hover:bg-black transition-all flex items-center justify-center gap-5 shadow-2xl shadow-slate-900/40 group active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} className="group-hover:scale-110 transition-transform" strokeWidth={2.5}/>}
                    Finalize & Admit Student Now
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-12 space-y-6">
            <div className="h-24 w-24 bg-emerald-100 text-emerald-600 rounded-[32px] flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
              <CheckCircle size={48} strokeWidth={2.5} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-emerald-900 uppercase italic font-outfit">Officially Admitted</h3>
              <p className="text-slate-500 text-xs font-black uppercase tracking-[0.15em]">This candidate is now a regular student of DPS Dhanpuri.</p>
            </div>
            <div className="flex justify-center gap-4">
               <div className="px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center min-w-[140px]">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Scholar ID</p>
                  <p className="text-lg font-black text-slate-900">{initialData?.studentProfile?.scholarNumber || "SCH-TEMP"}</p>
               </div>
               <div className="px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center min-w-[140px]">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Entry Date</p>
                  <p className="text-lg font-black text-slate-900 italic font-outfit">{new Date().toLocaleDateString('en-GB')}</p>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// SHARED COMPONENTS...
