/**
 * PDF Text Extraction with OCR fallback
 * Strategy: Try text extraction first, fallback to OCR if no text found
 */

import { ExtractionMethod } from '../document-store';
import { extractTextFromMultipleImages } from './ocr-extractor';

export interface PDFExtractionResult {
  text: string;
  method: ExtractionMethod;
  model: string;
  processingTimeMs: number;
  success: boolean;
  error?: string;
  pageCount?: number;
  usedOCR?: boolean;
  textBasedPages?: number;
  ocrPages?: number;
}

/**
 * Extract text from PDF
 * Tries text extraction first, falls back to OCR if needed
 */
export async function extractTextFromPDF(
  buffer: Buffer,
  fileName: string,
  options: {
    forceOCR?: boolean;
    ocrModel?: string;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<PDFExtractionResult> {
  const startTime = Date.now();

  try {
    // Force OCR if requested
    if (options.forceOCR) {
      return await extractPDFUsingOCR(buffer, fileName, options);
    }

    // Try text extraction first
    // Use dynamic import to avoid ESM/CommonJS issues
    const pdfParse = await import('pdf-parse');
    const pdfData = await pdfParse.default(buffer);

    const hasText = pdfData.text && pdfData.text.trim().length > 100;
    const pageCount = pdfData.numpages || 0;

    if (hasText) {
      // Successfully extracted text
      const processingTimeMs = Date.now() - startTime;

      return {
        text: pdfData.text.trim(),
        method: 'pdf-text',
        model: 'pdf-parse',
        processingTimeMs,
        success: true,
        pageCount,
        usedOCR: false,
        textBasedPages: pageCount,
        ocrPages: 0,
      };
    }

    // No text found or very little text - likely scanned PDF
    console.log(`[PDF] No text found in PDF (${fileName}), falling back to OCR...`);

    // TODO: Fallback to OCR
    // For now, we'll return an error suggesting OCR
    // In a complete implementation, we would convert PDF pages to images and use OCR

    return {
      text: pdfData.text || '',
      method: 'pdf-text',
      model: 'pdf-parse',
      processingTimeMs: Date.now() - startTime,
      success: pdfData.text.trim().length > 0,
      pageCount,
      usedOCR: false,
      textBasedPages: 0,
      error: pdfData.text.trim().length === 0
        ? 'PDF appears to be scanned. OCR conversion is not yet implemented. Please convert to images and upload them separately.'
        : undefined,
    };

  } catch (error) {
    const processingTimeMs = Date.now() - startTime;

    // If text extraction fails, try OCR as fallback
    console.log(`[PDF] Text extraction failed (${fileName}), attempting OCR fallback...`);

    try {
      return await extractPDFUsingOCR(buffer, fileName, options);
    } catch (ocrError) {
      return {
        text: '',
        method: 'pdf-text',
        model: 'pdf-parse',
        processingTimeMs,
        success: false,
        error: `PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}. OCR fallback also failed: ${ocrError instanceof Error ? ocrError.message : 'Unknown error'}`,
      };
    }
  }
}

/**
 * Extract PDF using OCR (convert pages to images first)
 * Note: This requires additional libraries for PDF to image conversion
 */
async function extractPDFUsingOCR(
  buffer: Buffer,
  fileName: string,
  options: {
    ocrModel?: string;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<PDFExtractionResult> {
  const startTime = Date.now();

  // TODO: Implement PDF to image conversion + OCR
  // This requires libraries like pdf2pic or similar
  // For now, return an error message

  throw new Error(
    'PDF to image conversion for OCR is not yet implemented. ' +
    'Please use a PDF with extractable text or convert pages to images manually.'
  );

  /*
  // Future implementation would look like:

  const pdfData = await pdf(buffer);
  const pageCount = pdfData.numpages || 0;

  // Convert each page to image
  const imageBuffers: Buffer[] = [];
  for (let i = 1; i <= pageCount; i++) {
    const imageBuffer = await convertPDFPageToImage(buffer, i);
    imageBuffers.push(imageBuffer);
  }

  // Extract text using OCR
  const result = await extractTextFromMultipleImages(
    imageBuffers,
    fileName,
    {
      model: options.ocrModel,
      onProgress: options.onProgress,
    }
  );

  const processingTimeMs = Date.now() - startTime;

  return {
    text: result.text,
    method: 'hybrid',
    model: result.model,
    processingTimeMs,
    success: result.success,
    pageCount,
    usedOCR: true,
    textBasedPages: 0,
    ocrPages: pageCount,
    error: result.error,
  };
  */
}

/**
 * Check if file is a PDF
 */
export function isPDFFile(fileName: string): boolean {
  const extension = getFileExtension(fileName);
  return extension === '.pdf';
}

/**
 * Get file extension from filename
 */
function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
}

/**
 * Analyze PDF to determine if it needs OCR
 */
export async function analyzePDFTextContent(buffer: Buffer): Promise<{
  hasText: boolean;
  textLength: number;
  pageCount: number;
  needsOCR: boolean;
  estimatedTextPerPage: number;
}> {
  try {
    // Use dynamic import to avoid ESM/CommonJS issues
    const pdfParse = await import('pdf-parse');
    const pdfData = await pdfParse.default(buffer);
    const textLength = pdfData.text?.length || 0;
    const pageCount = pdfData.numpages || 0;
    const estimatedTextPerPage = pageCount > 0 ? textLength / pageCount : 0;

    // Consider it needs OCR if very little text per page (less than 50 chars per page)
    const needsOCR = estimatedTextPerPage < 50;

    return {
      hasText: textLength > 0,
      textLength,
      pageCount,
      needsOCR,
      estimatedTextPerPage,
    };
  } catch (error) {
    console.error('[PDF] Error analyzing PDF:', error);
    return {
      hasText: false,
      textLength: 0,
      pageCount: 0,
      needsOCR: true,
      estimatedTextPerPage: 0,
    };
  }
}
