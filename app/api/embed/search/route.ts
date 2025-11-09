import { NextRequest, NextResponse } from 'next/server';
import { HuggingFaceProvider } from '@/lib/ai/providers/huggingface-provider';
import { cosineSimilarity } from '@/lib/utils/cosine-similarity';

interface SearchRequest {
  query: string;
  model: string;
  documents: Array<{
    id: string;
    content: string;
    chunks: number;
    status: string;
  }>;
}

interface SearchResult {
  documentId: string;
  fileName: string;
  chunkNumber: number;
  content: string;
  similarity: number;
}

export async function POST(request: NextRequest) {
  try {
    const { query, model, documents }: SearchRequest = await request.json();

    if (!query || !model) {
      return NextResponse.json(
        { error: 'Query and model are required' },
        { status: 400 }
      );
    }

    // Initialize HF provider
    const provider = new HuggingFaceProvider();
    await provider.initialize({
      type: 'huggingface',
      apiKey: process.env.HUGGINGFACE_API_KEY || '',
    });

    // Generate embedding for the query
    const queryEmbedding = await provider.getEmbeddings({
      model,
      input: query,
    });

    if (!queryEmbedding.embeddings || queryEmbedding.embeddings.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate query embedding' },
        { status: 500 }
      );
    }

    const queryVector = queryEmbedding.embeddings[0];

    // Search through documents
    const allResults: SearchResult[] = [];

    for (const doc of documents.filter(d => d.status === 'ready')) {
      // Split document into chunks
      const chunkSize = 500;
      const chunks: string[] = [];

      for (let i = 0; i < doc.content.length; i += chunkSize) {
        chunks.push(doc.content.slice(i, i + chunkSize));
      }

      // Generate embeddings for all chunks
      const chunkEmbeddings = await provider.getEmbeddings({
        model,
        input: chunks,
      });

      // Calculate similarity for each chunk
      chunkEmbeddings.embeddings.forEach((chunkEmbedding, index) => {
        if (chunkEmbedding && queryVector && chunkEmbedding.length === queryVector.length) {
          const similarity = cosineSimilarity(queryVector, chunkEmbedding);

          allResults.push({
            documentId: doc.id,
            fileName: (doc as any).fileName || `Document ${doc.id}`,
            chunkNumber: index,
            content: chunks[index] || '',
            similarity,
          });
        }
      });
    }

    // Sort by similarity (descending)
    allResults.sort((a, b) => b.similarity - a.similarity);

    // Return top results
    const topResults = allResults.slice(0, 10);

    return NextResponse.json({
      results: topResults,
      total: allResults.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}