import { NextRequest, NextResponse } from 'next/server';
import vectorStore from '@/lib/rag/vector-store/memory-vector-store';
import embeddingService from '@/lib/rag/embedders/embedding-service';

/**
 * RAG answer generation endpoint
 * 1. Embeds the query
 * 2. Retrieves relevant chunks
 * 3. Generates answer using retrieved context
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      query,
      topK = 5,
      minScore = 0.0,
      model = 'all-MiniLM-L6-v2',
      provider = 'ollama',
      llmModel = 'gpt-oss:20b',
    } = body;

    // Validate query
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query is required and must be a non-empty string',
        },
        { status: 400 }
      );
    }

    // Check if vector store has any vectors
    const stats = vectorStore.getStats();
    if (stats.totalVectors === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No documents indexed. Please index documents first.',
        },
        { status: 400 }
      );
    }

    console.log(`[RAG] Generating answer for: "${query}"`);

    const startTime = Date.now();

    // 1. Generate embedding for the query
    const embeddingResult = await embeddingService.generateEmbeddings({
      texts: [query],
      model,
      provider: 'huggingface',
    });

    const queryEmbedding = embeddingResult.embeddings[0];
    const embeddingTimeMs = Date.now() - startTime;

    console.log(`[RAG] Query embedded in ${embeddingTimeMs}ms`);

    // 2. Search vector store for relevant chunks
    const searchStartTime = Date.now();
    const results = vectorStore.search(queryEmbedding, topK, minScore);
    const searchTimeMs = Date.now() - searchStartTime;

    console.log(`[RAG] Found ${results.length} relevant chunks in ${searchTimeMs}ms`);

    if (results.length === 0) {
      return NextResponse.json({
        success: true,
        query,
        answer: "I couldn't find any relevant information in the indexed documents to answer your question.",
        retrievedChunks: [],
        metadata: {
          totalChunks: 0,
          generationTimeMs: 0,
          totalTimeMs: Date.now() - startTime,
        },
      });
    }

    // 3. Build context from retrieved chunks
    const context = results
      .map((result, index) => `[${index + 1}] ${result.text}`)
      .join('\n\n');

    // 4. Generate answer using LLM
    const llmStartTime = Date.now();

    const prompt = `You are a helpful assistant that answers questions based on the provided context.

Context:
${context}

Question: ${query}

Instructions:
- Answer the question based ONLY on the information provided in the context above
- If the context doesn't contain enough information to answer the question, say so
- Be concise and accurate
- Cite the relevant context sections when possible

Answer:`;

    // Call LLM API based on provider
    let answer = '';
    let tokensUsed = 0;

    try {
      if (provider === 'ollama') {
        const ollamaResponse = await fetch(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OLLAMA_API_KEY}`,
          },
          body: JSON.stringify({
            model: llmModel,
            prompt,
            stream: false,
          }),
        });

        if (!ollamaResponse.ok) {
          throw new Error(`Ollama API error: ${ollamaResponse.status}`);
        }

        const ollamaData = await ollamaResponse.json();
        answer = ollamaData.response || '';
        tokensUsed = (ollamaData.eval_count || 0) + (ollamaData.prompt_eval_count || 0);
      } else if (provider === 'huggingface') {
        const hfResponse = await fetch(`${process.env.HUGGINGFACE_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          },
          body: JSON.stringify({
            model: llmModel,
            messages: [
              { role: 'system', content: 'You are a helpful assistant that answers questions based on provided context.' },
              { role: 'user', content: prompt },
            ],
            max_tokens: 500,
          }),
        });

        if (!hfResponse.ok) {
          throw new Error(`HuggingFace API error: ${hfResponse.status}`);
        }

        const hfData = await hfResponse.json();
        answer = hfData.choices?.[0]?.message?.content || '';
        tokensUsed = hfData.usage?.total_tokens || 0;
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error('[RAG] Error calling LLM:', error);
      // Fallback to extractive answer
      answer = `Based on the retrieved information:\n\n${results[0].text}\n\n(Note: LLM generation failed, showing most relevant chunk)`;
    }

    const generationTimeMs = Date.now() - llmStartTime;
    const totalTimeMs = Date.now() - startTime;

    console.log(`[RAG] Answer generated in ${generationTimeMs}ms (total: ${totalTimeMs}ms)`);

    // Return response
    return NextResponse.json({
      success: true,
      query,
      answer,
      retrievedChunks: results.map(result => ({
        id: result.id,
        documentId: result.documentId,
        fileName: result.metadata?.fileName || 'Unknown',
        text: result.text,
        score: result.score,
        chunkIndex: result.chunkIndex,
      })),
      metadata: {
        totalChunks: results.length,
        topK,
        minScore,
        embeddingModel: embeddingResult.model,
        llmModel,
        provider,
        tokensUsed,
      },
      performance: {
        embeddingTimeMs,
        searchTimeMs,
        generationTimeMs,
        totalTimeMs,
      },
    });
  } catch (error) {
    console.error('[RAG] Error generating answer:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during answer generation',
      },
      { status: 500 }
    );
  }
}
