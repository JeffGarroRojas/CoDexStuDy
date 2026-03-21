import fs from 'fs';

export interface PDFExtractionResult {
  text: string;
  pages: number;
  wordCount: number;
  title: string;
}

export async function extractTextFromPDF(filePath: string): Promise<PDFExtractionResult> {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
    
    const data = new Uint8Array(fs.readFileSync(filePath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    
    let fullText = '';
    const numPages = pdf.numPages;
    
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    const text = fullText
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();

    const words = text.split(/\s+/).filter((word: string) => word.length > 0);
    const wordCount = words.length;

    const lines = fullText.split('\n').filter((l: string) => l.trim().length > 0);
    const title = lines[0]?.substring(0, 100) || 'Documento sin título';

    return {
      text,
      pages: numPages,
      wordCount,
      title,
    };
  } catch (error) {
    throw new Error(`Error extracting PDF: ${error}`);
  }
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
}
