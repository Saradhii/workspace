/**
 * OCR Text Extraction using HuggingFace DeepSeek-OCR
 * Handles: images, scanned PDFs, documents converted to images
 */

import { ExtractionMethod } from '../document-store';
import { HuggingFaceProvider } from '@/lib/ai/providers/huggingface-provider';
import { OCRGenerationRequest, OCRGenerationResponse } from '@/types/api';

export interface OCRExtractionResult {
  text: string;
  method: ExtractionMethod;
  model: string;
  processingTimeMs: number;
  success: boolean;
  error?: string;
  pagesProcessed?: number;
  truncated?: boolean;
}

/**
 * Extract text from image using OCR
 */
export async function extractTextFromImage(
  buffer: Buffer,
  fileName: string,
  options: {
    model?: string;
    prompt?: string;
  } = {}
): Promise<OCRExtractionResult> {
  const startTime = Date.now();

  try {
    // Convert buffer to base64
    const base64Image = buffer.toString('base64');
    const mimeType = getMimeTypeFromFileName(fileName);
    const dataUri = `data:${mimeType};base64,${base64Image}`;

    // Use HuggingFace provider for OCR
    const provider = new HuggingFaceProvider();
    await provider.initialize({
      type: 'huggingface',
      apiKey: process.env.HUGGINGFACE_API_KEY || '',
    });

    const model = options.model || 'deepseek-ai/DeepSeek-OCR';
    const prompt = options.prompt || (model.includes('DeepSeek-OCR')
      ? 'Convert this document to markdown:'
      : 'Extract all text from this image:');

    const result: OCRGenerationResponse = await provider.performOCR({
      image: dataUri,
      model,
      prompt,
    });

    const processingTimeMs = Date.now() - startTime;

    if (!result.success || !result.text) {
      return {
        text: '',
        method: 'ocr-deepseek',
        model: result.model_used || model,
        processingTimeMs,
        success: false,
        error: result.error || 'OCR extraction failed',
      };
    }

    return {
      text: result.text,
      method: 'ocr-deepseek',
      model: result.model_used || model,
      processingTimeMs,
      success: true,
      pagesProcessed: 1,
      truncated: result.truncated,
    };

  } catch (error) {
    const processingTimeMs = Date.now() - startTime;

    return {
      text: '',
      method: 'ocr-deepseek',
      model: options.model || 'deepseek-ai/DeepSeek-OCR',
      processingTimeMs,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown OCR error',
    };
  }
}

/**
 * Extract text from multiple images (e.g., multi-page PDF converted to images)
 */
export async function extractTextFromMultipleImages(
  imageBuffers: Buffer[],
  fileName: string,
  options: {
    model?: string;
    prompt?: string;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<OCRExtractionResult> {
  const startTime = Date.now();
  const extractedPages: string[] = [];
  let totalProcessingTime = 0;
  const model = options.model || 'deepseek-ai/DeepSeek-OCR';

  try {
    // Process each image
    for (let i = 0; i < imageBuffers.length; i++) {
      const buffer = imageBuffers[i];

      // Report progress
      if (options.onProgress) {
        options.onProgress(i + 1, imageBuffers.length);
      }

      const result = await extractTextFromImage(buffer, fileName, {
        model: options.model,
        prompt: options.prompt,
      });

      if (result.success && result.text) {
        extractedPages.push(`\n--- Page ${i + 1} ---\n${result.text}`);
        totalProcessingTime += result.processingTimeMs;
      } else {
        console.warn(`[OCR] Failed to extract text from page ${i + 1}: ${result.error}`);
        extractedPages.push(`\n--- Page ${i + 1} (extraction failed) ---\n`);
      }
    }

    const allText = extractedPages.join('\n\n');
    const processingTimeMs = Date.now() - startTime;

    if (!allText || allText.trim().length === 0) {
      return {
        text: '',
        method: 'ocr-deepseek',
        model,
        processingTimeMs,
        success: false,
        error: 'No text extracted from any pages',
        pagesProcessed: imageBuffers.length,
      };
    }

    return {
      text: allText,
      method: 'ocr-deepseek',
      model,
      processingTimeMs,
      success: true,
      pagesProcessed: imageBuffers.length,
    };

  } catch (error) {
    const processingTimeMs = Date.now() - startTime;

    return {
      text: '',
      method: 'ocr-deepseek',
      model,
      processingTimeMs,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during multi-page OCR',
      pagesProcessed: imageBuffers.length,
    };
  }
}

/**
 * Check if file type is an image that supports OCR
 */
export function isImageFile(fileName: string): boolean {
  const imageExtensions = [
    '.jpg', '.jpeg', '.png', '.webp',
    '.gif', '.bmp', '.tiff', '.tif',
    '.heic', '.heif',
  ];

  const extension = getFileExtension(fileName);
  return imageExtensions.includes(extension);
}

/**
 * Get MIME type from file name
 */
function getMimeTypeFromFileName(fileName: string): string {
  const extension = getFileExtension(fileName);

  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
  };

  return mimeTypes[extension] || 'image/jpeg';
}

/**
 * Get file extension from filename
 */
function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
}

/**
 * Convert image to a format suitable for OCR
 * (e.g., convert HEIC to PNG)
 */
export async function convertImageFormat(
  buffer: Buffer,
  fileName: string
): Promise<{ buffer: Buffer; fileName: string }> {
  const extension = getFileExtension(fileName);

  // For HEIC/HEIF, we might need conversion
  // For now, just return the original buffer
  // TODO: Add image conversion library if needed (e.g., sharp)

  return { buffer, fileName };
}
