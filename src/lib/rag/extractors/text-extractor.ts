/**
 * Direct Text Extraction for simple file formats
 * Handles: .txt, .md, .json, .csv
 */

import { ExtractionMethod } from '../document-store';

export interface TextExtractionResult {
  text: string;
  method: ExtractionMethod;
  model: string;
  processingTimeMs: number;
  success: boolean;
  error?: string;
}

/**
 * Extract text from plain text files
 */
export async function extractText(
  buffer: Buffer,
  fileType: string,
  fileName: string
): Promise<TextExtractionResult> {
  const startTime = Date.now();

  try {
    let text = '';
    const extension = fileType.toLowerCase();

    switch (extension) {
      case '.txt':
      case '.md':
      case '.markdown':
        text = buffer.toString('utf-8');
        break;

      case '.json':
        // Parse JSON and extract text content
        try {
          const jsonData = JSON.parse(buffer.toString('utf-8'));
          text = extractTextFromJSON(jsonData);
        } catch (error) {
          throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;

      case '.csv':
        // Convert CSV to readable text
        text = convertCSVToText(buffer.toString('utf-8'));
        break;

      case '.html':
      case '.htm':
        // Strip HTML tags and extract text
        text = stripHTMLTags(buffer.toString('utf-8'));
        break;

      case '.xml':
        // Extract text from XML
        text = stripXMLTags(buffer.toString('utf-8'));
        break;

      default:
        // Try to read as UTF-8 text
        try {
          text = buffer.toString('utf-8');
          // Check if it's valid text (not binary)
          if (!isValidText(text)) {
            throw new Error('File appears to be binary, not text');
          }
        } catch {
          throw new Error(`Unsupported file type for direct text extraction: ${extension}`);
        }
    }

    // Validate extracted text
    if (!text || text.trim().length === 0) {
      throw new Error('No text content found in file');
    }

    const processingTimeMs = Date.now() - startTime;

    return {
      text: text.trim(),
      method: 'direct',
      model: 'direct-text-extraction',
      processingTimeMs,
      success: true,
    };

  } catch (error) {
    const processingTimeMs = Date.now() - startTime;

    return {
      text: '',
      method: 'direct',
      model: 'direct-text-extraction',
      processingTimeMs,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during text extraction',
    };
  }
}

/**
 * Extract text from JSON object recursively
 */
function extractTextFromJSON(obj: any, depth: number = 0): string {
  if (depth > 10) return ''; // Prevent infinite recursion

  const parts: string[] = [];

  if (typeof obj === 'string') {
    return obj;
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    obj.forEach(item => {
      const text = extractTextFromJSON(item, depth + 1);
      if (text) parts.push(text);
    });
    return parts.join('\n');
  }

  if (typeof obj === 'object' && obj !== null) {
    Object.entries(obj).forEach(([key, value]) => {
      // Add key as context
      parts.push(`${key}:`);
      const text = extractTextFromJSON(value, depth + 1);
      if (text) parts.push(text);
    });
    return parts.join('\n');
  }

  return '';
}

/**
 * Convert CSV to readable text format
 */
function convertCSVToText(csvContent: string): string {
  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    return '';
  }

  const parts: string[] = [];

  // Parse CSV (simple parser, doesn't handle all edge cases)
  lines.forEach((line, index) => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));

    if (index === 0) {
      // Header row
      parts.push(`Headers: ${values.join(', ')}`);
      parts.push('---');
    } else {
      // Data rows
      parts.push(`Row ${index}: ${values.join(', ')}`);
    }
  });

  return parts.join('\n');
}

/**
 * Strip HTML tags and extract text content
 */
function stripHTMLTags(html: string): string {
  // Remove script and style tags with their content
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Strip XML tags and extract text content
 */
function stripXMLTags(xml: string): string {
  // Remove XML/HTML comments
  let text = xml.replace(/<!--[\s\S]*?-->/g, '');

  // Remove CDATA sections but keep content
  text = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');

  // Remove XML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Check if text appears to be valid UTF-8 text (not binary)
 */
function isValidText(text: string): boolean {
  // Check for null bytes (common in binary files)
  if (text.includes('\0')) {
    return false;
  }

  // Check for excessive control characters
  const controlChars = text.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g);
  if (controlChars && controlChars.length > text.length * 0.1) {
    return false;
  }

  // Check if we have readable ASCII/UTF-8 characters
  const readableChars = text.match(/[\x20-\x7E\x0A\x0D\t]/g);
  if (!readableChars || readableChars.length < text.length * 0.7) {
    return false;
  }

  return true;
}

/**
 * Check if file type supports direct text extraction
 */
export function supportsDirectExtraction(fileType: string): boolean {
  const supportedTypes = [
    '.txt', '.md', '.markdown',
    '.json',
    '.csv',
    '.html', '.htm',
    '.xml',
    '.log',
    '.yaml', '.yml',
  ];

  return supportedTypes.includes(fileType.toLowerCase());
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
}
