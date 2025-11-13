/**
 * Text Chunking Service for RAG
 * Splits long documents into smaller chunks for embedding and retrieval
 */

import { DocumentChunk } from '../document-store';

export type ChunkingStrategy = 'fixed' | 'sentence' | 'paragraph' | 'semantic';

export interface ChunkingConfig {
  chunkSize: number;
  chunkOverlap: number;
  strategy: ChunkingStrategy;
  preserveFormatting?: boolean;
  minChunkSize?: number; // Minimum chunk size (default: 50)
  maxChunkSize?: number; // Maximum chunk size (default: chunkSize * 1.5)
}

export interface ChunkingResult {
  chunks: DocumentChunk[];
  totalChunks: number;
  averageChunkSize: number;
  strategy: ChunkingStrategy;
  processingTimeMs: number;
  statistics: {
    minChunkSize: number;
    maxChunkSize: number;
    totalCharacters: number;
  };
}

/**
 * Main text chunking function
 */
export async function chunkText(
  text: string,
  documentId: string,
  config: ChunkingConfig
): Promise<ChunkingResult> {
  const startTime = Date.now();

  // Validate input
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot chunk empty text');
  }

  if (config.chunkSize < 50) {
    throw new Error('Chunk size must be at least 50 characters');
  }

  if (config.chunkOverlap >= config.chunkSize) {
    throw new Error('Chunk overlap must be less than chunk size');
  }

  // Choose chunking strategy
  let chunks: DocumentChunk[];

  switch (config.strategy) {
    case 'fixed':
      chunks = chunkByFixedSize(text, documentId, config);
      break;
    case 'sentence':
      chunks = chunkBySentence(text, documentId, config);
      break;
    case 'paragraph':
      chunks = chunkByParagraph(text, documentId, config);
      break;
    case 'semantic':
      chunks = chunkBySemantic(text, documentId, config);
      break;
    default:
      chunks = chunkByFixedSize(text, documentId, config);
  }

  // Calculate statistics
  const chunkSizes = chunks.map(c => c.text.length);
  const totalCharacters = chunks.reduce((sum, c) => sum + c.text.length, 0);
  const averageChunkSize = chunks.length > 0 ? Math.round(totalCharacters / chunks.length) : 0;

  const processingTimeMs = Date.now() - startTime;

  return {
    chunks,
    totalChunks: chunks.length,
    averageChunkSize,
    strategy: config.strategy,
    processingTimeMs,
    statistics: {
      minChunkSize: Math.min(...chunkSizes),
      maxChunkSize: Math.max(...chunkSizes),
      totalCharacters,
    },
  };
}

/**
 * Fixed-size chunking
 * Splits text into fixed-size chunks with overlap
 */
function chunkByFixedSize(
  text: string,
  documentId: string,
  config: ChunkingConfig
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const { chunkSize, chunkOverlap } = config;

  let startChar = 0;
  let index = 0;

  while (startChar < text.length) {
    const endChar = Math.min(startChar + chunkSize, text.length);
    const chunkText = text.slice(startChar, endChar);

    chunks.push({
      id: `${documentId}_chunk_${index}`,
      documentId,
      text: chunkText.trim(),
      index,
      startChar,
      endChar,
    });

    // Move start position by (chunkSize - overlap)
    startChar += chunkSize - chunkOverlap;
    index++;

    // Prevent infinite loop
    if (chunkSize - chunkOverlap <= 0) {
      break;
    }
  }

  return chunks;
}

/**
 * Sentence-based chunking
 * Splits text on sentence boundaries while respecting chunk size limits
 */
function chunkBySentence(
  text: string,
  documentId: string,
  config: ChunkingConfig
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const { chunkSize, chunkOverlap, minChunkSize = 50 } = config;

  // Split into sentences
  const sentences = splitIntoSentences(text);

  let currentChunk: string[] = [];
  let currentLength = 0;
  let startChar = 0;
  let index = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceLength = sentence.length;

    // If adding this sentence would exceed chunk size
    if (currentLength + sentenceLength > chunkSize && currentLength >= minChunkSize) {
      // Save current chunk
      const chunkText = currentChunk.join(' ').trim();
      const endChar = startChar + chunkText.length;

      chunks.push({
        id: `${documentId}_chunk_${index}`,
        documentId,
        text: chunkText,
        index,
        startChar,
        endChar,
      });

      // Handle overlap: keep last few sentences
      const overlapSentences = getOverlapSentences(currentChunk, chunkOverlap);
      currentChunk = overlapSentences;
      currentLength = currentChunk.join(' ').length;
      startChar = endChar - currentLength;
      index++;
    }

    // Add sentence to current chunk
    currentChunk.push(sentence);
    currentLength += sentenceLength + 1; // +1 for space
  }

  // Add final chunk
  if (currentChunk.length > 0) {
    const chunkText = currentChunk.join(' ').trim();
    const endChar = startChar + chunkText.length;

    chunks.push({
      id: `${documentId}_chunk_${index}`,
      documentId,
      text: chunkText,
      index,
      startChar,
      endChar,
    });
  }

  return chunks;
}

/**
 * Paragraph-based chunking
 * Splits text on paragraph boundaries
 */
function chunkByParagraph(
  text: string,
  documentId: string,
  config: ChunkingConfig
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const { chunkSize, chunkOverlap, minChunkSize = 100 } = config;

  // Split into paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  let currentChunk: string[] = [];
  let currentLength = 0;
  let startChar = 0;
  let index = 0;

  for (const paragraph of paragraphs) {
    const paragraphLength = paragraph.length;

    // If adding this paragraph would exceed chunk size
    if (currentLength + paragraphLength > chunkSize && currentLength >= minChunkSize) {
      // Save current chunk
      const chunkText = currentChunk.join('\n\n').trim();
      const endChar = startChar + chunkText.length;

      chunks.push({
        id: `${documentId}_chunk_${index}`,
        documentId,
        text: chunkText,
        index,
        startChar,
        endChar,
      });

      // Handle overlap: keep last paragraph
      if (chunkOverlap > 0 && currentChunk.length > 0) {
        const lastParagraph = currentChunk[currentChunk.length - 1];
        currentChunk = [lastParagraph];
        currentLength = lastParagraph.length;
        startChar = endChar - currentLength;
      } else {
        currentChunk = [];
        currentLength = 0;
        startChar = endChar;
      }
      index++;
    }

    // Add paragraph to current chunk
    currentChunk.push(paragraph);
    currentLength += paragraphLength + 2; // +2 for \n\n
  }

  // Add final chunk
  if (currentChunk.length > 0) {
    const chunkText = currentChunk.join('\n\n').trim();
    const endChar = startChar + chunkText.length;

    chunks.push({
      id: `${documentId}_chunk_${index}`,
      documentId,
      text: chunkText,
      index,
      startChar,
      endChar,
    });
  }

  return chunks;
}

/**
 * Semantic chunking (basic implementation)
 * Tries to keep semantically related content together
 */
function chunkBySemantic(
  text: string,
  documentId: string,
  config: ChunkingConfig
): DocumentChunk[] {
  // For now, use sentence-based chunking as a base
  // In a more advanced implementation, this would use embeddings or NLP
  return chunkBySentence(text, documentId, config);
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string): string[] {
  // Basic sentence splitting (can be improved with NLP libraries)
  const sentenceEndings = /[.!?]+[\s\n]/g;
  const sentences: string[] = [];

  let lastIndex = 0;
  let match;

  while ((match = sentenceEndings.exec(text)) !== null) {
    const sentence = text.slice(lastIndex, match.index + match[0].length).trim();
    if (sentence.length > 0) {
      sentences.push(sentence);
    }
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text as last sentence
  if (lastIndex < text.length) {
    const sentence = text.slice(lastIndex).trim();
    if (sentence.length > 0) {
      sentences.push(sentence);
    }
  }

  return sentences;
}

/**
 * Get sentences that fit within overlap size
 */
function getOverlapSentences(sentences: string[], overlapSize: number): string[] {
  if (overlapSize === 0) {
    return [];
  }

  const overlap: string[] = [];
  let currentLength = 0;

  // Work backwards from the end
  for (let i = sentences.length - 1; i >= 0; i--) {
    const sentence = sentences[i];
    if (currentLength + sentence.length <= overlapSize) {
      overlap.unshift(sentence);
      currentLength += sentence.length + 1;
    } else {
      break;
    }
  }

  return overlap;
}

/**
 * Validate chunking configuration
 */
export function validateChunkingConfig(config: ChunkingConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (config.chunkSize < 50) {
    errors.push('Chunk size must be at least 50 characters');
  }

  if (config.chunkSize > 5000) {
    errors.push('Chunk size must be at most 5000 characters');
  }

  if (config.chunkOverlap < 0) {
    errors.push('Chunk overlap cannot be negative');
  }

  if (config.chunkOverlap >= config.chunkSize) {
    errors.push('Chunk overlap must be less than chunk size');
  }

  const validStrategies: ChunkingStrategy[] = ['fixed', 'sentence', 'paragraph', 'semantic'];
  if (!validStrategies.includes(config.strategy)) {
    errors.push(`Invalid chunking strategy. Must be one of: ${validStrategies.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get default chunking configuration
 */
export function getDefaultChunkingConfig(): ChunkingConfig {
  return {
    chunkSize: 500,
    chunkOverlap: 50,
    strategy: 'sentence',
    preserveFormatting: false,
    minChunkSize: 50,
  };
}
