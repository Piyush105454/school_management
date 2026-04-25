import { 
  UserCheck,
  ClipboardCheck, 
  Clock, 
  CheckCircle2, 
  Shield,
  MapPin,
  BookOpen,
  Users,
  CreditCard,
  FileText
} from "lucide-react";

export const ADMISSION_STEPS = {
  1: { name: "Bio Info", icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-100" },
  2: { name: "Stats/ID", icon: UserCheck, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
  3: { name: "Address", icon: MapPin, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  4: { name: "Academic", icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  5: { name: "Siblings", icon: Users, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
  6: { name: "Parents", icon: Users, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-100" },
  7: { name: "Bank", icon: CreditCard, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100" },
  8: { name: "Docs", icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  9: { name: "Final Review", icon: Clock, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  10: { name: "Pending Office Review", icon: Shield, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  11: { name: "Document Verification", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  12: { name: "Entrance Test", icon: FileText, color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-100" },
  13: { name: "Home Visit", icon: Shield, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  14: { name: "Final Approved", icon: CheckCircle2, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  15: { name: "Admitted", icon: CheckCircle2, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
};

export function getComputedStep(adm: any) {
  // Extract data from shared structure
  const profile = adm.profile || adm;
  const meta = adm.admissionMeta || adm;
  const checklist = meta?.documentChecklists || adm.documentChecklist;
  const entrance = meta?.entranceTest || adm.entranceTest;
  const home = meta?.homeVisit || adm.homeVisit;

  // Milestone Flags
  const isFormDone = (profile.admissionStep || 0) >= 10;
  const isVerified = !!checklist?.formReceivedComplete;
  const isTestPassed = entrance?.status === "PASS";
  const isHomeVisitPassed = home?.status === "PASS";
  const isFullyAdmitted = profile.isFullyAdmitted;

  // 1. Fully Admitted (Step 15)
  if (isFullyAdmitted) return 15;

  // 2. Final Approval / Pending Admission (Step 14)
  if (isHomeVisitPassed && isVerified && isTestPassed) return 14;

  // 5. Verification Stage (Status Detection)
  if (isVerified) {
    if (isTestPassed) {
       if (isHomeVisitPassed) return 14; // Final Approved
       return 13; // Home Visit Stage
    }
    return 12; // Entrance Test Stage
  }

  // 6. Pending Verification or Form Progress
  if (isFormDone) return 10;
  return profile.admissionStep || 1;
}

export function getStepRedirect(adm: any) {
  const step = getComputedStep(adm);
  if (step <= 9) return `/office/admissions/${adm.id}`;
  if (step === 10 || step === 11) return `/office/admissions/${adm.id}?step=10`;
  if (step === 12) return `/office/admissions/${adm.id}?step=11`;
  if (step === 13) return `/office/admissions/${adm.id}?step=12`;
  if (step === 14) return `/office/admissions/${adm.id}?step=13`;
  if (step === 15) return `/office/admissions/${adm.id}`;
  return "#";
}

export function getStatusText(adm: any) {
  // Priority: If officeRemarks are present, notify that remarks have been sent for correction
  if (adm.officeRemarks && adm.officeRemarks.trim() !== "") {
    return "Remarks Sent";
  }

  const computedStep = getComputedStep(adm);

  if (computedStep >= 15) return "Admitted";
  if (computedStep === 14) return "Final Approved";
  if (computedStep === 13) return "Home Visit";
  if (computedStep === 12) return "Entrance Test";
  if (computedStep === 11) return "Document Verified";
  if (computedStep === 10) return "Awaiting Verification";
  if (computedStep === 9) return "Final Approval Pending";
  return "Drafting Application";
}
