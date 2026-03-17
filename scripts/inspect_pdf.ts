import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';

async function inspect() {
  const bytes = fs.readFileSync('public/home_visit_form.pdf');
  const pdfDoc = await PDFDocument.load(bytes);
  let form;
  try {
     form = pdfDoc.getForm();
  } catch (e) {
     console.log("No interactive form found in PDF.");
     return;
  }
  const fields = form.getFields();

  console.log(`Found ${fields.length} fields:`);
  fields.forEach(f => {
    console.log(`- Type: ${f.constructor.name} | Name: "${f.getName()}"`);
  });
}

inspect().catch(console.error);
