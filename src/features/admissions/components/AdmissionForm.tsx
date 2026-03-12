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
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { submitFullAdmissionForm, saveAdmissionStep } from "../actions/admissionActions";

const steps = [
  { id: 1, name: "Bio Info", icon: GraduationCap },
  { id: 2, name: "Stats/ID", icon: UserCheck },
  { id: 3, name: "Address", icon: MapPin },
  { id: 4, name: "Academic", icon: BookOpen },
  { id: 5, name: "Siblings", icon: Users },
  { id: 6, name: "Parents", icon: Users },
  { id: 7, name: "Bank", icon: CreditCard },
  { id: 8, name: "Finalize", icon: CheckCircle },
];

export function AdmissionForm({ admissionId, initialData, maxStep = 1 }: { admissionId: string, initialData?: any, maxStep?: number }) {
  const [currentStep, setCurrentStep] = useState(maxStep > 8 ? 8 : maxStep);
  const [loading, setLoading] = useState(false);
  const methods = useForm({
    shouldUnregister: false,
    defaultValues: initialData || {
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
      declaration: {
        declarationAccepted: false,
        guardianName: ""
      },
    }
  });

  React.useEffect(() => {
    if (initialData) {
      if (initialData.studentBio?.dob) {
        initialData.studentBio.dob = new Date(initialData.studentBio.dob).toISOString().split('T')[0];
      }
      methods.reset(initialData);
    }
  }, [initialData, methods]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    const result = await submitFullAdmissionForm(admissionId, data, 8) as any;
    setLoading(false);
    
    if (result.success) {
      alert("Application submitted successfully!");
      window.location.reload();
    } else {
      alert("Error: " + (result.error?.message || result.error || "Unknown error"));
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
      8: "declaration"
    };

    const currentFields = fieldsByStep[currentStep];
    const isValid = await methods.trigger(currentFields);
    
    if (isValid) {
      // Optimistic move
      const prevStepVal = currentStep;
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
      
      // Background save (Fast)
      const data = methods.getValues();
      const saveRes = await saveAdmissionStep(admissionId, data, prevStepVal) as any;
      if (!saveRes.success) {
         console.error("Step save failed, but UI moved forward for speed.");
      }
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-w-6xl mx-auto my-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[700px]">
        {/* Progress Sidebar */}
        <div className="bg-slate-950 p-10 text-white space-y-12">
          <div>
            <h2 className="text-2xl font-black font-outfit tracking-tight">ADMISSION</h2>
            <p className="text-slate-400 text-sm mt-2 font-medium">Academic Session 2026-27</p>
          </div>
          
          <div className="space-y-6">
            {steps.map((step) => {
              const isActive = currentStep === step.id;
              const isPast = maxStep > step.id || (currentStep > step.id);
              const isUnlocked = maxStep >= step.id;
              return (
                <div key={step.id} 
                  className={cn(
                    "flex items-center gap-5 group transition-all duration-200",
                    isUnlocked ? "cursor-pointer" : "opacity-30 cursor-not-allowed"
                  )} 
                  onClick={() => isUnlocked && setCurrentStep(step.id)}
                >
                  <div className={cn(
                    "h-11 w-11 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 relative",
                    isActive ? "bg-blue-600 border-blue-600 scale-110 shadow-xl shadow-blue-500/40 rotate-6" : 
                    isPast ? "bg-emerald-500 border-emerald-500" : "border-slate-800 text-slate-700 bg-slate-900/50"
                  )}>
                    <step.icon size={20} className={cn(
                      isActive || isPast ? "text-white" : "text-slate-600"
                    )} />
                    {isPast && (
                      <div className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-lg">
                        <CheckCircle size={14} className="text-emerald-500" />
                      </div>
                    )}
                  </div>
                  <div className="hidden lg:block">
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em]",
                      isActive ? "text-blue-400" : "text-slate-600"
                    )}>Step {step.id}</p>
                    <p className={cn(
                      "text-sm font-bold tracking-tight leading-none mt-1",
                      isActive ? "text-white" : "text-slate-500 group-hover:text-slate-400"
                    )}>{step.name}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-12 border-t border-slate-800/50">
             <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-xs text-slate-400 font-medium tracking-wide">SECURE ENCRYPTED FORM</p>
             </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="lg:col-span-3 p-12 flex flex-col h-full bg-slate-50/30">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="flex-1">
              <div className="max-w-3xl mx-auto">
                {currentStep === 1 && <BioStep />}
                {currentStep === 2 && <ProfileStatsStep />}
                {currentStep === 3 && <AddressStep />}
                {currentStep === 4 && <AcademicStep />}
                {currentStep === 5 && <SiblingsStep />}
                {currentStep === 6 && <ParentsStep />}
                {currentStep === 7 && <BankStep />}
                {currentStep === 8 && <DeclarationStep />}
              </div>
            </form>
          </FormProvider>

          <div className="mt-16 flex items-center justify-between pt-10 border-t border-slate-200/60 max-w-3xl mx-auto w-full">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="group flex items-center gap-3 px-8 py-3.5 rounded-2xl text-slate-600 font-bold hover:bg-slate-200/50 transition-all duration-200 disabled:opacity-30 border border-transparent hover:border-slate-200"
            >
              <ChevronLeft size={22} className="group-hover:-translate-x-1 transition-transform" /> Previous
            </button>
            
            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={nextStep}
                className="group flex items-center gap-3 px-10 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all duration-200 shadow-xl shadow-slate-900/10"
              >
                Next Step <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={methods.handleSubmit(onSubmit)}
                disabled={loading}
                className="flex items-center gap-3 px-12 py-3.5 bg-blue-600 text-white rounded-2xl font-black tracking-tight hover:bg-blue-700 transition-all duration-200 shadow-2xl shadow-blue-600/30 disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                  <>SUBMIT APPLICATION <CheckCircle size={22} /></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyles = "w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-200 placeholder:text-slate-400 font-medium text-slate-700";
const labelStyles = "text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block";

function BioStep() {
  const { register } = useFormContext();
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="space-y-2">
        <h3 className="text-3xl font-black text-slate-900 font-outfit tracking-tight">Basic Bio-Data</h3>
        <p className="text-slate-500 font-medium">Step 1: Primary identification details.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-1">
          <label className={labelStyles}>First Name*</label>
          <input {...register("studentBio.firstName", { required: true })} className={inputStyles} placeholder="John" />
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>Middle Name</label>
          <input {...register("studentBio.middleName")} className={inputStyles} placeholder="Albert" />
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>Last Name*</label>
          <input {...register("studentBio.lastName", { required: true })} className={inputStyles} placeholder="Doe" />
        </div>
        
        <div className="space-y-1">
          <label className={labelStyles}>Date of Birth*</label>
          <input type="date" {...register("studentBio.dob", { required: true })} className={inputStyles} />
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>Gender*</label>
          <select {...register("studentBio.gender", { required: true })} className={inputStyles}>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>Religion</label>
          <input {...register("studentBio.religion")} className={inputStyles} placeholder="Hinduism" />
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>Category*</label>
          <select {...register("studentBio.caste", { required: true })} className={inputStyles}>
            <option value="GEN">General</option>
            <option value="OBC">OBC</option>
            <option value="SC">SC</option>
            <option value="ST">ST</option>
          </select>
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
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-2">
          <h3 className="text-3xl font-black text-slate-900 font-outfit tracking-tight">Identity & Health</h3>
          <p className="text-slate-500 font-medium">Step 2: ID numbers and physical metrics.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
            <div className="space-y-1 flex gap-4">
                <div className="flex-1">
                    <label className={labelStyles}>Height (cm)</label>
                    <input type="number" step="0.1" {...register("studentBio.heightCm")} className={inputStyles} placeholder="0.0" />
                </div>
                <div className="flex-1">
                    <label className={labelStyles}>Weight (kg)</label>
                    <input type="number" step="0.1" {...register("studentBio.weightKg")} className={inputStyles} placeholder="0.0" />
                </div>
            </div>

            <div className="md:col-span-2 space-y-4 p-6 rounded-2xl bg-blue-50/50 border border-blue-100">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" {...register("studentBio.cwsn")} className="h-5 w-5 rounded border-slate-300 text-blue-600" />
                    <span className="text-sm font-bold text-slate-700">Child with Special Needs (CWSN)?</span>
                </label>
                {watch("studentBio.cwsn") && (
                    <div className="space-y-1">
                        <label className={labelStyles}>Problem Description</label>
                        <textarea {...register("studentBio.cwsnProblemDesc")} className={cn(inputStyles, "h-24 resize-none")} placeholder="Describe the condition..." />
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
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-2 flex justify-between items-end">
            <div>
                <h3 className="text-3xl font-black text-slate-900 font-outfit tracking-tight">Sibling Details</h3>
                <p className="text-slate-500 font-medium">Step 5: Information about brothers/sisters in this school.</p>
            </div>
            <button 
                type="button"
                onClick={() => append({ name: "", age: "", gender: "M", classCurrent: "", schoolName: "This School" })}
                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-all"
            >
                <Plus size={14} /> Add Sibling
            </button>
        </div>
  
        <div className="space-y-4">
          {fields.length === 0 && (
            <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                <p className="text-slate-400 font-medium italic">No sibling records added.</p>
            </div>
          )}
          {fields.map((field, index) => (
            <div key={field.id} className="p-6 rounded-2xl bg-white border border-slate-200/60 shadow-sm relative group">
              <button 
                type="button"
                onClick={() => remove(index)}
                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
  const { register } = useFormContext();
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h3 className="text-3xl font-black text-slate-900 font-outfit tracking-tight">Address Details</h3>
        <p className="text-slate-500 font-medium">Step 3: Permanent residential address.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-1 md:col-span-2">
          <label className={labelStyles}>House No / Street / Colony*</label>
          <input {...register("address.houseNo", { required: true })} className={inputStyles} placeholder="Building name, Street address" />
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>Village / City*</label>
          <input {...register("address.village", { required: true })} className={inputStyles} placeholder="Enter your city" />
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>Tehsil / Block</label>
          <input {...register("address.tehsil")} className={inputStyles} placeholder="Local block" />
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>District*</label>
          <input {...register("address.district", { required: true })} className={inputStyles} placeholder="District" />
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>Pin Code*</label>
          <input {...register("address.pinCode", { required: true })} className={inputStyles} placeholder="6 Digit Code" maxLength={6} />
        </div>
      </div>
    </div>
  );
}

function AcademicStep() {
  const { register } = useFormContext();
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h3 className="text-3xl font-black text-slate-900 font-outfit tracking-tight">Academic History</h3>
        <p className="text-slate-500 font-medium">Step 4: Details of the last school attended.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
  const { control, register, getValues } = useFormContext();
  const { fields } = useFieldArray({ control, name: "parentsGuardians" });

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="space-y-2">
        <h3 className="text-3xl font-black text-slate-900 font-outfit tracking-tight">Parent Details</h3>
        <p className="text-slate-500 font-medium">Step 6: Father and Mother information.</p>
      </div>

      <div className="space-y-8">
        {fields.map((field, index) => (
          <div key={field.id} className="p-8 rounded-3xl bg-white border border-slate-200/60 shadow-sm space-y-8">
            <h4 className="inline-flex px-4 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest leading-none">
              {(getValues as any)(`parentsGuardians.${index}.personType`)}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className={labelStyles}>Full Name*</label>
                <input {...register(`parentsGuardians.${index}.name`, { required: true })} className={inputStyles} />
              </div>
              <div className="space-y-1">
                <label className={labelStyles}>Mobile Number*</label>
                <input {...register(`parentsGuardians.${index}.mobileNumber`, { required: true })} className={inputStyles} />
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
          </div>
        ))}
      </div>
    </div>
  );
}

function BankStep() {
  const { register } = useFormContext();
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h3 className="text-3xl font-black text-slate-900 font-outfit tracking-tight">Bank Account</h3>
        <p className="text-slate-500 font-medium">Step 7: For scholarship and Direct Benefit Transfer.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-1">
          <label className={labelStyles}>Bank Name</label>
          <input {...register("bankDetails.bankName")} className={inputStyles} />
        </div>
        <div className="space-y-1">
          <label className={labelStyles}>IFSC Code</label>
          <input {...register("bankDetails.ifscCode")} className={inputStyles} />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className={labelStyles}>Account Holder Name</label>
          <input {...register("bankDetails.accountHolderName")} className={inputStyles} />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className={labelStyles}>Account Number</label>
          <input {...register("bankDetails.accountNumber")} className={inputStyles} />
        </div>
      </div>
    </div>
  );
}

function DeclarationStep() {
  const { register, watch } = useFormContext();
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2 text-center">
        <h3 className="text-3xl font-black text-slate-900 font-outfit tracking-tight uppercase">Final Declaration</h3>
        <p className="text-slate-500 font-medium">Step 8: Final validation and signature.</p>
      </div>

      <div className="p-10 rounded-[40px] bg-white border border-blue-100 shadow-2xl shadow-blue-500/10 space-y-10 max-w-2xl mx-auto">
        <p className="text-slate-600 font-medium leading-relaxed italic text-center">
            "I hereby solemnly declare that all information furnished in this application is true, complete and correct. I am aware that if any information is found incorrect, the admission will be cancelled."
        </p>

        <div className="space-y-8">
          <label className="flex items-center gap-5 p-6 rounded-3xl bg-slate-50 border border-slate-200/60 cursor-pointer group transition-all hover:bg-slate-100">
            <input type="checkbox" {...register("declaration.declarationAccepted", { required: true })} className="h-7 w-7 rounded-lg border-2 border-slate-300 text-blue-600 cursor-pointer" />
            <span className="text-sm font-bold text-slate-700 uppercase">I Accept All Terms</span>
          </label>

          <div className="space-y-1">
            <label className={cn(labelStyles, "text-center")}>Parent Signature (Full Name)*</label>
            <input {...register("declaration.guardianName", { required: true })} className={cn(inputStyles, "text-center text-xl font-black font-outfit uppercase border-t-0 border-l-0 border-r-0 rounded-none bg-transparent")} placeholder="Sign Here" />
          </div>
        </div>
      </div>
    </div>
  );
}
