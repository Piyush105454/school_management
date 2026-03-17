import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getAdmissionData } from "@/features/admissions/actions/admissionActions";

export const generateHomeVisitPDF = async (applicant: any) => {
  try {
      const visit = applicant.homeVisit || {};
      
      // 1. Fetch full admission details to get rich student details
      const detailRes = await getAdmissionData(applicant.id);
      const fullData = (detailRes.success ? detailRes.data : {}) as any;
      
      const bio = fullData.studentBio || {};
      const addr = fullData.address || {};
      const parents = fullData.parentsGuardians || [];
      const father = parents.find((p: any) => p.personType === 'FATHER') || {};

      const studentName = bio.firstName ? `${bio.firstName} ${bio.lastName || ""}` : applicant.inquiry?.studentName || "Student";
      const fatherName = father.name || applicant.inquiry?.fatherName || "-";
      const contactNumber = father.mobileNumber || applicant.inquiry?.contactNumber || "-";
      const addressString = addr.village ? `${addr.village}, ${addr.district}` : applicant.inquiry?.address || "-";
      
      const formUrl = '/home_visit_form.pdf';
      const formBytes = await fetch(formUrl).then(res => res.arrayBuffer());
      
      const pdfDoc = await PDFDocument.load(formBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      const drawField = (text: string, x: number, y: number) => {
          firstPage.drawText(String(text || "-"), {
              x, y,
              size: 9, 
              font: font,
              color: rgb(0, 0, 0)
          });
      };

      const startX = 330; 
      
      drawField(studentName, startX, 759);
      drawField(applicant.inquiry?.appliedClass || "-", startX, 744);
      drawField(applicant.entryNumber || "-", startX, 724);
      drawField(fatherName, startX, 703);
      drawField(contactNumber, startX, 681);
      drawField(addressString, startX, 665);
      drawField(`${visit.visitDate || ""} ${visit.visitTime || ""}`, 300, 648);
      drawField(visit.teacherName || "-", startX, 626);

      const pdfBytes = await pdfDoc.save();
      
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Home_Visit_Filled_${studentName.replace(/\s+/g, '_')}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (error) {
      console.error("PDF Generate Error:", error);
      alert("Failed to generate PDF on existing template. Check console logs.");
  }
};
