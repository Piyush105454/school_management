import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface LessonPlanData {
  deliveryDay: string;
  date: string;
  lpNo: string;
  className: string;
  subject: string;
  teacherNote: string;
  homework: string;
  teacherName: string;
  
  // New Step 2 fields
  unitChapterPage?: string;
  prepDay?: string;
  openingTimeEnergizer?: string;
  openingTimeRoadmap?: string;
  learningIndicators?: string;
  lessonIntroObjective?: string;
  newTopicIntro?: string;
  knowledgeBuilding?: string;
  lessonActivity?: string;
  outcomeFeedback?: string;
  closure?: string;
  prevDayCheck?: string;
  teacherObservation?: string;
  studentPerformanceGood?: string;
  studentPerformanceBad?: string;
  reviewerRemark?: string;
}

export async function generateLessonPlanPdf(data: LessonPlanData) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const margin = 40;

  // --- PAGE 1: TEACHER'S NOTE ---
  const page1 = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page1.getSize();
  let cursorY = height - margin;

  // Header Box
  page1.drawRectangle({ x: margin, y: cursorY - 30, width: width - 2 * margin, height: 30, borderWidth: 1, borderColor: rgb(0, 0, 0) });
  page1.drawLine({ start: { x: margin + (width - 2 * margin) / 2, y: cursorY }, end: { x: margin + (width - 2 * margin) / 2, y: cursorY - 30 }, thickness: 1, color: rgb(0, 0, 0) });
  page1.drawText("Teacher's Note", { x: margin + 30, y: cursorY - 20, size: 14, font: boldFont });
  page1.drawText(`LP Day: ${data.deliveryDay}  Date: ${data.date}  LP No: ${data.lpNo}`, { x: margin + (width - 2 * margin) / 2 + 10, y: cursorY - 18, size: 9, font: font });

  cursorY -= 30;

  // Content Box
  const noteBoxHeight = 350;
  page1.drawRectangle({ x: margin, y: cursorY - noteBoxHeight, width: width - 2 * margin, height: noteBoxHeight, borderWidth: 1, borderColor: rgb(0, 0, 0) });
  page1.drawLine({ start: { x: margin + (width - 2 * margin) / 2, y: cursorY }, end: { x: margin + (width - 2 * margin) / 2, y: cursorY - noteBoxHeight }, thickness: 1, color: rgb(0, 0, 0) });

  // Prep Text (Left)
  const prepText = "PREPARATION & REFLECTIONS:\n\n1. Write key points to highlight.\n2. Note stories or examples.\n3. Plan blackboard work.\n4. Prepare check questions.";
  const wrappedPrep = wrapText(prepText, (width - 2 * margin) / 2 - 20, 10, font);
  wrappedPrep.forEach((line, i) => page1.drawText(line, { x: margin + 10, y: cursorY - 30 - i * 14, size: 10, font: font, color: rgb(0.4, 0.4, 0.4) }));

  // Note Content (Right)
  const wrappedNote = wrapText(data.teacherNote || "No notes provided.", (width - 2 * margin) / 2 - 20, 11, font);
  wrappedNote.forEach((line, i) => page1.drawText(line, { x: margin + (width - 2 * margin) / 2 + 10, y: cursorY - 30 - i * 14, size: 11, font: font }));

  cursorY -= noteBoxHeight + 40;

  // Homework Section
  page1.drawRectangle({ x: margin, y: cursorY - 30, width: width - 2 * margin, height: 30, borderWidth: 1, borderColor: rgb(0, 0, 0), color: rgb(0.95, 0.95, 0.95) });
  page1.drawText("Today's Homework (For Students & Parents)", { x: margin + 10, y: cursorY - 20, size: 12, font: boldFont });
  page1.drawText(`Class: ${data.className}  Subject: ${data.subject}`, { x: margin + 300, y: cursorY - 20, size: 10, font: font });

  cursorY -= 30;
  const hwBoxHeight = 250;
  page1.drawRectangle({ x: margin, y: cursorY - hwBoxHeight, width: width - 2 * margin, height: hwBoxHeight, borderWidth: 1, borderColor: rgb(0, 0, 0) });
  const wrappedHw = wrapText(data.homework || "No homework assigned.", width - 2 * margin - 20, 11, font);
  wrappedHw.forEach((line, i) => page1.drawText(line, { x: margin + 10, y: cursorY - 30 - i * 14, size: 11, font: font }));

  // Signature Footer Page 1
  page1.drawText(`Teacher: ${data.teacherName}`, { x: margin, y: 50, size: 10, font: boldFont });
  page1.drawLine({ start: { x: margin + 100, y: 48 }, end: { x: margin + 300, y: 48 }, thickness: 1 });

  // --- PAGE 2: LESSON PLAN (EXPLANATION) ---
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  cursorY = height - margin;

  // Excel Header
  page2.drawRectangle({ x: margin, y: cursorY - 60, width: width - 2 * margin, height: 60, borderWidth: 1 });
  page2.drawText("DHANPURI PUBLIC SCHOOL", { x: width / 2 - 80, y: cursorY - 25, size: 14, font: boldFont });
  page2.drawText("Lesson Plan (EXPLANATION)", { x: width / 2 - 70, y: cursorY - 45, size: 12, font: boldFont });
  
  cursorY -= 60;

  // Shared Metadata Table
  const tableHeight = 40;
  page2.drawRectangle({ x: margin, y: cursorY - tableHeight, width: width - 2 * margin, height: tableHeight, borderWidth: 1 });
  page2.drawLine({ start: { x: margin + 250, y: cursorY }, end: { x: margin + 250, y: cursorY - tableHeight }, thickness: 1 });
  page2.drawText(`Subject: ${data.subject}`, { x: margin + 10, y: cursorY - 25, size: 10, font: font });
  page2.drawText(`Grade: ${data.className}`, { x: margin + 260, y: cursorY - 25, size: 10, font: font });

  cursorY -= tableHeight;

  // Content Grid (Sections)
  const drawSection = (title: string, content: string, rowHeight: number, split = 150) => {
    page2.drawRectangle({ x: margin, y: cursorY - rowHeight, width: width - 2 * margin, height: rowHeight, borderWidth: 1 });
    page2.drawLine({ start: { x: margin + split, y: cursorY }, end: { x: margin + split, y: cursorY - rowHeight }, thickness: 1 });
    page2.drawText(title, { x: margin + 5, y: cursorY - 25, size: 9, font: boldFont });
    
    const wrapped = wrapText(content || "-", width - 2 * margin - split - 20, 9, font);
    wrapped.forEach((line, i) => {
      if (cursorY - 25 - i * 12 > margin + 50) { // Simple overflow check
        page2.drawText(line, { x: margin + split + 10, y: cursorY - 25 - i * 12, size: 9, font: font });
      }
    });
    cursorY -= rowHeight;
  };

  drawSection("Unit / Chapter", data.unitChapterPage || "", 40);
  drawSection("Opening Time (Energizer)", data.openingTimeEnergizer || "", 60);
  drawSection("Active Learning", data.newTopicIntro || "", 120);
  drawSection("Activity Detail", data.lessonActivity || "", 100);
  drawSection("Closure / Reward", data.closure || "", 60);
  drawSection("Teacher Observation", data.teacherObservation || "", 80);
  drawSection("Reviewer Remark", data.reviewerRemark || "", 80);

  // Footer Signature Page 2
  const footerY = 60;
  page2.drawText("Teacher Sign: ________________", { x: margin, y: footerY, size: 10, font: font });
  page2.drawText("Reviewer/Principal Sign: ________________", { x: margin + 250, y: footerY, size: 10, font: font });

  return await pdfDoc.save();
}

function wrapText(text: string, maxWidth: number, fontSize: number, font: any) {
  const lines: string[] = [];
  const paragraphs = text.split("\n");

  for (const paragraph of paragraphs) {
    if (!paragraph) {
        lines.push("");
        continue;
    }
    const words = paragraph.split(" ");
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
  }
  return lines;
}
