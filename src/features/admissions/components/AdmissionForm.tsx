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
  Upload,
  AlertCircle,
  Eye,
  Lock,
  Send,
  Clock,
  Calendar,
  MapPinned,
  ClipboardCheck
} from "lucide-react";

import { cn } from "@/lib/utils";
import { submitFullAdmissionForm, saveAdmissionStep, getAdmissionData, getS3UploadContext, getDocumentContent } from "../actions/admissionActions";
import { ensureCompressed, compressImageToBase64 } from "@/lib/compression";
import { SmartUploader } from "./SmartUploader";
import { uploadAffidavit, removeAffidavit, submitAffidavit, getAffidavitContent } from "../actions/documentActions";
import { generateAdmissionPDF, generateMergedApplicationPDF } from "../utils/generateAdmissionPDF";
import { applyScholarship } from "../actions/admissionActions";
import { Circle } from "lucide-react";


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

const steps = [
  { id: 1, name: "Bio Info", icon: GraduationCap },
  { id: 2, name: "Stats/ID", icon: UserCheck },
  { id: 3, name: "Address", icon: MapPin },
  { id: 4, name: "Academic", icon: BookOpen },
  { id: 5, name: "Siblings", icon: Users },
  { id: 6, name: "Parents", icon: Users },
  { id: 7, name: "Bank", icon: CreditCard },
  { id: 8, name: "Docs", icon: FileText },
  { id: 9, name: "Download", icon: Download },
  { id: 10, name: "Verify", icon: FileText },
  { id: 11, name: "Test", icon: Calendar },
  { id: 12, name: "Visit", icon: MapPinned },
  { id: 13, name: "Final", icon: CheckCircle },
];

export function AdmissionForm({ 
  admissionId, 
  initialData, 
  maxStep = 1,
  initialStep 
}: { 
  admissionId: string, 
  initialData?: any, 
  maxStep?: number,
  initialStep?: number 
}) {
  const isActuallyAdmitted = initialData?.studentProfile?.isFullyAdmitted;
  const [currentStep, setCurrentStep] = useState(isActuallyAdmitted ? 13 : (initialStep || (maxStep >= 13 ? 13 : Math.max(1, maxStep || 1))));
  const [loading, setLoading] = useState(false);
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
      guardianName: "",
      appliedScholarship: ""
    },
  };

  const methods = useForm({
    defaultValues: defaults
  });

  const storageKey = `admission_draft_${admissionId}`;

  // 1. Initial Data Loading (DB + LocalStorage)
  React.useEffect(() => {
    const loadData = () => {
      let mergedData = { ...defaults };

      // Try LocalStorage first (contains most recent unsaved drafts)
      try {
        const localDraft = localStorage.getItem(storageKey);
        if (localDraft) {
          const parsed = JSON.parse(localDraft);
          mergedData = { ...mergedData, ...parsed };
        }
      } catch (e) {}

      // Merge with DB data (authoritative for saved steps)
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
      
      const targetStep = isActuallyAdmitted ? 13 : (initialStep || maxStep || 1);
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

  // 2. Background Saving (Local)
  const formValues = methods.watch();
  React.useEffect(() => {
    const throttleId = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(formValues));
      } catch (e) {}
    }, 1000);
    return () => clearTimeout(throttleId);
  }, [formValues, storageKey]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    const result = await submitFullAdmissionForm(admissionId, data, 9) as any;
    setLoading(false);
    
    if (result.success) {
      localStorage.removeItem(storageKey);
      alert("Application submitted successfully!");
      window.location.reload();
    } else {
      alert("Error: " + (result.error?.message || result.error || "Unknown error"));
    }
  };

  const nextStep = async () => {
    const fieldsByStep: Record<number, any> = {
      1: "studentBio", 2: "studentBio", 3: "address", 4: "previousAcademic",
      5: "siblings", 6: "parentsGuardians", 7: "bankDetails", 8: "documents"
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
      // Optimistic move
      const prevStepVal = currentStep;
      setCurrentStep(prev => Math.min(prev + 1, 13));
      
      // Save data
      const data = methods.getValues();
      const stepData: any = { [currentFields]: data[currentFields as keyof typeof data] };
      
      const saveRes = await saveAdmissionStep(admissionId, prevStepVal, stepData) as any;
      setLoading(false);
      
      if (!saveRes.success) {
         console.error("saveAdmissionStep error:", saveRes.error);
         alert("Progress could not be saved to server. Please check your connection.");
      }
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  
  const handleDownloadWithFullData = async (type: 'ADMISSION' | 'FULL_PACKAGE') => {
    setLoading(true);
    const data = methods.getValues();
    
    // Check if critical documents are "lite" placeholders and fetch them
    if (data.documents?.studentPhoto === "__EXISTING__") {
      try {
        const res = await getDocumentContent(admissionId, "studentPhoto");
        if (res.success && res.content) {
          data.documents.studentPhoto = res.content;
        }
      } catch (e) {
        console.error("Failed to fetch student photo:", e);
      }
    }
    
    try {
      const studentName = data.studentBio?.firstName ? `${data.studentBio.firstName} ${data.studentBio.lastName}` : "Student";
      if (type === 'ADMISSION') {
        generateAdmissionPDF(data, studentName);
      } else {
        await generateMergedApplicationPDF(data, studentName);
      }
    } catch (e) {
      console.error("Download error:", e);
      alert("Error generating PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-info font-inter">
      <div className="max-w-6xl mx-auto mb-8 space-y-4 animate-in slide-in-from-top-4 duration-500">
        {/* Hide general officeRemarks if the student has reached Step 13 or has already uploaded the affidavit in Step 10 */}
        {initialData?.admissionMeta?.officeRemarks && !initialData?.documents?.affidavit && !isActuallyAdmitted && (
            <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 md:p-8 flex items-start gap-4 md:gap-6 shadow-xl shadow-red-500/5">
                <div className="h-12 w-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0 border border-red-200 shadow-inner">
                    <AlertCircle className="text-red-600" size={24} />
                </div>
                <div className="space-y-2">
                    <h4 className="text-[10px] md:text-xs font-black text-red-900 uppercase tracking-[0.2em] flex items-center gap-2">
                      <AlertCircle size={14} /> General Remark
                    </h4>
                    <p className="text-sm md:text-base font-black text-red-700 leading-tight italic font-outfit">
                        "{initialData.admissionMeta.officeRemarks}"
                    </p>
                </div>
            </div>
        )}

        {/* Hide documentRemarks if Step 8 required documents are present */}
        {initialData?.admissionMeta?.documentRemarks && !initialData?.documents?.studentPhoto && !isActuallyAdmitted && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 md:p-8 flex items-start gap-4 md:gap-6 shadow-xl shadow-amber-500/5">
                <div className="h-12 w-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0 border border-amber-200 shadow-inner">
                    <FileText className="text-amber-600" size={24} />
                </div>
                <div className="space-y-2">
                    <h4 className="text-[10px] md:text-xs font-black text-amber-900 uppercase tracking-[0.2em] flex items-center gap-2">
                      <FileText size={14} /> Document Review Feedback
                    </h4>
                    <p className="text-sm md:text-base font-black text-amber-700 leading-tight italic font-outfit">
                        "{initialData.admissionMeta.documentRemarks}"
                    </p>
                </div>
            </div>
        )}

        {/* Hide verificationRemarks if the affidavit is already uploaded/submitted */}
        {initialData?.admissionMeta?.verificationRemarks && !initialData?.documents?.affidavit && !isActuallyAdmitted && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-6 md:p-8 flex items-start gap-4 md:gap-6 shadow-xl shadow-blue-500/5">
                <div className="h-12 w-12 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0 border border-blue-200 shadow-inner">
                    <ClipboardCheck className="text-blue-600" size={24} />
                </div>
                <div className="space-y-2">
                    <h4 className="text-[10px] md:text-xs font-black text-blue-900 uppercase tracking-[0.2em] flex items-center gap-2">
                      <ClipboardCheck size={14} /> Final Verification Remark
                    </h4>
                    <p className="text-sm md:text-base font-black text-blue-700 leading-tight italic font-outfit">
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
              const isUnlocked = maxStep >= step.id;
              
              return (
                <React.Fragment key={step.id}>
                  <div 
                    className={cn(
                      "flex flex-col items-center gap-1.5 group transition-all duration-200",
                      isUnlocked ? "cursor-pointer" : "opacity-30 cursor-not-allowed"
                    )} 
                    onClick={() => isUnlocked && setCurrentStep(step.id)}
                  >
                    <div className={cn(
                      "h-8 w-8 md:h-9 md:w-9 rounded-lg flex items-center justify-center transition-all duration-300 border-2",
                      isActive ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/10" : 
                      isPast ? "bg-emerald-500 border-emerald-500" : "border-slate-100 text-slate-400 bg-slate-50"
                    )}>
                      <step.icon size={16} className={cn(
                        isActive || isPast ? "text-white" : "text-slate-400"
                      )} />
                    </div>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-widest text-center",
                      isActive ? "text-blue-600" : isPast ? "text-emerald-600" : "text-slate-400"
                    )}>
                      {step.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "h-px flex-1 mx-1 md:mx-2",
                      isPast ? "bg-emerald-200" : "bg-slate-100"
                    )} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 mb-6 max-w-6xl mx-auto">
        <div className="p-4 md:p-8 flex flex-col bg-white">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="flex-1">
              <div className="max-w-3xl mx-auto">
                <fieldset disabled={maxStep >= 13} className="space-y-4">
                  {currentStep === 1 && <BioStep />}
                  {currentStep === 2 && <ProfileStatsStep />}
                  {currentStep === 3 && <AddressStep />}
                  {currentStep === 4 && <AcademicStep />}
                  {currentStep === 5 && <SiblingsStep />}
                  {currentStep === 6 && <ParentsStep admissionId={admissionId} />}
                  {currentStep === 7 && <BankStep />}
                  {currentStep === 8 && <DocumentsStep admissionId={admissionId} />}
                </fieldset>
                
                {currentStep === 9 && <DownloadApplicationStep data={methods.getValues()} onDownload={handleDownloadWithFullData} downloading={loading} />}
                  {currentStep === 10 && <DocumentVerificationStep 
                    admissionId={admissionId} 
                    initialDocData={initialData?.documents} 
                    initialChecklistData={initialData?.documentChecklist} 
                    studentName={`${methods.getValues("studentBio.firstName")} ${methods.getValues("studentBio.lastName")}`} 
                    officeRemarks={initialData?.admissionMeta?.officeRemarks}
                    studentStep={maxStep}
                    isActuallyAdmitted={isActuallyAdmitted}
                  />}
                  {currentStep === 11 && <EntranceTestStatusStep admissionId={admissionId} initialData={initialData} />}
                  {currentStep === 12 && <HomeVisitStatusStep admissionId={admissionId} initialData={initialData} />}
                  {currentStep === 13 && <SubmissionSuccessStep 
                    data={initialData} 
                    admissionId={admissionId} 
                    onDownload={handleDownloadWithFullData} 
                    downloading={loading} 
                    initialChecklist={initialData?.documentChecklist}
                    isActuallyAdmitted={isActuallyAdmitted} 
                  />}
              </div>
            </form>
          </FormProvider>
          
          {currentStep < 13 && (
            <div className="mt-10 md:mt-16 flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-200/60 max-w-3xl mx-auto w-full gap-4">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="w-full md:w-auto group flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl text-slate-600 font-bold hover:bg-slate-200/50 transition-all duration-200 disabled:opacity-30 border border-slate-100 md:border-transparent hover:border-slate-200"
              >
                <ChevronLeft size={22} className="group-hover:-translate-x-1 transition-transform" /> Previous
              </button>
              
              <div className="flex gap-3 w-full md:w-auto">
                  {currentStep < 10 ? (
                    <button 
                      type="button" 
                      onClick={nextStep} 
                      className="flex-1 md:w-auto group flex items-center justify-center gap-3 px-10 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-slate-900/10"
                    >
                       Next Step <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : currentStep === 10 && (maxStep >= 11 || isActuallyAdmitted) ? (
                    <button 
                      type="button"
                      onClick={() => setCurrentStep(11)}
                      className="flex-1 md:w-auto flex items-center justify-center gap-3 px-10 py-3.5 bg-blue-600 text-white rounded-2xl font-black tracking-tight hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30"
                    >
                      Check Test Status <ChevronRight size={22} />
                    </button>
                 ) : currentStep === 11 && (maxStep >= 12 || isActuallyAdmitted) ? (
                    <button 
                      type="button"
                      onClick={() => setCurrentStep(12)}
                      className="flex-1 md:w-auto flex items-center justify-center gap-3 px-10 py-3.5 bg-blue-600 text-white rounded-2xl font-black tracking-tight hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30"
                    >
                      Check Visit Status <ChevronRight size={22} />
                    </button>
                 ) : currentStep === 12 && (maxStep >= 13 || isActuallyAdmitted) ? (
                  <button 
                    type="button"
                    onClick={() => setCurrentStep(13)}
                    className="flex-1 md:w-auto flex items-center justify-center gap-3 px-10 py-3.5 bg-emerald-600 text-white rounded-2xl font-black tracking-tight hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/30"
                  >
                    View Admission Status <CheckCircle size={22} />
                  </button>
                 ) : null}
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
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

function ParentsStep({ admissionId }: { admissionId: string }) {
  const { control, register, getValues, setValue, watch, formState: { errors } } = useFormContext();
  const { fields, append } = useFieldArray({ control, name: "parentsGuardians" });
  const [uploading, setUploading] = useState<Record<number, boolean>>({});

  // Auto-append Father/Mother if somehow missing
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
            
            // Auto-save this individual photo immediately so office can see it
            const currentParents = getValues("parentsGuardians");
            const res = await saveAdmissionStep(admissionId, 6, { parentsGuardians: currentParents }) as any;
            if (res.success && res.updatedData) {
              setValue("parentsGuardians", res.updatedData, { shouldValidate: true });
            }
          } catch (e) {
            console.error("Save error:", e);
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
                  <label className="relative cursor-pointer group flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300 group-hover:border-blue-500 overflow-hidden relative transition-all">
                      {photoValue ? (
                        <img src={photoValue} className="w-full h-full object-cover" alt="Parent preview" />
                      ) : isUploading ? (
                        <Loader2 className="animate-spin text-blue-500 h-5 w-5" />
                      ) : (
                        <Plus size={18} className="text-slate-400 group-hover:text-blue-500" />
                      )}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, index)} />
                  </label>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Photo</span>
                     <p className="text-[9px] font-medium uppercase tracking-tighter">
                        {photoValue ? (
                          photoValue.startsWith("http") ? (
                            <span className="text-emerald-600 font-black">Saved</span>
                          ) : (
                            <span className="text-amber-600 font-black">Not Saved</span>
                          )
                        ) : (
                          <span className="text-slate-400">Missing</span>
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

function DocumentsStep({ admissionId }: { admissionId: string }) {
  const { register, watch, setValue, formState: { errors } } = useFormContext();

  const documentList = [
    { id: "birthCertificate", name: "Birth Certificate", hindi: "जन्म प्रमाण पत्र", accept: "application/pdf" },
    { id: "studentPhoto", name: "Student Photo", hindi: "विद्यार्थी की फोटो", required: true, accept: "image/*" },
    { id: "marksheet", name: "Previous Marksheet", hindi: "पिछली कक्षा की अंकसूची", accept: "application/pdf" },
    { id: "casteCertificate", name: "Caste Certificate", hindi: "जाति प्रमाण पत्र", accept: "application/pdf" },
    { id: "transferCertificate", name: "Transfer Certificate (TC)", hindi: "स्थानांतरण प्रमाण पत्र", accept: "application/pdf" },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto">
      <div className="space-y-1 text-center">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Upload Documents</h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Step 8: Upload required & optional documents.</p>
      </div>
      
      <div className="space-y-4">
        {documentList.map((doc) => (
          <div key={doc.id}>
            <SmartUploader
              admissionId={admissionId}
              fieldName={doc.id}
              label={doc.name}
              hindiLabel={doc.hindi}
              initialUrl={watch(`documents.${doc.id}`)}
              accept={doc.accept}
              onUploadComplete={async (url) => {
                setValue(`documents.${doc.id}`, url, { shouldValidate: true });
                await saveAdmissionStep(admissionId, 8, { documents: { [doc.id]: url } });
              }}
              onDelete={async () => {
                setValue(`documents.${doc.id}`, "", { shouldValidate: true });
                await saveAdmissionStep(admissionId, 8, { documents: { [doc.id]: null } });
              }}
            />
            {errors.documents && (errors.documents as any)[doc.id] && (
              <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-4">
                This document is required
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DeclarationStep() {
  const { register, watch, formState: { errors } } = useFormContext();
  const declarationAccepted = watch("declaration.declarationAccepted");

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-1 text-center">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Final Declaration</h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium font-bold">Step 9: validation & signature.</p>
      </div>

      <div className="p-6 md:p-8 rounded-2xl md:rounded-[32px] bg-white border border-blue-50 shadow-sm space-y-6 md:space-y-8 max-w-2xl mx-auto">
        <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed italic text-center">
            "I hereby solemnly declare that all information furnished in this application is true, complete and correct. I am aware that if any information is found incorrect, the admission will be cancelled."
        </p>

        <div className="space-y-6 md:space-y-8">

          <div>
            <label className={cn(
              "flex items-center gap-4 md:gap-5 p-4 md:p-6 rounded-xl md:rounded-3xl cursor-pointer group transition-all",
              (errors.declaration as any)?.declarationAccepted ? "bg-red-50 border-red-200" : 
              declarationAccepted ? "bg-emerald-50/50 border-emerald-200 shadow-sm" : "bg-slate-50 border-slate-100 hover:bg-slate-100/50"
            )}>
              <input type="checkbox" {...register("declaration.declarationAccepted", { required: true })} className="h-6 w-6 md:h-7 md:w-7 rounded-lg border-2 border-slate-300 text-blue-600 cursor-pointer" />
              <span className={cn("text-[10px] md:text-xs font-bold uppercase tracking-widest", (errors.declaration as any)?.declarationAccepted ? "text-red-600" : declarationAccepted ? "text-emerald-700" : "text-slate-700")}>I Accept All Terms</span>
              {declarationAccepted && <CheckCircle size={20} className="text-emerald-500 ml-auto animate-in zoom-in-50 duration-200" />}
            </label>
            <ErrorMessage error={(errors.declaration as any)?.declarationAccepted} />
          </div>



          <div className="space-y-1">
            <label className={cn(labelStyles, "text-center")}>Parent Signature (Full Name)*</label>
            <input {...register("declaration.guardianName", { required: true })} className={cn(getInputClass((errors.declaration as any)?.guardianName), "text-center text-lg md:text-xl font-black font-outfit uppercase border-t-0 border-l-0 border-r-0 rounded-none bg-transparent")} placeholder="Sign Here" />
            <ErrorMessage error={(errors.declaration as any)?.guardianName} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmissionSuccessStep({ 
  data, 
  onDownload, 
  downloading,
  initialMeta,
  initialChecklist,
  admissionId,
  isActuallyAdmitted
}: { 
  data: any, 
  onDownload: (type: 'ADMISSION' | 'FULL_PACKAGE') => void, 
  downloading: boolean,
  initialMeta?: any,
  initialChecklist?: any,
  admissionId: string,
  isActuallyAdmitted?: boolean
}) {
  const bio = data.studentBio || {};
  const addr = data.address || {};
  const parents = data.parentsGuardians || [];

  const formatDate = (date: any) => {
    if (!date) return "-";
    if (typeof date === 'string') return date;
    if (date instanceof Date) return date.toLocaleDateString('en-IN');
    return String(date);
  };

  const isVerified = initialChecklist?.parentAffidavit === "VERIFIED" || isActuallyAdmitted;
  const isPending = initialChecklist?.parentAffidavit === "SUBMITTED" && !isActuallyAdmitted;

  return (
    <div className="animate-in zoom-in-95 fade-in duration-500 py-4 md:py-8 space-y-8">
      {/* Definitive Admission Choice (Moved from separate page) */}
      <div className="bg-white rounded-3xl border border-blue-100 shadow-xl shadow-blue-500/5 overflow-hidden p-6 md:p-8 space-y-6">
         <div className="flex items-center gap-4 border-b pb-6 border-slate-50">
            <div className="h-12 w-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle size={24} />
            </div>
            <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Final Milestone</p>
                <h2 className="text-xl font-black text-slate-900 uppercase leading-none italic">Enrollment & Fee Choice</h2>
            </div>
         </div>

         <FinalAdmissionChoiceInternal 
            admissionId={admissionId} 
            initialApplied={data?.admissionMeta?.appliedScholarship}
            visitPassed={data?.homeVisit?.status === "PASS"}
            isActuallyAdmitted={isActuallyAdmitted}
         />
      </div>

      <div className="bg-slate-50/50 rounded-[32px] border border-slate-100 p-6 md:p-10 space-y-8 md:space-y-12 shadow-inner">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                    <GraduationCap size={14} /> Student Details
                </h4>
                <div className="space-y-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="flex justify-between text-sm"><span className="text-slate-400 font-bold uppercase text-[10px]">Name</span> <span className="font-black text-slate-900">{bio.firstName} {bio.lastName}</span></p>
                    <p className="flex justify-between text-sm"><span className="text-slate-400 font-bold uppercase text-[10px]">Gender</span> <span className="font-black text-slate-900">{bio.gender === "M" ? "Male" : "Female"}</span></p>
                    <p className="flex justify-between text-sm"><span className="text-slate-400 font-bold uppercase text-[10px]">DOB</span> <span className="font-black text-slate-900">{formatDate(bio.dob)}</span></p>
                    <p className="flex justify-between text-sm"><span className="text-slate-400 font-bold uppercase text-[10px]">Samagra</span> <span className="font-black text-slate-900">{bio.samagraId || "-"}</span></p>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                    <MapPin size={14} /> Contact Address
                </h4>
                <div className="space-y-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-sm font-black text-slate-900">{addr.houseNo}, {addr.street}</p>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-tight">{addr.village}, {addr.district}</p>
                    <p className="text-xs font-black text-slate-400 mt-2">PIN: {addr.pinCode}</p>
                </div>
            </div>
        </div>

        <div className="space-y-6">
            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                <Users size={14} /> Parent Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parents.map((p: any, i: number) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{p.personType}</p>
                            <p className="font-black text-slate-900">{p.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Contact</p>
                            <p className="font-black text-blue-600">{p.mobileNumber}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {(isPending || isVerified) && (
          <div className="bg-white p-6 md:p-8 rounded-[32px] border border-blue-100 shadow-xl shadow-blue-500/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                  <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
                      <FileText size={32} />
                  </div>
                  <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Uploaded Document</p>
                      <h5 className="text-lg font-black text-slate-900 uppercase tracking-tight italic">Signed Affidavit & Agreement</h5>
                      <div className="flex items-center gap-2 mt-1">
                          <div className={cn("h-2 w-2 rounded-full animate-pulse", isVerified ? "bg-emerald-500" : "bg-amber-500")} />
                          <p className={cn("text-[9px] font-bold uppercase tracking-tight", isVerified ? "text-emerald-600" : "text-amber-600")}>
                              {isVerified ? "Review Finished" : "In Review Queue"}
                          </p>
                      </div>
                  </div>
              </div>
              <button 
                onClick={() => {
                  window.open(`/api/view-doc?id=${admissionId}&field=affidavit&type=affidavit`, "_blank");
                }}
                className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 active:scale-95"
              >
                  <Eye size={18} /> View My Submission
              </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4 md:pt-8 border-t border-slate-100">
            <button
                type="button"
                disabled={downloading}
                onClick={() => onDownload('ADMISSION')}
                className="w-full md:w-auto group flex items-center justify-center gap-4 px-10 py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-[0.15em] text-xs hover:bg-blue-700 transition-all duration-300 shadow-2xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
            >
                {downloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} className="group-hover:translate-y-1 transition-transform" />}
                Download Application PDF
            </button>
            
            <button
                type="button"
                onClick={() => window.location.href = "/student/dashboard"}
                className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-white text-slate-900 border-2 border-slate-200 rounded-3xl font-black uppercase tracking-[0.15em] text-xs hover:bg-slate-50 transition-all active:scale-95"
            >
                Back to Dashboard
            </button>
        </div>

        <div className="pt-8 border-t border-slate-200/50 flex flex-col items-center gap-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Next Steps</p>
            <p className="text-xs md:text-sm text-slate-500 font-medium text-center max-w-lg">
                {isVerified ? "Your application is complete. Welcome to the school! You can now access all student features." :
                 isPending ? "Your documents are currently being verified by the school office. Please check back later." :
                 "Please ensure you have uploaded and submitted your affidavit in the previous step."}
            </p>
        </div>
      </div>
    </div>
  );
}

function FinalAdmissionChoiceInternal({ 
    admissionId, 
    initialApplied,
    visitPassed,
    isActuallyAdmitted = false
}: { 
    admissionId: string, 
    initialApplied: boolean | null,
    visitPassed: boolean,
    isActuallyAdmitted?: boolean
}) {
    const [agreed, setAgreed] = useState(initialApplied !== null);
    const [selected, setSelected] = useState<boolean | null>(initialApplied);
    const [loading, setLoading] = useState(false);
    const [isLocked, setIsLocked] = useState(isActuallyAdmitted);
  
    const handleToggle = async () => {
      if (selected === null) return;
      setLoading(true);
      const res = await applyScholarship(admissionId, selected);
      setLoading(false);
      if (res.success) {
        setIsLocked(true);
        alert(selected ? "Scholarship Applied Successfully!" : "Normal Fee Option Confirmed!");
        window.location.reload();
      } else {
        alert("Error: " + (res.error || "Unknown error"));
      }
    };

    if (!visitPassed) {
        return (
            <div className="p-8 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col items-center text-center gap-4">
                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm border border-blue-50">
                    <Clock size={32} />
                </div>
                <div>
                   <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Visit Pending</h4>
                   <p className="text-xs font-bold text-blue-700/60 leading-relaxed uppercase tracking-wider mt-1">
                       Wait for the office to complete your Home Visit before choosing a fee route.
                   </p>
                </div>
            </div>
        );
    }
  
    return (
      <div className="space-y-6">
          <label className={cn(
              "flex items-center gap-3 p-4 rounded-xl transition-all border",
              agreed ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-100",
              (isLocked || loading) ? "opacity-75 cursor-not-allowed" : "cursor-pointer hover:bg-slate-100/50"
          )}>
              <input 
                  type="checkbox" 
                  checked={agreed} 
                  disabled={isLocked || loading}
                  onChange={(e) => setAgreed(e.target.checked)} 
                  className="h-5 w-5 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
              />
              <span className={cn(
                  "text-xs font-black uppercase tracking-wide",
                  agreed ? "text-emerald-800" : "text-slate-700"
              )}>I Agree to the Admission Guidelines</span>
              {agreed && <CheckCircle size={18} className="text-emerald-500 ml-auto animate-in zoom-in-50 duration-200" />}
          </label>
  
          {agreed && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      Choose Enrollment Type {isLocked && <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 uppercase tracking-wider flex items-center gap-1"><Lock size={10}/> Confirmed</span>}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button 
                          type="button"
                          onClick={() => !isLocked && setSelected(false)}
                          disabled={loading || isLocked}
                          className={cn(
                              "p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2",
                              selected === false ? "border-blue-600 bg-blue-50/20 text-blue-900 shadow-md ring-2 ring-blue-100" : "border-slate-100 bg-white text-slate-400 hover:border-slate-200",
                              (isLocked || loading) && "opacity-75 cursor-not-allowed"
                          )}
                      >
                          {selected === false ? <CheckCircle className="text-blue-600" size={20} /> : <Circle size={20} className="text-slate-200" />}
                          <span className="text-xs font-black uppercase tracking-widest">Normal Fee</span>
                          <span className="text-[9px] font-bold opacity-60">Standard Fee Structure</span>
                      </button>
  
                      <button 
                          type="button"
                          onClick={() => !isLocked && setSelected(true)}
                          disabled={loading || isLocked}
                          className={cn(
                              "p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2",
                              selected === true ? "border-emerald-600 bg-emerald-50/20 text-emerald-900 shadow-md ring-2 ring-emerald-100" : "border-slate-100 bg-white text-slate-400 hover:border-slate-200",
                              (isLocked || loading) && "opacity-75 cursor-not-allowed"
                          )}
                      >
                          {selected === true ? <CheckCircle className="text-emerald-600" size={20} /> : <Circle size={20} className="text-slate-200" />}
                          <span className="text-xs font-black uppercase tracking-widest">Scholarship</span>
                          <span className="text-[9px] font-bold opacity-60">Apply for Fee Concessions</span>
                      </button>
                  </div>
  
                  <div className="pt-2">
                      <button 
                          type="button"
                          onClick={handleToggle}
                          disabled={loading || selected === null || isLocked}
                          className={cn(
                              "w-full p-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2",
                              (selected === null || loading || isLocked)
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                  : "bg-slate-900 hover:bg-black text-white shadow-lg shadow-slate-900/20 hover:scale-[1.01] active:scale-[0.99]"
                          )}
                      >
                          {loading ? <Loader2 className="animate-spin" size={18} /> : isLocked ? "Choice Confirmed & Locked" : "Confirm Enrollment Choice"}
                      </button>
                  </div>
              </div>
          )}
      </div>
    );
}

function DocumentVerificationStep({ 
  admissionId, 
  initialDocData, 
  initialChecklistData, 
  studentName,
  officeRemarks,
  studentStep,
  isActuallyAdmitted
}: { 
  admissionId: string, 
  initialDocData?: any, 
  initialChecklistData?: any, 
  studentName: string,
  officeRemarks?: string | null,
  studentStep: number,
  isActuallyAdmitted?: boolean
}) {
  const { setValue } = useFormContext();
  const [loading, setLoading] = useState(false);

  
  const [currentDocData, setCurrentDocData] = useState(initialDocData);
  const [currentChecklistData, setCurrentChecklistData] = useState(initialChecklistData);

  const isVerified = currentChecklistData?.parentAffidavit === "VERIFIED";
  const isFinalized = (currentChecklistData?.parentAffidavit === "SUBMITTED" || isVerified) && studentStep > 10;
  const hasUploaded = !!currentDocData?.affidavit;

  const handleRemove = async () => {
    if (!confirm("Are you sure?")) return;
    setLoading(true);
    const res = await removeAffidavit(admissionId);
    if (res.success) {
      setCurrentDocData({ ...currentDocData, affidavit: null });
      setValue("documents.affidavit", "", { shouldDirty: true });
    }
    setLoading(false);
  };

  const handleSubmitFinal = async () => {
    if (!confirm("Proceed with final submission? This will lock your application for review.")) return;
    setLoading(true);
    try {
      const res = await submitAffidavit(admissionId);
      if (res.success) {
        setCurrentChecklistData({ ...currentChecklistData, parentAffidavit: "SUBMITTED" });
        alert("Final submission complete! Your application is now locked and under review.");
        // Redirect to step 11 for the success summary
        window.location.href = `/student/admission?step=11&t=${Date.now()}`;
      } else {
        alert("Submission failed: " + (res.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error submitting form: " + (err.message || "Network error"));
    } finally {
      setLoading(false);
    }
  };

  const handleViewPdf = () => {
    window.open(`/api/view-doc?id=${admissionId}&field=affidavit&type=affidavit`, "_blank");
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-1">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">
          {isActuallyAdmitted ? "Verification Completed" : "Doc Verification"}
        </h3>
        <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-tight italic">
          {isActuallyAdmitted ? "Your documents are finalized." : "Step 10: Upload and verify signed documents."}
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* OFFICE REMARK BANNER */}
        {/* Hide the correction reminder banner once the student has uploaded a new file */}
        {officeRemarks && !hasUploaded && (
          <div className="bg-red-50 border-2 border-red-200 rounded-[32px] p-6 flex items-start gap-4 mb-2 shadow-sm animate-in slide-in-from-top-2 duration-300">
            <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0 border border-red-200">
              <AlertCircle className="text-red-600" size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="text-[10px] font-black text-red-900 uppercase tracking-tight">Correction Required</h4>
              <p className="text-xs font-bold text-red-700 leading-tight italic">
                "{officeRemarks}"
              </p>
            </div>
          </div>
        )}

        {isFinalized && (
          <div className={cn(
             "p-6 rounded-3xl border flex items-center gap-4 shadow-xl transition-all duration-500",
             isVerified ? "bg-emerald-600 text-white border-emerald-500" : "bg-slate-900 text-white border-slate-800"
          )}>
            <div className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner",
              isVerified ? "bg-white/20 text-white" : "bg-blue-500 text-white"
            )}>
              {isVerified ? <CheckCircle size={24} /> : <Lock size={24} />}
            </div>
            <div>
              <h4 className="text-lg font-black uppercase italic tracking-tight leading-none">
                {isVerified ? "Verified & Approved" : "Finalized & Locked"}
              </h4>
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-widest mt-1",
                isVerified ? "text-emerald-100" : "text-slate-400"
              )}>
                {isVerified ? "The office has successfully verified your documents." : "Submission has been officially locked for review."}
              </p>
            </div>
            {isVerified && (
               <div className="ml-auto bg-white/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-sm border border-white/20 animate-pulse">
                  Office Sanctioned
               </div>
            )}
          </div>
        )}

        {!hasUploaded && !isFinalized && (
          <div className="bg-white p-2 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
             <SmartUploader
                admissionId={admissionId}
                fieldName="affidavit"
                label="Affidavit"
                hindiLabel="शपथ पत्र"
                maxSizeMB={1}
                onUploadComplete={async (url) => {
                  setLoading(true);
                  const res = await saveAdmissionStep(admissionId, 10, { documents: { affidavit: url } });
                  if (res.success) {
                    setCurrentDocData({ ...currentDocData, affidavit: url });
                    setValue("documents.affidavit", "__EXISTING__", { shouldDirty: true });
                  } else {
                    alert("Error saving record: " + ((res as any).error || "Unknown error"));
                  }
                  setLoading(false);
                }}
                accept="application/pdf,image/*"
              />
          </div>
        )}

        {hasUploaded && (
          <div className={cn("p-8 rounded-[32px] border shadow-xl", isFinalized ? "bg-slate-50 border-slate-100" : "bg-emerald-50/50 border-emerald-100/50")}>
            <div className="flex items-center gap-5 mb-8">
              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center", isFinalized ? "bg-slate-800 text-white" : "bg-emerald-500 text-white")}>
                <FileText size={28} />
              </div>
              <div>
                <h4 className="text-xl font-black uppercase italic tracking-tight">
                    {isVerified ? "Document Processed" : isFinalized ? "Affidavit Locked" : "Review Affidavit"}
                </h4>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={handleViewPdf} className="py-4 bg-white border border-slate-200 text-slate-800 rounded-2xl font-black uppercase text-[9px] hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                <Eye size={16} /> View
              </button>
              {!isFinalized && (
                <button onClick={handleRemove} className="py-4 bg-white border border-slate-200 text-red-500 rounded-2xl font-black uppercase text-[9px] hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                  <Trash2 size={16} /> Delete
                </button>
              )}
            </div>
            {!isFinalized && (
              <button onClick={handleSubmitFinal} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all mt-6 shadow-lg shadow-emerald-600/20">
                Final Submit & Lock
              </button>
            )}
          </div>
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
        <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Download Application</h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium font-outfit">Step 9: Get your filled application combined with Prospectus.</p>
      </div>
      
      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-5 mt-4 group hover:bg-white hover:border-blue-100 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-blue-50">
              <Download size={28} />
          </div>
          <div className="space-y-1">
              <h4 className="font-black text-slate-800 uppercase tracking-tight font-outfit">Application Package is Ready</h4>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Combine Form & Prospectus in one click</p>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-3 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-[11px] px-8 py-4 rounded-2xl shadow-xl shadow-slate-900/10 transition-all hover:shadow-2xl active:scale-95 disabled:opacity-50"
          >
            {downloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            {downloading ? "Generating Package..." : "Download Full Package PDF"}
          </button>
      </div>
    </div>
  );
}

function EntranceTestStatusStep({ admissionId, initialData }: { admissionId: string, initialData: any }) {
  const test = initialData?.entranceTest;
  const isScheduled = !!test?.testDate;
  const isPassed = test?.status === "PASS";
  const isFailed = test?.status === "FAIL";

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto pb-20">
      <div className="space-y-1 text-center">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Entrance Test Status</h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Step 11: Track your exam schedule and results.</p>
      </div>

      <div className="bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm space-y-6">
        {!isScheduled ? (
          <div className="text-center py-10 space-y-4">
            <div className="h-16 w-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto">
              <Calendar size={32} />
            </div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-tight">Test Not Yet Scheduled</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">The school office will schedule your entrance exam soon. Please check back later.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-5 bg-blue-50 rounded-2xl border border-blue-100">
               <div className="h-12 w-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <Calendar size={24} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Scheduled For</p>
                  <p className="text-lg font-black text-blue-900 uppercase italic tracking-tight">
                    {test.testDate}
                  </p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Time</p>
                  <p className="text-sm font-black text-slate-700">{test.testTime}</p>
               </div>
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                  <p className="text-sm font-black text-slate-700">{test.location}</p>
               </div>
            </div>

            <div className={cn(
              "p-6 rounded-3xl border flex items-center justify-between",
              isPassed ? "bg-emerald-50 border-emerald-100" :
              isFailed ? "bg-red-50 border-red-100" : "bg-blue-50/50 border-blue-100/50"
            )}>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Exam Result</p>
                  <p className={cn(
                    "text-xl font-black uppercase italic tracking-tighter",
                    isPassed ? "text-emerald-700" : isFailed ? "text-red-700" : "text-blue-700"
                  )}>
                    {isPassed ? "PASSED" : isFailed ? "NOT CLEARED" : "AWAITING RESULTS"}
                  </p>
               </div>
               <div className={cn(
                 "h-12 w-12 rounded-xl flex items-center justify-center text-white",
                 isPassed ? "bg-emerald-500 shadow-lg shadow-emerald-500/20" :
                 isFailed ? "bg-red-500 shadow-lg shadow-red-500/20" : "bg-blue-500 shadow-lg shadow-blue-500/20"
               )}>
                 {isPassed ? <CheckCircle size={24} /> : isFailed ? <XCircle size={24} /> : <Clock size={24} />}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HomeVisitStatusStep({ admissionId, initialData }: { admissionId: string, initialData: any }) {
  const visit = initialData?.homeVisit;
  const isScheduled = !!visit?.visitDate;
  const isCompleted = visit?.status === "PASS";
  
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto pb-20">
      <div className="space-y-1 text-center">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Home Visit Status</h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Step 12: School team visit to your residence.</p>
      </div>

      <div className="bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm space-y-6">
        {!isScheduled ? (
          <div className="text-center py-10 space-y-4">
            <div className="h-16 w-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto">
              <MapPinned size={32} />
            </div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-tight">Visit Not Yet Scheduled</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Our team will schedule a home visit soon after you pass the entrance exam.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
               <div className="h-12 w-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <MapPinned size={24} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Visit Date</p>
                  <p className="text-lg font-black text-indigo-900 uppercase italic tracking-tight">
                    {visit.visitDate}
                  </p>
               </div>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</p>
                  <p className={cn(
                    "text-xl font-black uppercase italic tracking-tighter",
                    isCompleted ? "text-emerald-700" : "text-amber-700"
                  )}>
                    {isCompleted ? "COMPLETED" : "PENDING"}
                  </p>
               </div>
               <div className={cn(
                 "h-12 w-12 rounded-xl flex items-center justify-center text-white",
                 isCompleted ? "bg-emerald-500" : "bg-amber-500"
               )}>
                 {isCompleted ? <CheckCircle size={24} /> : <Clock size={24} />}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function XCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

function Verified(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
}
