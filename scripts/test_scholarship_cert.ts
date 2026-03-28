import { generateScholarshipCertificate } from "../src/features/scholarship/utils/generateScholarshipCertificate";
import * as fs from "fs";
import * as path from "path";

async function test() {
  const name = "Test Student Name";
  console.log(`Generating certificate for: ${name}`);
  const pdfBytes = await generateScholarshipCertificate(name);
  const outputPath = path.join(process.cwd(), "public", "test_scholarship_cert.pdf");
  
  if (!fs.existsSync(path.join(process.cwd(), "public"))) {
    fs.mkdirSync(path.join(process.cwd(), "public"));
  }
  
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`Certificate generated at: ${outputPath}`);
}

test().catch(console.error);
