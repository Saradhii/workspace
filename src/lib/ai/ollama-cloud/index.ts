// Export all types
export * from './types';

// Export services
export { ollamaClient } from './client';
export { chatService, ChatService } from './chat';
export { embeddingsService, EmbeddingsService } from './embeddings';
export { modelsService, ModelsService } from './models';

// Export main service class that combines all
import { ChatService } from './chat';
import { EmbeddingsService } from './embeddings';
import { ModelsService } from './models';
import { ollamaClient, OllamaClient } from './client';
import { OllamaConfig } from './types';

export class OllamaCloudService {
  public readonly client: OllamaClient;
  public readonly chat: ChatService;
  public readonly embeddings: EmbeddingsService;
  public readonly models: ModelsService;

  constructor(config?: Partial<OllamaConfig>) {
    this.client = new OllamaClient(config);
    this.chat = new ChatService();
    this.embeddings = new EmbeddingsService();
    this.models = new ModelsService();
  }

  /**
   * Initialize the service with configuration
   */
  static create(config?: Partial<OllamaConfig>): OllamaCloudService {
    return new OllamaCloudService(config);
  }

  /**
   * Get service status
   */
  async getStatus(): Promise<{
    status: 'connected' | 'error';
    message: string;
    models?: number;
  }> {
    try {
      const response = await this.client.get('/api/tags');
      const models = (response as any).models?.length || 0;
      return {
        status: 'connected',
        message: `Connected to Ollama Cloud with ${models} models available`,
        models,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to connect',
      };
    }
  }

  /**
   * Test the service with a simple chat request
   */
  async test(model?: string): Promise<boolean> {
    try {
      const response = await this.chat.createChat({
        model: model || 'gpt-oss:20b',
        messages: [{ role: 'user', content: 'Say "test successful"' }],
      });
      return response.message.content.includes('test successful');
    } catch {
      return false;
    }
  }
}

// Export default service instance
export const ollamaCloud = OllamaCloudService.create();