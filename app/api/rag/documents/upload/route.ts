import { NextRequest, NextResponse } from 'next/server';
import documentStore, { RAGDocument, ExtractionMethod } from '@/lib/rag/document-store';
import { extractText, supportsDirectExtraction, getFileExtension } from '@/lib/rag/extractors/text-extractor';
import { extractTextFromImage, isImageFile } from '@/lib/rag/extractors/ocr-extractor';
import { extractTextFromPDF, isPDFFile } from '@/lib/rag/extractors/pdf-extractor';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (10MB)`,
        },
        { status: 400 }
      );
    }

    // Check if store has capacity
    if (!documentStore.hasCapacity(file.size)) {
      return NextResponse.json(
        {
          success: false,
          error: `Storage limit reached. Remaining capacity: ${(documentStore.getRemainingCapacity() / 1024 / 1024).toFixed(2)}MB`,
        },
        { status: 507 } // Insufficient Storage
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = file.name;
    const fileExtension = getFileExtension(fileName);
    const startTime = Date.now();

    // Determine extraction method and extract text
    let extractedText = '';
    let extractionMethod: ExtractionMethod = 'direct';
    let extractionModel = 'unknown';
    let processingTimeMs = 0;
    let pageCount: number | undefined;

    // Route to appropriate extractor
    if (isPDFFile(fileName)) {
      // PDF extraction
      console.log(`[Upload] Processing PDF: ${fileName}`);
      const result = await extractTextFromPDF(buffer, fileName);

      if (!result.success || !result.text) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to extract text from PDF',
          },
          { status: 400 }
        );
      }

      extractedText = result.text;
      extractionMethod = result.method;
      extractionModel = result.model;
      processingTimeMs = result.processingTimeMs;
      pageCount = result.pageCount;

    } else if (isImageFile(fileName)) {
      // Image OCR extraction
      console.log(`[Upload] Processing image with OCR: ${fileName}`);
      const result = await extractTextFromImage(buffer, fileName);

      if (!result.success || !result.text) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to extract text from image using OCR',
          },
          { status: 400 }
        );
      }

      extractedText = result.text;
      extractionMethod = result.method;
      extractionModel = result.model;
      processingTimeMs = result.processingTimeMs;
      pageCount = 1;

    } else if (supportsDirectExtraction(fileExtension)) {
      // Direct text extraction
      console.log(`[Upload] Processing text file: ${fileName}`);
      const result = await extractText(buffer, fileExtension, fileName);

      if (!result.success || !result.text) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to extract text from file',
          },
          { status: 400 }
        );
      }

      extractedText = result.text;
      extractionMethod = result.method;
      extractionModel = result.model;
      processingTimeMs = result.processingTimeMs;

    } else {
      // Unsupported file type
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file type: ${fileExtension}. Supported types: .txt, .md, .pdf, .jpg, .png, .json, .csv, .html, .xml`,
        },
        { status: 400 }
      );
    }

    // Validate extracted text
    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No text content extracted from file',
        },
        { status: 400 }
      );
    }

    // Create document object
    const documentId = generateDocumentId();
    const timestamp = new Date().toISOString();

    const document: RAGDocument = {
      id: documentId,
      fileName,
      fileType: fileExtension,
      fileSize: file.size,
      extractedText,
      extractionMethod,
      extractionModel,
      processingTimeMs,
      timestamp,
      metadata: {
        id: documentId,
        fileName,
        fileType: fileExtension,
        fileSize: file.size,
        mimeType: file.type,
        pageCount,
        timestamp,
      },
      extractionInfo: {
        method: extractionMethod,
        model: extractionModel,
        processingTimeMs,
        pagesProcessed: pageCount,
      },
    };

    // Add to in-memory store
    documentStore.add(document);

    console.log(`[Upload] Successfully processed: ${fileName} (${extractionMethod} via ${extractionModel})`);

    // Return response
    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        extractedText: document.extractedText.substring(0, 500) + '...', // Preview
        extractionMethod: document.extractionMethod,
        extractionModel: document.extractionModel,
        pageCount: document.metadata.pageCount,
        processingTimeMs: document.processingTimeMs,
        timestamp: document.timestamp,
        textLength: document.extractedText.length,
      },
      privacy: {
        stored: false,
        message: 'All data is processed in-memory only. Nothing is saved to disk or database.',
      },
    });

  } catch (error) {
    console.error('[Upload] Error processing file:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during file processing',
      },
      { status: 500 }
    );
  }
}

/**
 * Get all documents in memory
 */
export async function GET() {
  try {
    const documents = documentStore.getAll();
    const stats = documentStore.getStats();

    return NextResponse.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        extractionMethod: doc.extractionMethod,
        extractionModel: doc.extractionModel,
        textLength: doc.extractedText.length,
        chunkCount: doc.chunkCount,
        hasEmbeddings: !!doc.embeddings,
        timestamp: doc.timestamp,
      })),
      stats: {
        totalDocuments: stats.totalDocuments,
        totalSize: stats.totalSize,
        totalSizeMB: (stats.totalSize / 1024 / 1024).toFixed(2),
        memoryUsageMB: stats.memoryUsageMB.toFixed(2),
        remainingCapacityMB: (documentStore.getRemainingCapacity() / 1024 / 1024).toFixed(2),
      },
      privacy: {
        stored: false,
        message: 'All data is stored in-memory only. Data will be lost when the server restarts.',
      },
    });
  } catch (error) {
    console.error('[Upload] Error fetching documents:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate a unique document ID
 */
function generateDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
