import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface PDFConversionProgress {
  currentPage: number;
  totalPages: number;
}

export async function convertPdfToImages(
  file: File,
  onProgress?: (progress: PDFConversionProgress) => void,
  scale: number = 2
): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images: string[] = [];
  const totalPages = pdf.numPages;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.({ currentPage: pageNum, totalPages });
    
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    
    if (!context) {
      throw new Error("Could not create canvas context");
    }
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }).promise;
    
    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    images.push(imageData);
  }
  
  return images;
}

export function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}
