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
  MapPinned
} from "lucide-react";
import { cn } from "@/lib/utils";
import { submitFullAdmissionForm, saveAdmissionStep, verifyAdmission, getDocumentContent } from "../actions/admissionActions";
import { scheduleEntranceTest, getEntranceTestData, updateTestResult } from "../actions/testActions";
import { generateAdmissionPDF } from "../utils/generateAdmissionPDF";


const steps = [
  { id: 1, name: "Bio Info", icon: GraduationCap },
  { id: 2, name: "Stats/ID", icon: UserCheck },
  { id: 3, name: "Address", icon: MapPin },
  { id: 4, name: "Academic", icon: BookOpen },
  { id: 5, name: "Siblings", icon: Users },
  { id: 6, name: "Parents", icon: Users },
  { id: 7, name: "Bank", icon: CreditCard },
  { id: 8, name: "Docs", icon: FileText },
  { id: 9, name: "Finalize", icon: CheckCircle },
  { id: 10, name: "Complete", icon: CheckCircle },
];

export function OfficeAdmissionForm({ admissionId, initialData, maxStep = 1 }: { admissionId: string, initialData?: any, maxStep?: number }) {
  const [currentStep, setCurrentStep] = useState(maxStep > 10 ? 10 : maxStep);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);


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
      { personType: "FATHER", name: "", mobileNumber: "", occupation: "", qualification: "", aadhaarNumber: "", samagraNumber: "" },
      { personType: "MOTHER", name: "", mobileNumber: "", occupation: "", qualification: "", aadhaarNumber: "", samagraNumber: "" }
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
      const targetStep = maxStep && maxStep > 10 ? 10 : maxStep || 1;
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
      5: "siblings", 6: "parentsGuardians", 7: "bankDetails", 8: "documents", 9: "declaration"
    };
    const currentFields = fieldsByStep[currentStep];
    const isValid = await methods.trigger(currentFields);
    if (isValid) {
      setLoading(true);
      const prevStepVal = currentStep;
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
      const data = methods.getValues();
      const stepData: any = { [currentFields]: data[currentFields as keyof typeof data] };
      const saveRes = await saveAdmissionStep(admissionId, stepData, prevStepVal) as any;
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
    <div className="max-w-4xl mx-auto my-4 md:my-8 space-y-4 md:space-y-6">
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
                  <div className={cn("h-px flex-1 mx-1 md:mx-2", isPast ? "bg-emerald-200" : "bg-slate-100")} />
                )}
              </React.Fragment>
            );
          })}

        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 mb-6">
        <div className="p-4 md:p-8 flex flex-col bg-white">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="flex-1">
              {maxStep >= 10 && (
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
                <fieldset disabled={maxStep >= 10 && !isEditMode} className="space-y-4">
                  {currentStep === 1 && <BioStep />}
                  {currentStep === 2 && <ProfileStatsStep />}
                  {currentStep === 3 && <AddressStep />}
                  {currentStep === 4 && <AcademicStep />}
                  {currentStep === 5 && <SiblingsStep />}
                  {currentStep === 6 && <ParentsStep />}
                  {currentStep === 7 && <BankStep />}
                  {currentStep === 8 && <OfficeDocumentsStep admissionId={admissionId} />}
                  {currentStep === 9 && <DeclarationStep />}
                </fieldset>
                {currentStep === 10 && <SubmissionSuccessStep data={initialData} />}

              </div>


            </form>
          </FormProvider>

          {currentStep < 10 && (
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
                 {currentStep === 9 && (
                    <button 
                      type="button"
                      onClick={handleApprove} 
                      disabled={verifying || maxStep >= 10}
                      className="flex-1 md:w-auto flex items-center justify-center gap-3 px-10 py-3.5 bg-emerald-600 text-white rounded-2xl font-black tracking-tight hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/30"
                    >
                      {verifying ? <Loader2 className="animate-spin" /> : <><Verified size={22} /> VERIFY DOCUMENTS</>}
                    </button>

                 )}
                 <button 
                   type="button" 
                   onClick={nextStep} 
                   className="flex-1 md:w-auto group flex items-center justify-center gap-3 px-10 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-slate-900/10"
                 >
                    Next Step <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
                 </button>
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
  return <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1 animate-in fade-in slide-in-from-top-1">This field is required</p>;
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
    const { register, watch } = useFormContext();
    return (
      <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-1">
          <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Identity & Health</h3>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Step 2: ID numbers and physical metrics.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-1">
                <label className={labelStyles}>Aadhaar Number (12 Digits)</label>
                <input {...register("studentBio.aadhaarNumber")} className={inputStyles} placeholder="0000 0000 0000" maxLength={12} />
            </div>
            <div className="space-y-1">
                <label className={labelStyles}>Samagra ID</label>
                <input {...register("studentBio.samagraId")} className={inputStyles} placeholder="9 Digit ID" />
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
                  <input {...register(`siblings.${index}.classCurrent`)} className={inputStyles} />
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
  const { register } = useFormContext();
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-1">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Academic</h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Step 4: Last school attended.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-1 md:col-span-2">
          <label className={labelStyles}>Last School Name</label>
          <input {...register("previousAcademic.schoolName")} className={inputStyles} placeholder="Enter full school name" />
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
          <input {...register("previousAcademic.classLastAttended")} className={inputStyles} placeholder="e.g. Class 5" />
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
  const { control, register, getValues, formState: { errors } } = useFormContext();
  const { fields, append } = useFieldArray({ control, name: "parentsGuardians" });

  React.useEffect(() => {
    if (fields.length === 0) {
      append([
        { personType: "FATHER", name: "", mobileNumber: "", occupation: "", qualification: "", aadhaarNumber: "", samagraNumber: "" },
        { personType: "MOTHER", name: "", mobileNumber: "", occupation: "", qualification: "", aadhaarNumber: "", samagraNumber: "" }
      ]);
    }
  }, [fields, append]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-4 md:pb-6">
      <div className="space-y-1 flex flex-col md:flex-row justify-between items-start md:items-end gap-3 md:gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Parents</h3>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Step 6: Father and Mother information.</p>
        </div>
        <button 
          type="button"
          onClick={() => append({ personType: "GUARDIAN", name: "", mobileNumber: "", occupation: "", qualification: "", aadhaarNumber: "", samagraNumber: "" })}
          className="bg-slate-900 text-white px-3 md:px-5 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold hover:bg-black transition-all flex items-center gap-2 uppercase tracking-widest"
        >
          <Plus size={14} /> Add Guard
        </button>
      </div>

      <div className="space-y-4 md:space-y-6">
        {fields.map((field, index) => {
          const parentErrors = (errors.parentsGuardians as any)?.[index];
          return (
            <div key={field.id} className="p-4 md:p-6 rounded-xl bg-white border border-slate-100 shadow-sm space-y-4 md:space-y-6">
              <h4 className="inline-flex px-3 py-1 rounded-full bg-slate-900 text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none">
                {(getValues as any)(`parentsGuardians.${index}.personType`)}
              </h4>
              
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
              <div className="space-y-1">
                <label className={labelStyles}>Occupation</label>
                <input {...register(`parentsGuardians.${index}.occupation`)} className={inputStyles} />
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
    const { register } = useFormContext();
    return (
      <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-1">
          <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Bank</h3>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Step 7: For scholarship and DBT.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-1"><label className={labelStyles}>Bank Name</label><input {...register("bankDetails.bankName")} className={inputStyles} /></div>
            <div className="space-y-1"><label className={labelStyles}>IFSC Code</label><input {...register("bankDetails.ifscCode")} className={inputStyles} /></div>
            <div className="space-y-1 md:col-span-2"><label className={labelStyles}>Account Holder Name</label><input {...register("bankDetails.accountHolderName")} className={inputStyles} /></div>
            <div className="space-y-1 md:col-span-2"><label className={labelStyles}>Account Number</label><input {...register("bankDetails.accountNumber")} className={inputStyles} /></div>
        </div>
      </div>
    );
}

function OfficeDocumentsStep({ admissionId }: { admissionId: string }) {
  const { watch } = useFormContext();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fetchingDoc, setFetchingDoc] = useState<string | null>(null);

  const documentList = [
    { id: "birthCertificate", name: "Birth Certificate", hindi: "जन्म प्रमाण पत्र" },
    { id: "studentPhoto", name: "Student Photo", hindi: "विद्यार्थी की फोटो" },
    { id: "marksheet", name: "Previous Marksheet", hindi: "पिछली कक्षा की अंकसूची" },
    { id: "casteCertificate", name: "Caste Certificate", hindi: "जाति प्रमाण पत्र" },
    { id: "affidavit", name: "Affidavit", hindi: "माता-पिता का शपथ पत्र" },
    { id: "transferCertificate", name: "Transfer Certificate (TC)", hindi: "स्थानांतरण प्रमाण पत्र" },
    { id: "scholarshipSlip", name: "Scholarship Slip", hindi: "छात्रवृत्ति पर्ची" },
  ];




  const handlePreview = async (docId: string) => {
    setFetchingDoc(docId);
    const res = await getDocumentContent(admissionId, docId);
    setFetchingDoc(null);
    if (res.success && res.content) {
      setPreviewUrl(res.content);
    } else {
      alert("Error loading document: " + (res.error || "Document not found"));
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto">
      <div className="space-y-1 text-center">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase italic underline decoration-blue-500 decoration-4 underline-offset-8">Review Documents</h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Step 8: Verify all uploaded records.</p>
      </div>
      
      <div className="space-y-2 md:space-y-3">
        {documentList.map((doc) => {
          const { watch, formState: { errors } } = useFormContext();
          const fileData = watch(`documents.${doc.id}`);
          const hasError = (errors.documents as any)?.[doc.id];
          // Let's use formState from useFormContext
          return (
            <DocumentRow 
                key={doc.id} 
                doc={doc} 
                fileData={fileData} 
                fetching={fetchingDoc === doc.id}
                onPreview={() => handlePreview(doc.id)}
            />
          );
        })}
      </div>

      {previewUrl && (
        <div 
          className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="absolute top-6 right-6 z-[10000]">
            <button 
                onClick={() => setPreviewUrl(null)}
                className="h-12 w-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/20"
            >
                <X size={32} />
            </button>
          </div>
          <div className="w-full h-full flex items-center justify-center p-0 md:p-4" onClick={e => e.stopPropagation()}>
            {previewUrl.includes("application/pdf") || previewUrl.startsWith("http") && previewUrl.endsWith(".pdf") ? (
              <iframe src={previewUrl} title="Document Preview" className="w-full h-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl bg-white" />
            ) : (
              <img 
                src={previewUrl} 
                alt="Document Preview" 
                className="max-h-full max-w-full object-contain shadow-2xl"
              />
            )}

          </div>
          <div className="absolute bottom-6 left-0 right-0 flex justify-center">
             <p className="bg-black/50 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-sm border border-white/10">
                Full Browser Preview
             </p>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentRow({ doc, fileData, fetching, onPreview }: { doc: any, fileData: any, fetching: boolean, onPreview: () => void }) {
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
                className="h-8 w-8 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
            >
                {fetching ? <Loader2 size={14} className="animate-spin" /> : <Eye size={16} />}
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


function DeclarationStep() {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-1 text-center">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 font-outfit tracking-tight uppercase">Decision & Review</h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium font-bold">Step 9: Final office verification.</p>
      </div>

      <div className="p-6 md:p-8 rounded-2xl md:rounded-[32px] bg-white border border-blue-50 shadow-sm space-y-6 md:space-y-8 max-w-2xl mx-auto">
        <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-inner">
                <CheckCircle size={32} />
            </div>
            <div>
                <h4 className="text-lg font-black uppercase">Verify Documentation</h4>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed mt-1">
                    Please ensure you have reviewed all documents in Step 8. 
                    Verification will allow the student to proceed to the Entrance Test.
                </p>
            </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          <div>
            <label className={cn(
              "flex items-center gap-4 md:gap-5 p-4 md:p-6 rounded-xl md:rounded-3xl cursor-pointer group transition-all",
              (errors.declaration as any)?.declarationAccepted ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-100 hover:bg-slate-100/50"
            )}>
              <input type="checkbox" {...register("declaration.declarationAccepted", { required: true })} className="h-6 w-6 md:h-7 md:w-7 rounded-lg border-2 border-slate-300 text-blue-600 cursor-pointer" />
              <span className={cn("text-[10px] md:text-xs font-bold uppercase tracking-widest", (errors.declaration as any)?.declarationAccepted ? "text-red-600" : "text-slate-700")}>Verified All Documents</span>
            </label>
            <ErrorMessage error={(errors.declaration as any)?.declarationAccepted} />
          </div>

          <div className="space-y-1">
            <label className={cn(labelStyles, "text-center")}>Student Name Reference</label>
            <input {...register("declaration.guardianName")} className={cn(getInputClass(null), "text-center text-lg md:text-xl font-black font-outfit uppercase border-t-0 border-l-0 border-r-0 rounded-none bg-transparent")} placeholder="Reference Name" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmissionSuccessStep({ data }: { data: any }) {
  const bio = data.studentBio || {};
  const formatDate = (date: any) => {
    if (!date) return "-";
    if (typeof date === 'string') return date;
    if (date instanceof Date) return date.toLocaleDateString('en-IN');
    return String(date);
  };

  return (
    <div className="animate-in zoom-in-95 fade-in duration-500 py-4 md:py-8">
      <div className="text-center space-y-4 md:space-y-6 mb-8 md:mb-12">
        <div className="inline-flex items-center justify-center h-20 w-20 md:h-24 md:w-24 rounded-[32px] bg-blue-50 text-blue-600 shadow-xl shadow-blue-500/10 border border-blue-100">
          <Verified size={48} strokeWidth={2.5} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 font-outfit tracking-tight uppercase italic">Verification Complete</h2>
          <p className="text-sm md:text-lg text-slate-500 font-bold uppercase tracking-widest leading-none">All documents have been officially reviewed.</p>
        </div>
      </div>

      <div className="bg-slate-50/50 rounded-[32px] border border-slate-100 p-6 md:p-10 space-y-8 md:space-y-12 shadow-inner text-center">
            <p className="font-black text-2xl uppercase">{bio.firstName} {bio.lastName}</p>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em]">Review Complete</p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
                <button
                    type="button"
                    onClick={() => window.location.href = "/office/inquiries?tab=admissions"}
                    className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.15em] text-xs hover:bg-black transition-all active:scale-95 shadow-2xl"
                >
                    Back to Admissions List
                </button>
            </div>
      </div>
    </div>
  );
}
