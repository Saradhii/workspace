import {
  TextGenerationRequest,
  TextGenerationResponse,
  TextStreamEvent,
  CodeGenerationRequest,
  CodeGenerationResponse,
  CodeStreamEvent
} from '@/types/api';
import { providerManager, ProviderType } from './providers';
import type { BaseChatMessage } from './providers/base-provider';

// Initialize providers from environment
async function initializeProviders() {
  // Configure Ollama if API key is available
  if (process.env.OLLAMA_API_KEY) {
    const config: any = {
      type: 'ollama',
      apiKey: process.env.OLLAMA_API_KEY,
    };

    if (process.env.OLLAMA_BASE_URL) {
      config.baseUrl = process.env.OLLAMA_BASE_URL;
    }

    if (process.env.OLLAMA_DEFAULT_MODEL) {
      config.defaultModel = process.env.OLLAMA_DEFAULT_MODEL;
    }

    providerManager.configure('ollama', config);
  }

  // Set default provider
  const defaultProvider = (process.env.AI_DEFAULT_PROVIDER as ProviderType) || 'ollama';
  providerManager.setDefault(defaultProvider);
}

// Initialize on module load
initializeProviders().catch(console.error);

export class OllamaAIService {
  /**
   * Generate text using the configured provider
   */
  async generateText(params: TextGenerationRequest): Promise<TextGenerationResponse> {
    try {
      const provider = await providerManager.get();

      // Transform request to match provider format
      const defaultMessages: BaseChatMessage[] = [{ role: 'user', content: '' }];
      const request = {
        model: params.model || 'gpt-oss:20b',
        messages: (params.messages as BaseChatMessage[]) || defaultMessages,
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 1024,
        stream: false,
      };

      const response = await provider.createChat(request);

      return {
        success: true,
        content: response.content,
        model_used: response.model,
        usage: response.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
        finish_reason: response.finish_reason || 'stop',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Text generation failed',
        content: '',
        model_used: params.model || 'gpt-oss:20b',
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
        finish_reason: 'error',
      };
    }
  }

  /**
   * Generate text with streaming
   */
  async* generateTextStream(params: TextGenerationRequest): AsyncGenerator<TextStreamEvent> {
    try {
      const provider = await providerManager.get();

      const defaultMessages: BaseChatMessage[] = [{ role: 'user', content: '' }];
      const request = {
        model: params.model || 'gpt-oss:20b',
        messages: (params.messages as BaseChatMessage[]) || defaultMessages,
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 1024,
        stream: true,
      };

      let accumulatedContent = '';
      let accumulatedReasoning = '';

      for await (const event of provider.streamChat(request)) {
        switch (event.type) {
          case 'content':
            accumulatedContent += event.content || '';
            yield {
              type: 'content',
              content: event.content || '',
              accumulated: accumulatedContent,
              model: request.model,
            };
            break;

          case 'thinking':
            accumulatedReasoning += event.thinking || '';
            yield {
              type: 'reasoning',
              content: event.thinking || '',
              accumulated: accumulatedReasoning,
              model: request.model,
            };
            break;

          case 'done':
            yield {
              type: 'done',
              content: accumulatedContent,
              accumulated: accumulatedContent,
              usage: event.usage,
              model: request.model,
              ...(accumulatedReasoning && { reasoning: accumulatedReasoning }),
            };
            return;

          case 'error':
            yield {
              type: 'error',
              error: event.error || 'Streaming error',
              model: request.model,
            };
            return;
        }
      }
    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Stream failed',
        model: params.model || 'gpt-oss:20b',
      };
    }
  }

  /**
   * Generate code using the configured provider
   */
  async generateCode(params: CodeGenerationRequest): Promise<CodeGenerationResponse> {
    try {
      const provider = await providerManager.get();

      // Use a coding-focused model if available
      const model = params.model || 'qwen3-coder:480b';

      const messages: BaseChatMessage[] = [
          {
            role: 'system',
            content: 'You are an expert programmer. Generate clean, well-commented code.'
          },
          {
            role: 'user',
            content: params.prompt || ''
          }
        ];

      const request = {
        model,
        messages,
        temperature: params.temperature || 0.3,
        max_tokens: params.max_tokens || 2048,
        stream: false,
      };

      const response = await provider.createChat(request);

      return {
        success: true,
        code: response.content,
        language: params.language || 'javascript',
        model: response.model,
        tokens_used: response.usage?.total_tokens || 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Code generation failed',
        code: '',
        language: params.language || 'javascript',
        model: params.model || 'qwen3-coder:480b',
      };
    }
  }

  /**
   * Generate code with streaming
   */
  async* generateCodeStream(params: CodeGenerationRequest): AsyncGenerator<CodeStreamEvent> {
    try {
      const provider = await providerManager.get();

      const model = params.model || 'qwen3-coder:480b';

      const messages: BaseChatMessage[] = [
          {
            role: 'system',
            content: 'You are an expert programmer. Generate clean, well-commented code.'
          },
          {
            role: 'user',
            content: params.prompt || ''
          }
        ];

      const request = {
        model,
        messages,
        temperature: params.temperature || 0.3,
        max_tokens: params.max_tokens || 2048,
        stream: true,
      };

      let accumulatedContent = '';

      for await (const event of provider.streamChat(request)) {
        switch (event.type) {
          case 'start':
            yield {
              type: 'start',
            };
            break;

          case 'content':
            accumulatedContent += event.content || '';
            yield {
              type: 'content',
              content: event.content || '',
            };
            break;

          case 'done':
            yield {
              type: 'done',
              content: accumulatedContent,
            };
            return;

          case 'error':
            yield {
              type: 'error',
              error: event.error || 'Code streaming error',
            };
            return;
        }
      }
    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Code stream failed',
      };
    }
  }

  /**
   * Get available models from the provider
   */
  async getModels(type: 'text' | 'code' = 'text') {
    try {
      const provider = await providerManager.get();
      const models = await provider.getModels();

      // Filter models based on type
      if (type === 'code') {
        return models.filter(m =>
          m.displayName.toLowerCase().includes('coder') ||
          m.name.toLowerCase().includes('code') ||
          m.capabilities.tools
        );
      }

      return models;
    } catch (error) {
      console.error('Failed to get models:', error);
      return [];
    }
  }

  /**
   * Test the provider connection
   */
  async test(): Promise<boolean> {
    try {
      const provider = await providerManager.get();
      return await provider.test();
    } catch {
      return false;
    }
  }

  /**
   * Switch provider
   */
  async switchProvider(type: ProviderType, config?: any): Promise<void> {
    if (config) {
      providerManager.configure(type, { ...config, type });
    }
    providerManager.setDefault(type);
  }
}

// Export singleton instance
export const ollamaAIService = new OllamaAIService();