import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface LessonPlanData {
  deliveryDay: string;
  date: string;
  lpNo: string;
  teacherNote: string;
  className: string;
  subject: string;
  homework: string;
  teacherName: string;
}

export async function generateLessonPlanPdf(data: LessonPlanData) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 40;
  let cursorY = height - margin;

  // Header Box
  page.drawRectangle({
    x: margin,
    y: cursorY - 30,
    width: width - 2 * margin,
    height: 30,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
  });

  // Table Split
  page.drawLine({
    start: { x: margin + (width - 2 * margin) / 2, y: cursorY },
    end: { x: margin + (width - 2 * margin) / 2, y: cursorY - 30 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  page.drawText("Teacher's Note", {
    x: margin + 30,
    y: cursorY - 20,
    size: 14,
    font: boldFont,
  });

  const topMetaText = `LP Delivery Day: ${data.deliveryDay}   Date: ${data.date}   Your LP No. ${data.lpNo}`;
  page.drawText(topMetaText, {
    x: margin + (width - 2 * margin) / 2 + 10,
    y: cursorY - 18,
    size: 10,
    font: font,
  });

  cursorY -= 30;

  // Note Content Box
  const noteBoxHeight = 200;
  page.drawRectangle({
    x: margin,
    y: cursorY - noteBoxHeight,
    width: width - 2 * margin,
    height: noteBoxHeight,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
  });

  // Split center line continue
  page.drawLine({
    start: { x: margin + (width - 2 * margin) / 2, y: cursorY },
    end: { x: margin + (width - 2 * margin) / 2, y: cursorY - noteBoxHeight },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Placeholder/Help Text inside Note box (Left side)
  const helpText = "This section is for your own preparation and reflections before delivering the class.";
  const wrappedHelp = wrapText(helpText, (width - 2 * margin) / 2 - 20, 10, font);
  wrappedHelp.forEach((line, i) => {
    page.drawText(line, {
      x: margin + 10,
      y: cursorY - 30 - i * 14,
      size: 10,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
  });

  // User input Note (Right side)
  const wrappedNote = wrapText(data.teacherNote, (width - 2 * margin) / 2 - 20, 11, font);
  wrappedNote.forEach((line, i) => {
    page.drawText(line, {
      x: margin + (width - 2 * margin) / 2 + 10,
      y: cursorY - 20 - i * 14,
      size: 11,
      font: font,
    });
  });

  cursorY -= noteBoxHeight + 40;

  // Homework Section Header
  page.drawRectangle({
    x: margin,
    y: cursorY - 30,
    width: width - 2 * margin,
    height: 30,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
  });

  page.drawText("Today's Homework (For Students & Parents)", {
    x: margin + 10,
    y: cursorY - 20,
    size: 12,
    font: boldFont,
  });

  const hwMetaText = `Class: ${data.className}   Subject: ${data.subject}   Date: ${data.date}`;
  page.drawText(hwMetaText, {
    x: margin + 300,
    y: cursorY - 18,
    size: 10,
    font: font,
  });

  cursorY -= 30;

  // Homework Content Box
  const hwBoxHeight = 300;
  page.drawRectangle({
    x: margin,
    y: cursorY - hwBoxHeight,
    width: width - 2 * margin,
    height: hwBoxHeight,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
  });

  // User input Homework
  const wrappedHw = wrapText(data.homework, width - 2 * margin - 20, 11, font);
  wrappedHw.forEach((line, i) => {
    page.drawText(line, {
      x: margin + 10,
      y: cursorY - 20 - i * 14,
      size: 11,
      font: font,
    });
  });

  cursorY -= hwBoxHeight + 40;

  // Signature Section
  page.drawText("Teacher Name & Sign:", {
    x: margin,
    y: cursorY,
    size: 12,
    font: boldFont,
  });

  page.drawLine({
    start: { x: margin + 140, y: cursorY - 2 },
    end: { x: width - margin, y: cursorY - 2 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

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
