// AI Provider Abstraction Layer
// This file provides a unified interface for all AI providers

import { ollamaAIService } from './ollama-service';
import { chutesService } from './chutes';
import { providerManager, ProviderType } from './providers';
import {
  TextGenerationRequest,
  TextGenerationResponse,
  TextStreamEvent,
  CodeGenerationRequest,
  CodeGenerationResponse,
  CodeStreamEvent,
  TextModelsResponse,
  CodeModelsResponse
} from '@/types/api';

export type AIProvider = 'ollama' | 'chutes' | 'openrouter';

class AIManager {
  private currentProvider: AIProvider = 'ollama';

  /**
   * Set the active AI provider
   */
  setProvider(provider: AIProvider): void {
    this.currentProvider = provider;
  }

  /**
   * Get the current provider
   */
  getProvider(): AIProvider {
    return this.currentProvider;
  }

  /**
   * Generate text using the current provider
   */
  async generateText(params: TextGenerationRequest): Promise<TextGenerationResponse> {
    if (this.currentProvider === 'ollama') {
      return ollamaAIService.generateText(params);
    }

    // Fallback to API route for other providers
    const baseUrl = '';
    const response = await fetch(`${baseUrl}/api/texts/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        provider: this.currentProvider,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `Text generation failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate text with streaming using the current provider
   */
  async* generateTextStream(params: TextGenerationRequest): AsyncGenerator<TextStreamEvent> {
    if (this.currentProvider === 'ollama') {
      yield* ollamaAIService.generateTextStream(params);
      return;
    }

    // Fallback to API route for other providers
    const baseUrl = '';
    const response = await fetch(`${baseUrl}/api/texts/generate-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        ...params,
        provider: this.currentProvider,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `Streaming failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            yield parsed;
          } catch (e) {
            console.warn('Failed to parse SSE data:', data);
          }
        }
      }
    }
  }

  /**
   * Generate code using the current provider
   */
  async generateCode(params: CodeGenerationRequest): Promise<CodeGenerationResponse> {
    if (this.currentProvider === 'ollama') {
      return ollamaAIService.generateCode(params);
    }

    // Fallback to API route
    const baseUrl = '';
    const response = await fetch(`${baseUrl}/api/codes/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        provider: this.currentProvider,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `Code generation failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate code with streaming using the current provider
   */
  async* generateCodeStream(params: CodeGenerationRequest): AsyncGenerator<CodeStreamEvent> {
    if (this.currentProvider === 'ollama') {
      yield* ollamaAIService.generateCodeStream(params);
      return;
    }

    // Fallback to API route
    const baseUrl = '';
    const response = await fetch(`${baseUrl}/api/codes/generate-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        ...params,
        provider: this.currentProvider,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `Code streaming failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            yield parsed;
          } catch (e) {
            console.warn('Failed to parse SSE data:', data);
          }
        }
      }
    }
  }

  /**
   * Get available models from current provider
   */
  async getTextModels(): Promise<TextModelsResponse> {
    if (this.currentProvider === 'ollama') {
      const models = await ollamaAIService.getModels('text');
      return {
        success: true,
        provider: 'ollama',
        models: models.map(m => ({
          id: m.id,
          name: m.displayName,
          displayName: m.displayName,
          description: m.description || 'Large language model for text generation',
          provider: 'Ollama',
          context_length: m.contextWindow || 4096,
          supports_reasoning: m.capabilities?.thinking || false,
        })),
        count: models.length,
      };
    }

    // Fallback to API route
    const baseUrl = '';
    const response = await fetch(`${baseUrl}/api/texts/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `Failed to get models: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get available code models
   */
  async getCodeModels(): Promise<CodeModelsResponse> {
    if (this.currentProvider === 'ollama') {
      const models = await ollamaAIService.getModels('code');
      return {
        success: true,
        provider: 'ollama',
        models: models.map(m => ({
          id: m.id,
          name: m.displayName,
          displayName: m.displayName,
          display_name: m.displayName,
          description: m.description || 'Code generation model',
          provider: 'Ollama',
          context_length: m.contextWindow || 4096,
          specialty: 'code_generation',
          supports_reasoning: m.capabilities?.thinking || false,
        })),
        count: models.length,
      };
    }

    // Fallback to API route
    const baseUrl = '';
    const response = await fetch(`${baseUrl}/api/codes/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `Failed to get code models: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Test the current provider
   */
  async test(): Promise<boolean> {
    if (this.currentProvider === 'ollama') {
      return ollamaAIService.test();
    }

    // Generic test for other providers
    try {
      await this.generateText({
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get provider status and info
   */
  async getStatus(): Promise<{
    provider: AIProvider;
    status: 'connected' | 'error';
    message: string;
    models?: number;
  }> {
    if (this.currentProvider === 'ollama') {
      const status = await providerManager.get('ollama');
      const ollamaStatus = await (status as any).getStatus?.();
      return {
        provider: this.currentProvider,
        status: ollamaStatus?.status || 'error',
        message: ollamaStatus?.message || 'Unknown',
        models: ollamaStatus?.models,
      };
    }

    return {
      provider: this.currentProvider,
      status: 'connected',
      message: `Using ${this.currentProvider} provider`,
    };
  }
}

// Create and export singleton instance
export const aiManager = new AIManager();

// Initialize from environment
const defaultProvider = (process.env.AI_DEFAULT_PROVIDER as AIProvider) || 'ollama';
aiManager.setProvider(defaultProvider);

// Export convenience functions
export const generateText = (params: TextGenerationRequest) => aiManager.generateText(params);
export const generateTextStream = (params: TextGenerationRequest) => aiManager.generateTextStream(params);
export const generateCode = (params: CodeGenerationRequest) => aiManager.generateCode(params);
export const generateCodeStream = (params: CodeGenerationRequest) => aiManager.generateCodeStream(params);
export const getTextModels = () => aiManager.getTextModels();
export const getCodeModels = () => aiManager.getCodeModels();
export const setAIProvider = (provider: AIProvider) => aiManager.setProvider(provider);
export const getAIProvider = () => aiManager.getProvider();
export const testAIProvider = () => aiManager.test();
export const getAIStatus = () => aiManager.getStatus();

// AIProvider type is already exported above

// Re-export services for direct access if needed
export { ollamaAIService, chutesService, providerManager };