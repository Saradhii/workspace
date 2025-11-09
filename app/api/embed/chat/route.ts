import { NextRequest, NextResponse } from 'next/server';
import { OllamaProvider } from '@/lib/ai/providers/ollama-provider';
import { OpenRouterProvider } from '@/lib/ai/providers/openrouter-provider';
import { ChutesProvider } from '@/lib/ai/providers/chutes-provider';

interface ChatRequest {
  query: string;
  context: string;
  sources?: Array<{
    documentId: string;
    fileName: string;
    chunkNumber: number;
    content: string;
    similarity: number;
  }>;
}

interface ChatResponse {
  response: string;
  sources: Array<{
    documentId: string;
    fileName: string;
    chunkNumber: number;
    content: string;
    similarity: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { query, context, sources }: ChatRequest = await request.json();

    if (!query || !context) {
      return NextResponse.json(
        { error: 'Query and context are required' },
        { status: 400 }
      );
    }

    // Get the default provider from environment
    const defaultProvider = process.env.AI_DEFAULT_PROVIDER || 'ollama';

    let provider;
    let modelId;

    // Initialize provider based on default
    switch (defaultProvider) {
      case 'ollama':
        provider = new OllamaProvider();
        await provider.initialize({
          apiKey: process.env.OLLAMA_API_KEY || '',
          baseUrl: process.env.OLLAMA_BASE_URL || 'https://ollama.com',
        });
        modelId = process.env.OLLAMA_DEFAULT_MODEL || 'gpt-oss:20b';
        break;

      case 'openrouter':
        provider = new OpenRouterProvider();
        await provider.initialize({
          apiKey: process.env.OPENROUTER_API_KEY || '',
        });
        modelId = 'microsoft/phi-3.5-mini-128k-instruct'; // Free model
        break;

      case 'chutes':
        provider = new ChutesProvider();
        await provider.initialize({
          apiKey: process.env.CHUTES_API_KEY || '',
          baseUrl: process.env.CHUTES_API_BASE_URL || 'https://llm.chutes.ai/v1',
        });
        modelId = 'gpt-4o-mini';
        break;

      default:
        provider = new OllamaProvider();
        await provider.initialize({
          apiKey: process.env.OLLAMA_API_KEY || '',
          baseUrl: process.env.OLLAMA_BASE_URL || 'https://ollama.com',
        });
        modelId = 'gpt-oss:20b';
    }

    // Create system prompt for RAG
    const systemPrompt = `You are a helpful AI assistant that answers questions based on the provided context.
Follow these guidelines:
1. Use only the information from the provided context to answer the question
2. If the context doesn't contain the answer, say "I don't have enough information to answer that question based on the provided documents"
3. Be concise and direct in your answers
4. Mention which document/source you're referencing when possible
5. Do not make up information or use external knowledge

Context:
${context}

Question: ${query}

Answer:`;

    // Generate response using the provider
    const response = await provider.chat({
      model: modelId,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        }
      ],
      temperature: 0.3, // Lower temperature for more factual responses
      max_tokens: 1000,
    });

    return NextResponse.json({
      response: response.content || response.message?.content || 'No response generated',
      sources: sources || [],
    } as ChatResponse);
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chat failed' },
      { status: 500 }
    );
  }
}