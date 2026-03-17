import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';

async function drawGrid() {
  const bytes = fs.readFileSync('public/home_visit_form.pdf');
  const pdfDoc = await PDFDocument.load(bytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Draw grid
  for (let x = 0; x <= width; x += 50) {
    firstPage.drawLine({
      start: { x: x, y: 0 },
      end: { x: x, y: height },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    firstPage.drawText(String(Math.round(x)), {
      x: x + 2,
      y: 5,
      size: 5,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  for (let y = 0; y <= height; y += 50) {
    firstPage.drawLine({
      start: { x: 0, y: y },
      end: { x: width, y: y },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    firstPage.drawText(String(Math.round(y)), {
      x: 5,
      y: y + 2,
      size: 5,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('public/home_visit_form_grid.pdf', pdfBytes);
  console.log("Grid PDF Created at public/home_visit_form_grid.pdf");
}

drawGrid().catch(console.error);
