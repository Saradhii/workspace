/**
 * OpenRouter Provider for AI models
 * Implements BaseAIProvider interface for OpenRouter API
 */

import {
  BaseAIProvider,
  BaseChatRequest,
  BaseChatResponse,
  BaseStreamEvent,
  BaseEmbeddingRequest,
  BaseEmbeddingResponse,
  ModelInfo,
  BaseChatMessage
} from './base-provider';

interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export class OpenRouterProvider extends BaseAIProvider {
  name = 'OpenRouter';
  type = 'openai' as const;
  private config: OpenRouterConfig;
  private readonly BASE_URL = 'https://openrouter.ai/api/v1';

  constructor(config: OpenRouterConfig) {
    super();

    if (!config.apiKey) {
      throw new Error('OpenRouter API key is required');
    }

    this.config = {
      ...config,
      baseUrl: config.baseUrl || this.BASE_URL,
      timeout: config.timeout || 60000,
    };
  }

  async initialize(config: any): Promise<void> {
    // Configuration is handled in constructor
  }

  async test(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();

      return data.data.map((model: any) => ({
        id: model.id,
        name: model.id,
        displayName: model.name || model.id,
        description: model.description,
        capabilities: {
          text: true,
          vision: model.id.includes('vision') || model.id.includes('claude-3'),
          tools: true,
          thinking: model.id.includes('o1') || model.id.includes('thinking'),
          embeddings: false,
        },
        contextWindow: model.context_length || 4096,
        pricing: {
          input: model.pricing?.prompt,
          output: model.pricing?.completion,
        },
      }));
    } catch (error) {
      console.error('Failed to fetch OpenRouter models:', error);
      return [];
    }
  }

  async createChat(request: BaseChatRequest): Promise<BaseChatResponse> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'AI Content Generation Platform',
      },
      body: JSON.stringify({
        model: request.model,
        messages: this.convertMessages(request.messages),
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        stream: false,
        tools: request.tools,
      }),
      signal: AbortSignal.timeout(this.config.timeout!),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'OpenRouter API error');
    }

    const data = await response.json();
    return this.convertResponse(data);
  }

  async *streamChat(request: BaseChatRequest): AsyncIterable<BaseStreamEvent> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'AI Content Generation Platform',
      },
      body: JSON.stringify({
        model: request.model,
        messages: this.convertMessages(request.messages),
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        stream: true,
        tools: request.tools,
      }),
      signal: AbortSignal.timeout(this.config.timeout!),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'OpenRouter API error');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              yield { type: 'done' };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;

              if (delta?.content) {
                yield {
                  type: 'content',
                  content: delta.content,
                };
              }

              if (delta?.thinking) {
                yield {
                  type: 'thinking',
                  thinking: delta.thinking,
                };
              }

              if (delta?.tool_calls) {
                yield {
                  type: 'tool_call',
                  tool_calls: delta.tool_calls,
                };
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async createEmbeddings(request: BaseEmbeddingRequest): Promise<BaseEmbeddingResponse> {
    throw new Error('OpenRouter does not support embeddings. Use a dedicated embedding provider.');
  }

  protected convertMessages(messages: BaseChatMessage[]): any[] {
    return messages.map(msg => {
      const converted: any = {
        role: msg.role,
        content: msg.content,
      };

      if (msg.images && msg.images.length > 0) {
        converted.content = [
          {
            type: 'text',
            text: msg.content,
          },
          ...msg.images.map(image => ({
            type: 'image_url',
            image_url: {
              url: image,
            },
          })),
        ];
      }

      if (msg.tool_calls) {
        converted.tool_calls = msg.tool_calls;
      }

      return converted;
    });
  }

  protected convertResponse(response: any): BaseChatResponse {
    const choice = response.choices?.[0];
    const message = choice?.message;

    return {
      content: message?.content || '',
      model: response.model,
      usage: response.usage ? {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens,
      } : undefined,
      finish_reason: choice?.finish_reason,
      tool_calls: message?.tool_calls,
    };
  }
}

export default OpenRouterProvider;