import {
  TextGenerationRequest,
  TextGenerationResponse,
  TextStreamEvent,
  CodeGenerationRequest,
  CodeGenerationResponse,
  CodeStreamEvent,
  TextModel,
  CodeModel,
  TextModelsResponse,
  CodeModelsResponse
} from '@/types/api';

export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string;
  private appName: string;
  private appUrl: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.appName = process.env.OPENROUTER_APP_NAME || 'RAG Text Generation';
    this.appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': this.appUrl,
      'X-Title': this.appName,
    };
  }

  // Text Generation Methods
  async generateText(params: TextGenerationRequest): Promise<TextGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: params.model || 'meta-llama/llama-3.2-3b-instruct:free',
          messages: params.messages,
          temperature: params.temperature || 0.7,
          max_tokens: params.max_tokens || 1000,
          stream: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        content: data.choices?.[0]?.message?.content || '',
        model_used: data.model,
        ...(data.usage && {
          usage: {
            prompt_tokens: data.usage.prompt_tokens,
            completion_tokens: data.usage.completion_tokens,
            total_tokens: data.usage.total_tokens,
          }
        }),
        finish_reason: data.choices?.[0]?.finish_reason,
        request_id: data.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Text generation failed',
        error_type: 'api_error',
      };
    }
  }

  async* streamText(params: TextGenerationRequest): AsyncGenerator<TextStreamEvent> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: params.model || 'meta-llama/llama-3.2-3b-instruct:free',
          messages: params.messages,
          temperature: params.temperature || 0.7,
          max_tokens: params.max_tokens || 1000,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let buffer = '';
      let accumulatedContent = '';
      let accumulatedReasoning = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              yield {
                type: 'done',
                ...(accumulatedReasoning && { reasoning: accumulatedReasoning }),
                model: params.model || 'meta-llama/llama-3.2-3b-instruct:free',
              };
              return;
            }

            try {
              const parsed = JSON.parse(data);

              // Handle different content types
              const delta = parsed.choices?.[0]?.delta;
              if (delta?.content) {
                accumulatedContent += delta.content;
                yield {
                  type: 'content',
                  content: delta.content,
                  accumulated: accumulatedContent,
                };
              }

              // Handle reasoning tokens if supported
              if (delta?.reasoning) {
                accumulatedReasoning += delta.reasoning;
                yield {
                  type: 'reasoning',
                  content: delta.reasoning,
                  accumulated: accumulatedReasoning,
                };
              }

              // Send usage info if available
              if (parsed.usage) {
                yield {
                  type: 'usage',
                  usage: {
                    prompt_tokens: parsed.usage.prompt_tokens,
                    completion_tokens: parsed.usage.completion_tokens,
                    total_tokens: parsed.usage.total_tokens,
                  },
                };
              }
            } catch (e) {
              console.warn('Failed to parse OpenRouter SSE data:', data);
            }
          }
        }
      }
    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Streaming failed',
      };
    }
  }

  // Code Generation Methods
  async generateCode(params: CodeGenerationRequest): Promise<CodeGenerationResponse> {
    try {
      // Use GLM-4.5-Air model for code generation
      const messages = [
        {
          role: 'system',
          content: `You are an expert programmer. Generate clean, efficient, and well-commented ${params.language || 'code'} code. Always provide the complete code solution without explanations unless asked.`,
        },
        {
          role: 'user',
          content: params.prompt,
        },
      ];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: params.model || 'zai-org/GLM-4.5-Air',
          messages,
          temperature: params.temperature || 0.3,
          max_tokens: params.max_tokens || 4000,
          stream: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `Code generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      const generatedCode = data.choices?.[0]?.message?.content || '';

      return {
        success: true,
        code: generatedCode,
        ...(params.language && { language: params.language }),
        model: data.model,
        tokens_used: data.usage?.total_tokens,
        generation_time: data.usage?.completion_time,
        request_id: data.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Code generation failed',
      };
    }
  }

  async* streamCode(params: CodeGenerationRequest): AsyncGenerator<CodeStreamEvent> {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are an expert programmer. Generate clean, efficient, and well-commented ${params.language || 'code'} code. Always provide the complete code solution without explanations unless asked.`,
        },
        {
          role: 'user',
          content: params.prompt,
        },
      ];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: params.model || 'zai-org/GLM-4.5-Air',
          messages,
          temperature: params.temperature || 0.3,
          max_tokens: params.max_tokens || 4000,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Code generation streaming failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let buffer = '';
      let accumulatedCode = '';

      yield {
        type: 'start',
        request_id: `code-${Date.now()}`,
      };

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              yield {
                type: 'done',
                content: accumulatedCode,
              };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;

              if (delta?.content) {
                accumulatedCode += delta.content;
                yield {
                  type: 'content',
                  content: delta.content,
                };
              }
            } catch (e) {
              console.warn('Failed to parse code SSE data:', data);
            }
          }
        }
      }
    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Code streaming failed',
      };
    }
  }

  // Model Information Methods
  async getTextModels(): Promise<TextModelsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();

      // Only keep the best Llama model from OpenRouter
      const bestModels = [
        'meta-llama/llama-3.3-70b-instruct:free', // Best Llama model
      ];

      // Filter and map to our format
      const textModels: TextModel[] = data.data
        .filter((model: any) => bestModels.includes(model.id))
        .map((model: any): TextModel => ({
          id: model.id,
          name: model.name || model.id,
          display_name: model.name || model.id.split('/').pop() || model.id,
          description: 'Large language model for text generation',
          provider: 'OpenRouter',
          context_length: model.context_length || 4096,
          supports_reasoning: model.id.includes('reasoning') || false,
        }));

      // Add Chutes AI models
      const chutesModels: TextModel[] = [
        {
          id: 'chutes:Alibaba-NLP/Tongyi-DeepResearch-30B-A3B',
          name: 'Tongyi DeepResearch 30B',
          display_name: 'Tongyi DeepResearch 30B',
          description: 'Advanced reasoning model with thinking capabilities',
          provider: 'Chutes AI',
          context_length: 8192,
          supports_reasoning: true,
        },
        {
          id: 'chutes:openai/gpt-oss-20b',
          name: 'GPT-OSS 20B',
          display_name: 'GPT-OSS 20B',
          description: 'Open source GPT model with reasoning support',
          provider: 'Chutes AI',
          context_length: 4096,
          supports_reasoning: true,
        },
        {
          id: 'chutes:unsloth/gemma-3-4b-it',
          name: 'Gemma 3 4B IT',
          display_name: 'Gemma 3 4B IT',
          description: 'Efficient instruction-tuned model',
          provider: 'Chutes AI',
          context_length: 8192,
          supports_reasoning: false,
        },
      ];

      // Combine both providers
      const allModels = [...textModels, ...chutesModels];

      return {
        success: true,
        models: allModels,
        count: allModels.length,
      };
    } catch (error) {
      return {
        success: false,
        models: [],
        count: 0,
      };
    }
  }

  async getCodeModels(): Promise<CodeModelsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch code models: ${response.statusText}`);
      }

      const data = await response.json();

      // Filter models good for code generation
      const codeModels: CodeModel[] = data.data
        .filter((model: any) =>
          model.id.includes('glm') ||
          model.id.includes('codex') ||
          model.id.includes('code') ||
          model.id.includes('deepseek-coder')
        )
        .map((model: any): CodeModel => ({
          id: model.id,
          name: model.name || model.id,
          display_name: model.name || model.id.split('/').pop() || model.id,
          description: model.description || 'Code generation model',
          provider: model.id.split('/')[0] || 'unknown',
          context_length: model.context_length || 4096,
          specialty: 'code',
          supports_reasoning: model.id.includes('reasoning') || false,
        }));

      // Always include GLM-4.5-Air as it's the primary code model
      if (!codeModels.find(m => m.id === 'zai-org/GLM-4.5-Air')) {
        codeModels.unshift({
          id: 'zai-org/GLM-4.5-Air',
          name: 'GLM-4.5-Air',
          display_name: 'GLM-4.5-Air (Free)',
          description: 'Zhipu AI\'s GLM-4.5-Air model optimized for code generation',
          provider: 'zai-org',
          context_length: 8192,
          specialty: 'code',
          supports_reasoning: false,
        });
      }

      return {
        success: true,
        models: codeModels,
        count: codeModels.length,
      };
    } catch (error) {
      return {
        success: false,
        models: [],
        count: 0,
      };
    }
  }
}

// Export singleton instance
export const openRouterService = new OpenRouterService();