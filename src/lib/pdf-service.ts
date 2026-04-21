import imageCompression from 'browser-image-compression';

/**
 * On-device PDF Compression Engine
 * Pipeline: PDF -> Page Images -> Compressed JPEGs -> New Optimized PDF
 */
export async function compressPdf(file: File, maxSizeMB: number): Promise<File> {
  console.log("PDF Compression Started for:", file.name, "Size:", (file.size / 1024 / 1024).toFixed(2), "MB");
  
  // Dynamically load libraries
  const { PDFDocument } = await import('pdf-lib');
  const pdfjs = await import('pdfjs-dist');
  
  // Set worker (Must match the exact version of the library installed)
  const PDFJS_VERSION = (pdfjs as any).version || '4.10.38'; 
  // Using unpkg as it correctly serves the .mjs worker files for v4+
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

  try {
    console.log("Loading PDF document...");
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ 
      data: arrayBuffer,
      // Disable font/shape/image c-maps to speed up and reduce complexity
      disableFontFace: true,
    });
    
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    console.log("Total Pages:", numPages);
    
    const newPdf = await PDFDocument.create();
    
    for (let i = 1; i <= numPages; i++) {
      console.log(`Processing Page ${i}/${numPages}...`);
      const page = await pdf.getPage(i);
      
      // Render at 1.5x scale (balance between quality and speed/size)
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) throw new Error("Could not create canvas context");
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({ canvasContext: context, viewport }).promise;
      
      // Convert to high-quality JPEG first
      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9)
      );
      
      if (!blob) continue;
      
      // Compress the page image
      const pageBudgetMB = (maxSizeMB * 0.95) / numPages; 
      console.log(`Shrinking Page ${i} to target:`, pageBudgetMB.toFixed(2), "MB");
      
      const compressedBlob = await imageCompression(new File([blob], `p${i}.jpg`, { type: 'image/jpeg' }), {
        maxSizeMB: pageBudgetMB,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        initialQuality: 0.7
      });
      
      const imageBytes = await compressedBlob.arrayBuffer();
      const embeddedImage = await newPdf.embedJpg(imageBytes);
      
      const newPage = newPdf.addPage([viewport.width, viewport.height]);
      newPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height,
      });
    }
    
    console.log("Finalizing PDF...");
    const pdfBytes = await newPdf.save();
    
    const resultFile = new File([pdfBytes as any], file.name.replace('.pdf', '_shrunk.pdf'), { 
      type: 'application/pdf' 
    });
    
    console.log("PDF Compression Complete!", 
      "Final Size:", (resultFile.size / 1024 / 1024).toFixed(2), "MB",
      "Savings:", Math.round((1 - resultFile.size / file.size) * 100), "%"
    );
    
    return resultFile;
  } catch (error: any) {
    console.error("PDF Compression CRITICAL Error:", error.message);
    throw error;
  }
}
