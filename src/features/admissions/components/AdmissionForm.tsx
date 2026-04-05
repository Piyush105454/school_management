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
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { submitFullAdmissionForm, saveAdmissionStep, getDocumentContent } from "../actions/admissionActions";
import { uploadAffidavit, removeAffidavit, submitAffidavit, getAffidavitContent } from "../actions/documentActions";
import { generateAdmissionPDF, generateMergedApplicationPDF } from "../utils/generateAdmissionPDF";


const compressImage = (base64Str: string, maxWidth = 1000, maxHeight = 1000): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
  });
};

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
  { id: 10, name: "Verification", icon: FileText },
  { id: 11, name: "Complete", icon: CheckCircle },
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
  const [currentStep, setCurrentStep] = useState(initialStep || (maxStep > 11 ? 11 : maxStep));
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
      guardianName: ""
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
    };

    loadData();
  }, [initialData, methods, admissionId]);

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

  const handleSubmitFinal = async () => {
    if (!confirm("Proceed with final submission? This will lock your application for review.")) return;
    setLoading(true);
    try {
      const res = await submitAffidavit(admissionId);
      if (res.success) {
        alert("Final submission complete! Your application is now locked and under review.");
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

  const nextStep = async () => {
    const fieldsByStep: Record<number, any> = {
      1: "studentBio",
      2: "studentBio",
      3: "address",
      4: "previousAcademic",
      5: "siblings",
      6: "parentsGuardians",
      7: "bankDetails",
      8: "documents",
      9: [],
      10: [],
      11: "declaration"
    };

    const currentFields = fieldsByStep[currentStep];
    const isValid = await methods.trigger(currentFields);
    
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
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
      
      // Save data
      const data = methods.getValues();
      const stepData: any = { [currentFields]: data[currentFields as keyof typeof data] };
      
      const saveRes = await saveAdmissionStep(admissionId, stepData, prevStepVal) as any;
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
      {initialData?.admissionMeta?.officeRemarks && (
        <div className="max-w-6xl mx-auto mb-8 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 md:p-6 flex items-start gap-4 shadow-sm">
                <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle className="text-red-600" size={20} />
                </div>
                <div className="space-y-1">
                    <h4 className="text-sm font-black text-red-900 uppercase tracking-tight">Requirement / Correction Needed</h4>
                    <p className="text-xs font-bold text-red-700 leading-relaxed italic">
                        "{initialData.admissionMeta.officeRemarks}"
                    </p>
                    <p className="text-[10px] font-medium text-red-500 pt-1">
                        Please update your information/documents as mentioned above.
                    </p>
                </div>
            </div>
        </div>
      )}

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
      
      {(currentStep === 9 || maxStep >= 9) && (
        <div className="flex justify-end max-w-6xl mx-auto px-1 mb-4">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleDownloadWithFullData('ADMISSION')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-black uppercase tracking-widest text-[10px] bg-blue-50/80 backdrop-blur-sm px-5 py-2.5 rounded-xl border border-blue-100/80 transition-all hover:bg-blue-100 hover:shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download Application PDF
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 mb-6 max-w-6xl mx-auto">
        <div className="p-4 md:p-8 flex flex-col bg-white">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="flex-1">
              <div className="max-w-3xl mx-auto">
                <fieldset disabled={maxStep >= 11 && currentStep !== 9} className="contents shadow-none border-none p-0 m-0">
                  {currentStep === 1 && <BioStep />}
                  {currentStep === 2 && <ProfileStatsStep />}
                  {currentStep === 3 && <AddressStep />}
                  {currentStep === 4 && <AcademicStep />}
                  {currentStep === 5 && <SiblingsStep />}
                  {currentStep === 6 && <ParentsStep />}
                  {currentStep === 7 && <BankStep />}
                  {currentStep === 8 && <DocumentsStep admissionId={admissionId} />}
                  {currentStep === 9 && <DownloadApplicationStep data={methods.getValues()} onDownload={handleDownloadWithFullData} downloading={loading} />}
                  {currentStep === 10 && <DocumentVerificationStep admissionId={admissionId} initialDocData={initialData?.documents} initialChecklistData={initialData?.documentChecklist} studentName={`${methods.getValues("studentBio.firstName")} ${methods.getValues("studentBio.lastName")}`} />}
                </fieldset>
                {currentStep === 11 && (
                  <SubmissionSuccessStep 
                    data={methods.getValues()} 
                    onDownload={handleDownloadWithFullData} 
                    downloading={loading} 
                    initialMeta={initialData?.admissionMeta} 
                    initialChecklist={initialData?.documentChecklist}
                    admissionId={admissionId}
                  />
                )}
              </div>
            </form>
          </FormProvider>
          
          {currentStep < 11 && (
            <div className="mt-10 md:mt-16 flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-200/60 max-w-3xl mx-auto w-full gap-4">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="w-full md:w-auto group flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl text-slate-600 font-bold hover:bg-slate-200/50 transition-all duration-200 disabled:opacity-30 border border-slate-100 md:border-transparent hover:border-slate-200"
              >
                <ChevronLeft size={22} className="group-hover:-translate-x-1 transition-transform" /> Previous
              </button>
              
              {maxStep >= 11 && currentStep < 11 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(11)}
                  className="w-full md:w-auto group flex items-center justify-center gap-3 px-10 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all duration-200 shadow-xl shadow-blue-900/10"
                >
                  Return to Confirmation <CheckCircle size={22} className="group-hover:scale-110 transition-transform" />
                </button>
              ) : currentStep < 10 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full md:w-auto group flex items-center justify-center gap-3 px-10 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all duration-200 shadow-xl shadow-slate-900/10"
                >
                  Next Step <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitFinal}
                  disabled={loading}
                  className="w-full md:w-auto flex items-center justify-center gap-3 px-12 py-3.5 bg-blue-600 text-white rounded-2xl font-black tracking-tight hover:bg-blue-700 transition-all duration-200 shadow-2xl shadow-blue-600/30 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                    <>SUBMIT APPLICATION <CheckCircle size={22} /></>
                  )}
                </button>
              ) }
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
                    {["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map(c => (
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
            {["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map(c => (
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
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string);
          setValue(`parentsGuardians.${index}.photo`, compressed, { shouldValidate: true });
        } catch (e) {
          console.error("Compression error:", e);
          alert("Error compressing image.");
        } finally {
          setUploading(prev => ({ ...prev, [index]: false }));
        }
      };
      reader.readAsDataURL(file);
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
                     <p className="text-[9px] text-slate-400 font-medium">{photoValue ? "Uploaded" : "Optional"}</p>
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
  const [uploading, setUploading] = React.useState<Record<string, boolean>>({});
  const [saveSuccess, setSaveSuccess] = React.useState<Record<string, boolean>>({});

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(prev => ({ ...prev, [fieldName]: true }));
      setSaveSuccess(prev => ({ ...prev, [fieldName]: false }));
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string);
          setValue(`documents.${fieldName}`, compressed, { shouldValidate: true });
          
          const saveRes = await saveAdmissionStep(admissionId, { documents: { [fieldName]: compressed } }, 8);
          if (saveRes.success) {
             setSaveSuccess(prev => ({ ...prev, [fieldName]: true }));
          } else {
             alert(`Failed to auto-save ${fieldName}. Please try again.`);
          }
        } catch (e) {
          console.error("Compression error:", e);
          alert("Error compressing image.");
        } finally {
          setUploading(prev => ({ ...prev, [fieldName]: false }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const documentList = [
    { id: "birthCertificate", name: "Birth Certificate", hindi: "जन्म प्रमाण पत्र" },
    { id: "studentPhoto", name: "Student Photo", hindi: "विद्यार्थी की फोटो" },
    { id: "marksheet", name: "Previous Marksheet", hindi: "पिछली कक्षा की अंकसूची" },
    { id: "casteCertificate", name: "Caste Certificate", hindi: "जाति प्रमाण पत्र" },
    { id: "transferCertificate", name: "Transfer Certificate (TC)", hindi: "स्थानांतरण प्रमाण पत्र" },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto">
      <div className="space-y-1 text-center">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Upload Documents</h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Step 8: Upload required & optional documents.</p>
      </div>
      
      <div className="space-y-2 md:space-y-3">
        {documentList.map((doc) => {
          const hasError = (errors.documents as any)?.[doc.id];
          const isUploading = uploading[doc.id];
          const isSaved = saveSuccess[doc.id];
          const fileData = watch(`documents.${doc.id}`);

          return (
            <div key={doc.id} className={cn(
              "flex items-center justify-between p-3 md:p-4 rounded-xl border bg-white shadow-sm transition-all",
              hasError ? "border-red-200 bg-red-50/10" : "border-slate-100 hover:border-blue-100"
            )}>
              <div className="flex-1 min-w-0 pr-4">
                <p className={cn("text-[10px] md:text-xs font-black uppercase tracking-tight truncate", hasError ? "text-red-600" : "text-slate-900")}>{doc.name}</p>
                <p className="text-[9px] md:text-[10px] text-slate-500 font-bold truncate">{doc.hindi}</p>
                {hasError && <p className="text-[8px] font-black text-red-500 uppercase mt-0.5">Missing</p>}
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  type="hidden" 
                  {...register(`documents.${doc.id}`, { required: doc.id === "studentPhoto" })} 
                />
                
                {fileData ? (
                  <div className="flex items-center gap-1 md:gap-2">
                    <span className={cn(
                      "flex items-center gap-1 text-[8px] md:text-[9px] font-black px-2 md:px-3 py-1 rounded-full border ring-4 transition-all",
                      isUploading ? "text-amber-600 bg-amber-50 border-amber-100 ring-amber-50/50" :
                      isSaved ? "text-emerald-600 bg-emerald-50 border-emerald-100 ring-emerald-50/50" : 
                      "text-blue-600 bg-blue-50 border-blue-100 ring-blue-50/50"
                    )}>
                      {isUploading ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={10} />}
                      {isUploading ? "SAVING..." : isSaved ? "UPLOAD SAVED" : "DONE"}
                    </span>
                    <button 
                      type="button" 
                      disabled={isUploading}
                      onClick={() => {
                        setValue(`documents.${doc.id}`, "", { shouldValidate: true });
                        setSaveSuccess(prev => ({ ...prev, [doc.id]: false }));
                      }}
                      className="text-[8px] md:text-[9px] font-black text-slate-400 hover:text-red-500 uppercase px-2 py-1 transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*"
                      disabled={isUploading}
                      onChange={(e) => handleFileChange(e, doc.id)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                    />
                    <span className={cn(
                      "flex items-center gap-1.5 text-[8px] md:text-[9px] font-black px-3 md:px-4 py-1.5 md:py-2 rounded-lg border transition-all uppercase tracking-wider",
                      hasError ? "text-red-600 bg-red-50 border-red-200" : "text-blue-600 bg-blue-50 border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600",
                      isUploading && "opacity-50"
                    )}>
                      {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} 
                      {isUploading ? "Reading..." : "Upload"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
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
  admissionId
}: { 
  data: any, 
  onDownload: (type: 'ADMISSION' | 'FULL_PACKAGE') => void, 
  downloading: boolean,
  initialMeta?: any,
  initialChecklist?: any,
  admissionId: string
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

  const isVerified = initialMeta?.status === "VERIFIED";
  const isPending = initialChecklist?.parentAffidavit === "SUBMITTED";

  return (
    <div className="animate-in zoom-in-95 fade-in duration-500 py-4 md:py-8">
      <div className="text-center space-y-4 md:space-y-6 mb-8 md:mb-12">
        <div className={cn(
          "inline-flex items-center justify-center h-20 w-20 md:h-24 md:w-24 rounded-[32px] shadow-xl border",
          isVerified ? "bg-emerald-50 text-emerald-500 border-emerald-100 shadow-emerald-500/10" :
          isPending ? "bg-amber-50 text-amber-500 border-amber-100 shadow-amber-500/10" :
          "bg-slate-100 text-slate-400 border-slate-200"
        )}>
          {isVerified ? <CheckCircle size={48} strokeWidth={2.5} /> :
           isPending ? <Clock size={48} strokeWidth={2.5} /> :
           <AlertCircle size={48} strokeWidth={2.5} />}
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 font-outfit tracking-tight uppercase italic">
            {isVerified ? "Verification Complete" : 
             isPending ? "Verification Pending" : 
             "Not Verified"}
          </h2>
          <p className="text-sm md:text-lg text-slate-500 font-bold uppercase tracking-widest leading-none">
            {isVerified ? "All documents have been officially reviewed." :
             isPending ? "Your documents are currently under review." :
             "Please complete the verification step."}
          </p>
        </div>
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
                onClick={async () => {
                  const res = await getAffidavitContent(admissionId);
                  if (res.success && res.affidavit) window.open(res.affidavit, "_blank");
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

function DocumentVerificationStep({ 
  admissionId, 
  initialDocData, 
  initialChecklistData, 
  studentName 
}: { 
  admissionId: string, 
  initialDocData?: any, 
  initialChecklistData?: any, 
  studentName: string 
}) {
  const { setValue } = useFormContext();
  const [loading, setLoading] = useState(false);
  const [affidavitFile, setAffidavitFile] = useState<File | null>(null);
  
  const [currentDocData, setCurrentDocData] = useState(initialDocData);
  const [currentChecklistData, setCurrentChecklistData] = useState(initialChecklistData);

  const isFinalized = currentChecklistData?.parentAffidavit === "SUBMITTED" || currentChecklistData?.parentAffidavit === "VERIFIED";
  const hasUploaded = !!currentDocData?.affidavit;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit. Please select a smaller file.");
        e.target.value = "";
        return;
      }
      setAffidavitFile(file);
    }
  };

  const handleUpload = async () => {
    if (!affidavitFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", affidavitFile);
    formData.append("admissionId", admissionId);

    try {
      const response = await fetch("/api/upload-affidavit", {
        method: "POST",
        body: formData,
      });
      const res = await response.json();
      if (res.success) {
        setCurrentDocData({ ...currentDocData, affidavit: "UPLOADED" });
        setValue("documents.affidavit", "__EXISTING__", { shouldDirty: true });
        setAffidavitFile(null);
        alert("Document uploaded successfully!");
      } else {
        alert("Upload failed: " + res.error);
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

  const handleViewPdf = async () => {
    setLoading(true);
    const res = await getAffidavitContent(admissionId);
    setLoading(false);
    if (res.success && res.affidavit) {
      window.open(res.affidavit, "_blank");
    } else {
      alert("Error: " + res.error);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-1">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Doc Verification</h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium font-bold">Step 10: Upload and verify signed documents.</p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {isFinalized && (
          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-xl">
            <div className="h-12 w-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center">
              <Lock size={24} />
            </div>
            <div>
              <h4 className="text-lg font-black uppercase italic tracking-tight leading-none">Finalized & Locked</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Submission has been officially locked.</p>
            </div>
          </div>
        )}

        {!hasUploaded && !isFinalized && (
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
            <div className="border-2 border-dashed border-slate-100 rounded-3xl p-10 text-center hover:border-blue-300 hover:bg-blue-50/5 transition-all cursor-pointer group relative">
              <input type="file" onChange={handleFileChange} className="hidden" id="form-affidavit" disabled={loading} />
              <label htmlFor="form-affidavit" className="cursor-pointer block">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <Upload size={32} />
                </div>
                <p className="text-sm font-black text-slate-600 uppercase tracking-tight">{affidavitFile ? affidavitFile.name : "Select Affidavit"}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Click to browse signed copy</p>
              </label>
            </div>
            <button onClick={handleUpload} disabled={loading || !affidavitFile} className="w-full py-4.5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" /> : <Upload size={18} />} Upload for Review
            </button>
          </div>
        )}

        {hasUploaded && (
          <div className={cn("p-8 rounded-[32px] border shadow-xl", isFinalized ? "bg-slate-50 border-slate-100" : "bg-emerald-50/50 border-emerald-100/50")}>
            <div className="flex items-center gap-5 mb-8">
              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center", isFinalized ? "bg-slate-800 text-white" : "bg-emerald-500 text-white")}>
                <FileText size={28} />
              </div>
              <div>
                <h4 className="text-xl font-black uppercase italic tracking-tight">{isFinalized ? "Documents Locked" : "Review Submission"}</h4>
                <p className="text-[9px] font-bold uppercase tracking-widest">{isFinalized ? "Verified" : "Check details below"}</p>
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
