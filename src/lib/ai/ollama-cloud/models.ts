import { Model, ModelsResponse, ModelCapabilities } from './types';
import { ollamaClient } from './client';

export class ModelsService {
  /**
   * Get all available models
   */
  async getModels(type?: 'text' | 'image'): Promise<ModelsResponse> {
    const params = type ? { type } : {};
    const response = await ollamaClient.get<ModelsResponse>('/api/tags', params);
    return response;
  }

  /**
   * Get text models only
   */
  async getTextModels(): Promise<Model[]> {
    const response = await this.getModels('text');
    return response.models;
  }

  /**
   * Get image models only
   */
  async getImageModels(): Promise<Model[]> {
    const response = await this.getModels('image');
    return response.models;
  }

  /**
   * Get model details
   */
  async getModelDetails(modelName: string): Promise<Model | null> {
    try {
      const response = await ollamaClient.get<{ model: Model }>(`/api/show`, { name: modelName });
      return response.model;
    } catch (error) {
      console.error(`Failed to get model details for ${modelName}:`, error);
      return null;
    }
  }

  /**
   * Pull a model (download it)
   */
  async pullModel(modelName: string, stream: boolean = false): Promise<any> {
    if (stream) {
      const response = await ollamaClient.stream('/api/pull', { name: modelName });
      return ollamaClient.parseNdjsonStream(response);
    } else {
      return ollamaClient.post('/api/pull', { name: modelName });
    }
  }

  /**
   * Delete a model
   */
  async deleteModel(modelName: string): Promise<{ status: string }> {
    return ollamaClient.delete(`/api/delete/${modelName}`);
  }

  /**
   * Check if model exists
   */
  async modelExists(modelName: string): Promise<boolean> {
    try {
      const models = await this.getModels();
      return models.models.some(m => m.model === modelName);
    } catch {
      return false;
    }
  }

  /**
   * Get recommended models for different use cases
   */
  getRecommendedModels() {
    return {
      text: {
        fast: {
          model: 'gpt-oss:20b',
          description: 'Fast responses for general tasks',
          contextWindow: 32768,
          supportsThinking: true,
        },
        balanced: {
          model: 'deepseek-v3.1:671b',
          description: 'Good balance of speed and capability',
          contextWindow: 32768,
          supportsThinking: true,
        },
        powerful: {
          model: 'kimi-k2:1t',
          description: 'Most capable model for complex tasks',
          contextWindow: 32768,
          supportsThinking: false,
        },
        coding: {
          model: 'qwen3-coder:480b',
          description: 'Specialized for code generation',
          contextWindow: 262144,
          supportsThinking: false,
        },
      },
      vision: {
        default: {
          model: 'qwen3-vl:235b',
          description: 'General purpose vision model',
          contextWindow: 131072,
        },
        instruct: {
          model: 'qwen3-vl:235b-instruct',
          description: 'Instruction-tuned vision model',
          contextWindow: 131072,
        },
      },
      embeddings: {
        fast: {
          model: 'all-minilm',
          description: 'Fast multilingual embeddings',
          dimensions: 384,
        },
        balanced: {
          model: 'embeddinggemma',
          description: 'Balanced performance',
          dimensions: 384,
        },
        quality: {
          model: 'qwen3-embedding',
          description: 'Highest quality embeddings',
          dimensions: 1024,
        },
      },
    };
  }

  /**
   * Select best model based on requirements
   */
  selectBestModel(requirements: {
    task: 'text' | 'vision' | 'embeddings';
    speed?: 'fast' | 'balanced' | 'quality';
    features?: {
      thinking?: boolean;
      tools?: boolean;
      structuredOutputs?: boolean;
      multilingual?: boolean;
    };
    contextWindow?: number;
    maxModelSize?: number; // in GB
  }): string {
    const recommended = this.getRecommendedModels();

    let modelOptions: any[] = [];

    // Get models based on task
    if (requirements.task === 'text') {
      modelOptions = Object.values(recommended.text);
    } else if (requirements.task === 'vision') {
      modelOptions = Object.values(recommended.vision);
    } else if (requirements.task === 'embeddings') {
      modelOptions = Object.values(recommended.embeddings);
    }

    // Filter by speed preference
    if (requirements.speed) {
      if (requirements.speed === 'fast') {
        modelOptions = modelOptions.filter(m =>
          m.model.includes('20b') ||
          m.model.includes('minilm') ||
          m.model.includes('3b')
        );
      } else if (requirements.speed === 'quality') {
        modelOptions = modelOptions.filter(m =>
          m.model.includes('1t') ||
          m.model.includes('671b') ||
          m.model.includes('1024')
        );
      }
    }

    // Filter by features
    if (requirements.features) {
      if (requirements.features.thinking) {
        modelOptions = modelOptions.filter(m => m.supportsThinking);
      }
    }

    // Filter by context window
    if (requirements.contextWindow) {
      modelOptions = modelOptions.filter(m =>
        (m.contextWindow || 0) >= requirements.contextWindow!
      );
    }

    // Return first match or fallback
    if (modelOptions.length > 0) {
      return modelOptions[0].model;
    }

    // Fallback to default
    const defaults = {
      text: 'gpt-oss:20b',
      vision: 'qwen3-vl:235b',
      embeddings: 'qwen3-embedding',
    };

    return defaults[requirements.task] || 'gpt-oss:20b';
  }

  /**
   * Get model size in GB from bytes
   */
  getModelSizeInGB(sizeInBytes: number): string {
    const sizeInGB = sizeInBytes / (1024 * 1024 * 1024);
    if (sizeInGB < 1) {
      return `${Math.round(sizeInGB * 1024)}MB`;
    }
    return `${sizeInGB.toFixed(1)}GB`;
  }

  /**
   * Format model name for display
   */
  formatModelName(model: string): string {
    const nameMap: Record<string, string> = {
      'gpt-oss:20b': 'GPT-OSS 20B',
      'gpt-oss:120b': 'GPT-OSS 120B',
      'deepseek-v3.1:671b': 'DeepSeek v3.1 671B',
      'qwen3-coder:480b': 'Qwen 3 Coder 480B',
      'qwen3-vl:235b': 'Qwen 3 Vision 235B',
      'qwen3-vl:235b-instruct': 'Qwen 3 Vision 235B (Instruct)',
      'kimi-k2:1t': 'Kimi K2 1T',
      'glm-4.6': 'GLM 4.6',
      'minimax-m2': 'MiniMax M2',
      'llama-3.2-3b': 'Llama 3.2 3B',
      'llama-3.3-70b': 'Llama 3.3 70B',
      'embeddinggemma': 'Embedding Gemma',
      'qwen3-embedding': 'Qwen 3 Embedding',
      'all-minilm': 'All-MiniLM',
    };

    return nameMap[model] || model;
  }

  /**
   * Get model capabilities with descriptions
   */
  getModelCapabilitiesDetailed(model: string): ModelCapabilities & { description: string } {
    const capabilities: Record<string, ModelCapabilities & { description: string }> = {
      'deepseek-v3.1:671b': {
        supportsThinking: true,
        supportsVision: false,
        supportsTools: true,
        supportsStructuredOutputs: true,
        supportsEmbeddings: false,
        contextWindow: 32768,
        description: 'Large model with reasoning capabilities',
      },
      'qwen3-coder:480b': {
        supportsThinking: false,
        supportsVision: false,
        supportsTools: true,
        supportsStructuredOutputs: true,
        supportsEmbeddings: false,
        contextWindow: 262144,
        description: 'Specialized for code generation and analysis',
      },
      'qwen3-vl:235b': {
        supportsThinking: false,
        supportsVision: true,
        supportsTools: true,
        supportsStructuredOutputs: true,
        supportsEmbeddings: false,
        contextWindow: 131072,
        description: 'Vision-language model for image understanding',
      },
      'gpt-oss:20b': {
        supportsThinking: true,
        supportsVision: false,
        supportsTools: true,
        supportsStructuredOutputs: true,
        supportsEmbeddings: false,
        contextWindow: 32768,
        description: 'Fast and efficient for general tasks',
      },
      'gpt-oss:120b': {
        supportsThinking: true,
        supportsVision: false,
        supportsTools: true,
        supportsStructuredOutputs: true,
        supportsEmbeddings: false,
        contextWindow: 32768,
        description: 'More capable for complex tasks',
      },
    };

    return capabilities[model] || {
      supportsThinking: false,
      supportsVision: false,
      supportsTools: false,
      supportsStructuredOutputs: false,
      supportsEmbeddings: false,
      contextWindow: 4096,
      description: 'Unknown model',
    };
  }
}

// Export singleton instance
export const modelsService = new ModelsService();