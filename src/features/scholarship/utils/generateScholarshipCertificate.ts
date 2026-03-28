import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";

export async function generateScholarshipCertificate(studentName: string): Promise<Uint8Array> {
  const filePath = path.join(process.cwd(), "DPS Cert - FEB - 2026.pdf");
  const existingPdfBytes = fs.readFileSync(filePath);

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  // If there are more than 1 page, we create a new document with only the first page
  const newPdfDoc = await PDFDocument.create();
  const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [0]);
  newPdfDoc.addPage(copiedPage);
  const targetPage = newPdfDoc.getPage(0);

  // Embed a bold font
  const font = await newPdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 48;

  // 1. White out the line for the name to make it look clean (Full width to catch dots)
  targetPage.drawRectangle({
    x: 50,
    y: 280,
    width: width - 100,
    height: 50,
    color: rgb(1, 1, 1), // White
  });

  // 2. White out the rank text section: "FOR OUTSTANDING PERFORMANCE AND SECURING THE..."
  // Expanded to ensure full removal
  targetPage.drawRectangle({
    x: 50,
    y: 170,
    width: width - 100,
    height: 110,
    color: rgb(1, 1, 1),
  });

  // 3. Draw the student name on the line after "AWARDED TO"
  const textWidth = font.widthOfTextAtSize(studentName.toUpperCase(), fontSize);
  const x = (width - textWidth) / 2;
  const yName = 295;
  
  targetPage.drawText(studentName.toUpperCase(), {
    x,
    y: yName,
    size: fontSize,
    font,
    color: rgb(0.1, 0.3, 0.6), // Rich blue
  });

  // 4. Draw the new scholarship text where the old rank text was
  const scholarshipText = "FOR SECURING THE REWARD SCHOLARSHIP OF Rs. 36,000";
  const subfontSize = 20;
  const subTextWidth = font.widthOfTextAtSize(scholarshipText, subfontSize);
  const xSub = (width - subTextWidth) / 2;
  const ySub = 235;

  targetPage.drawText(scholarshipText, {
    x: xSub,
    y: ySub,
    size: subfontSize,
    font,
    color: rgb(0.2, 0.2, 0.2), // Near Black
  });

  return await newPdfDoc.save();
}
