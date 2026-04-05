import { jsPDF } from "jspdf";
import { PDFDocument } from "pdf-lib";

export const generateAdmissionPDF = (data: any, studentName: string, options?: { returnBytes?: boolean }) => {
  const doc = new jsPDF() as any;
  const primaryColor = [37, 99, 235]; 

  let y = 10;
  const margin = 10;
  const pageWidth = 210;
  const contentWidth = pageWidth - 2 * margin; // 190mm

  // Update with startX offset parameter defaulting to margin
  const drawRow = (labels: string[], values: string[], widths: number[], height: number, startY: number, startX: number = margin) => {
    let cx = startX;
    labels.forEach((label, i) => {
      doc.rect(cx, startY, widths[i], height);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(`${label}:`, cx + 2, startY + 4);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      const textVal = String(values[i] || "-");
      doc.text(textVal, cx + 2, startY + 10);
      cx += widths[i];
    });
  };

  const drawHeader = (meta: any = {}) => {
    doc.rect(margin, y, contentWidth, 30);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Admission Form", margin + 2, y + 6);
    doc.setFontSize(8);
    doc.text("(Session: 2026-27)", margin + 2, y + 10);
    doc.setFontSize(7);
    doc.text("Re-Admission  [ ]", margin + 2, y + 16);
    doc.text("New Admission [ ]", margin + 2, y + 20);
    
    // Centers exactly at 105mm (margin 10 + half content 95)
    doc.setFontSize(16);
    doc.text("DHANPURI PUBLIC SCHOOL", margin + 95, y + 10, { align: "center" });
    doc.setFontSize(7);
    doc.text("UDISE - 23161219802 | Dhanpuri, Shahdol, Madhya Pradesh", margin + 95, y + 15, { align: "center" });
    doc.text("Sponsored by WES Foundation", margin + 95, y + 19, { align: "center" });

    // Grid boxes below title
    const centerBoxY = y + 22;
    doc.rect(margin + 40, centerBoxY, 110, 8);
    doc.line(margin + 40 + 36, centerBoxY, margin + 40 + 36, centerBoxY + 8);
    doc.line(margin + 40 + 72, centerBoxY, margin + 40 + 72, centerBoxY + 8);
    
    doc.setFontSize(6);
    doc.text("Entry Number", margin + 42, centerBoxY + 3);
    doc.text("Admission Number", margin + 40 + 38, centerBoxY + 3);
    doc.text("Scholar Number", margin + 40 + 74, centerBoxY + 3);

    doc.setFontSize(8);
    doc.text(String(meta.entryNumber || "-"), margin + 42, centerBoxY + 7);
    doc.text(String(meta.admissionNumber || "-"), margin + 40 + 38, centerBoxY + 7);
    doc.text(String(meta.scholarNumber || "-"), margin + 40 + 74, centerBoxY + 7);

    // Right logo box
    doc.rect(margin + 150, y, 40, 30);
    doc.text("LOGO", margin + 170, y + 15, { align: "center" });

    y += 32;
  };

  const drawSectionHeader = (title: string, subtext?: string) => {
    doc.setFillColor(230, 240, 230); // light green
    doc.rect(margin, y, contentWidth, 6, "F");
    doc.rect(margin, y, contentWidth, 6); 
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), margin + 2, y + 4);
    if (subtext) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(subtext, margin + 130, y + 4);
    }
    y += 6;
  };

  // ----- MAIN FLOW -----
  drawHeader(data.admissionMeta || {});

  const bio = data.studentBio || {};
  const addr = data.address || {};
  const bank = data.bankDetails || {};
  const academic = data.previousAcademic || {};
  const siblings = data.siblings || [];
  const parents = data.parentsGuardians || [];
  const docs = data.documents || {};

  drawSectionHeader("STUDENT DETAILS", "Student's Bio Data");

  const sidebarWidth = 25;
  const gridWidth = contentWidth - sidebarWidth; // 165mm

  doc.rect(margin, y, sidebarWidth, 24);
  
  if (docs.studentPhoto && docs.studentPhoto.startsWith("data:image")) {
    try {
      doc.addImage(docs.studentPhoto, "JPEG", margin, y, sidebarWidth, 24);
    } catch (e) {
      doc.setFontSize(7);
      doc.text("Paste", margin + 5, y + 6);
      doc.text("Photo", margin + 5, y + 10);
    }
  } else {
    doc.setFontSize(7);
    doc.text("Paste", margin + 5, y + 6);
    doc.text("Photo", margin + 5, y + 10);
  }

  drawRow(
      ["First Name", "Middle Name", "Last Name", "Gender"],
      [bio.firstName, bio.middleName, bio.lastName, bio.gender === "M" ? "Male" : "Female"],
      [45, 45, 45, 30], 
      12, y, margin + sidebarWidth
  );
  y += 12;

  drawRow(
      ["DOB (DD/MM/YYYY)", "Age", "Religion", "Caste", "Family ID"],
      [bio.dob, String(bio.age || ""), bio.religion, bio.caste, bio.familyId],
      [40, 15, 40, 35, 35], 
      12, y, margin + sidebarWidth
  );
  y += 12;

  drawRow(
      ["Blood Group", "Height (cm)", "Weight (kg)", "Aadhaar Card No", "Samagra ID"],
      [bio.bloodGroup, bio.heightCm, bio.weightKg, bio.aadhaarNumber, bio.samagraId],
      [25, 25, 25, 60, 55], 
      12, y, margin
  );
  y += 14;

  doc.rect(margin, y, contentWidth, 10);
  doc.text("CWSN (Child with Special Needs): " + (bio.cwsn ? "YES" : "NO"), margin + 2, y + 4);
  doc.text("Mention Problem: " + (bio.cwsnProblemDesc || "-"), margin + 60, y + 4);
  y += 12;

  drawSectionHeader("Address");
  drawRow(
      ["House No", "Ward No", "Street"],
      [addr.houseNo, addr.wardNo, addr.street],
      [45, 45, 100],
      12, y
  );
  y += 12;
  drawRow(
      ["Village/Town", "Tehsil", "District", "State", "PIN Code"],
      [addr.village, addr.tehsil, addr.district, addr.state, addr.pinCode],
      [40, 40, 40, 40, 30],
      12, y
  );
  y += 14;

  drawSectionHeader("Bank Details Account");
  drawRow(
      ["Bank Name", "Account Holder Name", "Account No", "IFSC"],
      [bank.bankName, bank.accountHolderName, bank.accountNumber, bank.ifscCode],
      [45, 45, 60, 40],
      12, y
  );
  y += 14;

  drawSectionHeader("Previous Academic Details");
  drawRow(
      ["Previous School Name", "Type", "APAAR ID", "PEN NO"],
      [academic.schoolName, academic.schoolType, academic.apaarId, academic.penNumber],
      [80, 25, 45, 40],
      12, y
  );
  y += 12;
  drawRow(
      ["Class Last Attended", "Session Year", "Marks Obtained", "Total Marks", "Percentage", "Pass/Fail"],
      [academic.classLastAttended, academic.sessionYear, academic.marksObtained, academic.totalMarks, academic.percentage, academic.passFail],
      [35, 30, 30, 30, 30, 35],
      12, y
  );
  y += 14;

  drawSectionHeader("Siblings Details", "Only real siblings");
  const siblingRows = siblings.slice(0, 3);
  for (let i = 0; i < 3; i++) {
    const s = siblingRows[i] || {};
    drawRow(
      [`Sibling Name ${i+1}`, "Age", "Gender", "Class", "School Name"],
      [s.name, s.age, s.gender, s.classCurrent, s.schoolName],
      [60, 15, 20, 30, 65],
      10, y
    );
    y += 10;
  }
  y += 4;

  doc.addPage();
  y = 10;

  drawSectionHeader("Mother, Father & Guardian Details");
  
  const drawParentRow = (title: string, p: any) => {
    doc.rect(margin, y, contentWidth, 30);
    doc.rect(margin, y, 20, 30);
    doc.setFontSize(6);
    doc.text(title, margin + 2, y + 10);
    doc.rect(margin + 20, y, 20, 30);
    if (p.photo && p.photo.startsWith("data:image")) {
       try {
          doc.addImage(p.photo, "JPEG", margin + 20, y, 20, 30);
       } catch (e) {
          doc.text("Paste Photo", margin + 22, y + 15);
       }
    } else {
       doc.text("Paste Photo", margin + 22, y + 15);
    }

    let cx = margin + 40;
    const infoWidth = contentWidth - 40;
    const colWidth = infoWidth / 2;

    doc.rect(cx, y, colWidth, 10);
    doc.rect(cx + colWidth, y, colWidth, 10);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Name:", cx + 2, y + 4);
    doc.setFont("helvetica", "bold");
    doc.text(String(p.name || "-"), cx + 2, y + 8);

    doc.setFont("helvetica", "normal");
    doc.text("Mobile No:", cx + colWidth + 2, y + 4);
    doc.setFont("helvetica", "bold");
    doc.text(String(p.mobileNumber || "-"), cx + colWidth + 2, y + 8);

    doc.rect(cx, y + 10, colWidth, 10);
    doc.rect(cx + colWidth, y + 10, colWidth, 10);
    doc.setFont("helvetica", "normal");
    doc.text("Qualification:", cx + 2, y + 14);
    doc.setFont("helvetica", "bold");
    doc.text(String(p.qualification || "-"), cx + 2, y + 18);

    doc.setFont("helvetica", "normal");
    doc.text("Occupation:", cx + colWidth + 2, y + 14);
    doc.setFont("helvetica", "bold");
    doc.text(String(p.occupation || "-"), cx + colWidth + 2, y + 18);

    doc.rect(cx, y + 20, colWidth, 10);
    doc.rect(cx + colWidth, y + 20, colWidth, 10);
    doc.setFont("helvetica", "normal");
    doc.text("Aadhaar No:", cx + 2, y + 24);
    doc.setFont("helvetica", "bold");
    doc.text(String(p.aadhaarNumber || "-"), cx + 2, y + 28);

    doc.setFont("helvetica", "normal");
    doc.text("Smagra No:", cx + colWidth + 2, y + 24);
    doc.setFont("helvetica", "bold");
    doc.text("-", cx + colWidth + 2, y + 28);

    y += 30;
  };

  const father = parents.find((p: any) => p.personType === "FATHER") || {};
  const mother = parents.find((p: any) => p.personType === "MOTHER") || {};
  const guardian = parents.find((p: any) => p.personType === "GUARDIAN") || {};

  drawParentRow("Father's Details", father);
  y += 2;
  drawParentRow("Mother's Details", mother);
  y += 2;
  drawParentRow("Legal Guardian", guardian);
  y += 6;

  drawSectionHeader("Declaration BY PARENT / GUARDIAN");
  doc.rect(margin, y, contentWidth, 20);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text('"I hereby solemnly declare that all information furnished in this application is true, complete and correct."', margin + 2, y + 5, { width: 180 });
  doc.setFont("helvetica", "bold");
  
  const declGuard = data.parentsGuardians?.find((p: any) => p.personType === "FATHER")?.name 
                 || data.declaration?.guardianName || "-";
  doc.text(`Parent Name: ${declGuard}`, margin + 110, y + 10);
  doc.text("Parent Signature: ____________________", margin + 110, y + 16);
  y += 22;

  drawSectionHeader("FOR OFFICE USE ONLY");
  doc.rect(margin, y, contentWidth, 40);
  const leftCol = 100;
  doc.line(margin + leftCol, y, margin + leftCol, y + 40);

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Checklist of Documents Attached:", margin + 2, y + 4);
  doc.setFont("helvetica", "normal");
  
  const checkItems = [
    { label: "1. Birth Certificate", checked: docs.birthCertificate },
    { label: "2. Marksheet", checked: docs.marksheet },
    { label: "3. Student Photo", checked: docs.studentPhoto },
    { label: "4. Caste Certificate", checked: docs.casteCertificate },
    { label: "5. Affidavit", checked: docs.affidavit },
    { label: "6. TC", checked: docs.transferCertificate }
  ];
  
  checkItems.forEach((c, idx) => {
     const py = y + 10 + (idx * 5);
     doc.text(c.label, margin + 4, py);
     doc.rect(margin + 40, py - 3, 3, 3); 
     if (c.checked) {
        doc.line(margin + 40 + 0.5, py - 1.5, margin + 40 + 1.2, py - 0.5);
        doc.line(margin + 40 + 1.2, py - 0.5, margin + 40 + 2.5, py - 2.5);
     }
  });

  doc.text("Receive Only If Form Is Complete", margin + leftCol + 4, y + 8);
  doc.text("Sign: ____________________", margin + leftCol + 4, y + 15);
  doc.text("Admin Signature: ____________________", margin + leftCol + 4, y + 30);

  y += 42;

  if (options?.returnBytes) {
      return doc.output('arraybuffer') as ArrayBuffer;
  }

  doc.save(`Admission_Form_${studentName.replace(/\s+/g, '_') || "Student"}.pdf`);
};

export const generateMergedApplicationPDF = async (data: any, studentName: string) => {
  try {
      const admissionBytes = generateAdmissionPDF(data, studentName, { returnBytes: true }) as ArrayBuffer;
      const prospectusUrl = '/prospectus.pdf';
      const prospectusBytes = await fetch(prospectusUrl).then(res => res.arrayBuffer());

      const mergedPdf = await PDFDocument.create();
      const admissionPdfDoc = await PDFDocument.load(admissionBytes);
      const prospectusPdfDoc = await PDFDocument.load(prospectusBytes);

      const admissionPages = await mergedPdf.copyPages(admissionPdfDoc, admissionPdfDoc.getPageIndices());
      admissionPages.forEach(page => mergedPdf.addPage(page));

      const prospectusPages = await mergedPdf.copyPages(prospectusPdfDoc, prospectusPdfDoc.getPageIndices());
      prospectusPages.forEach(page => mergedPdf.addPage(page));

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DPS_Application_Plus_Prospectus_${studentName.replace(/\s+/g, '_')}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (err) {
      console.error("Merge error:", err);
      alert("Failed to merge with prospectus. Make sure prospectus.pdf exists in public/.");
  }
};
