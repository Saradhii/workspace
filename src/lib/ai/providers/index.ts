import { BaseAIProvider, ModelInfo } from './base-provider';
import { OllamaProvider } from './ollama-provider';
import { HuggingFaceProvider } from './huggingface-provider';

// Provider registry
export type ProviderType = 'ollama' | 'openrouter' | 'chutes' | 'huggingface';

export interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class ProviderRegistry {
  private providers = new Map<ProviderType, () => BaseAIProvider>();
  private instances = new Map<ProviderType, BaseAIProvider>();

  constructor() {
    // Register built-in providers
    this.register('ollama', () => new OllamaProvider());
    this.register('huggingface', () => new HuggingFaceProvider());
    // Add other providers as needed
    // this.register('openrouter', () => new OpenRouterProvider());
    // this.register('chutes', () => new ChutesProvider());
  }

  /**
   * Register a new provider
   */
  register(type: ProviderType, factory: () => BaseAIProvider): void {
    this.providers.set(type, factory);
  }

  /**
   * Get or create a provider instance
   */
  async get(type: ProviderType, config?: ProviderConfig): Promise<BaseAIProvider> {
    // Check if we already have an initialized instance
    if (this.instances.has(type)) {
      const instance = this.instances.get(type)!;
      if (config) {
        await instance.initialize(config);
      }
      return instance;
    }

    // Create new instance
    const factory = this.providers.get(type);
    if (!factory) {
      throw new Error(`Provider type '${type}' is not registered`);
    }

    const provider = factory();
    if (config) {
      await provider.initialize(config);
    }

    this.instances.set(type, provider);
    return provider;
  }

  /**
   * Get all registered provider types
   */
  getAvailableProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Clear all instances (useful for testing)
   */
  clear(): void {
    this.instances.clear();
  }
}

export const providerRegistry = new ProviderRegistry();

/**
 * Provider manager for handling multiple providers
 */
export class ProviderManager {
  private defaultProvider: ProviderType = 'ollama';
  private configs = new Map<ProviderType, ProviderConfig>();

  /**
   * Set default provider
   */
  setDefault(type: ProviderType): void {
    this.defaultProvider = type;
  }

  /**
   * Configure a provider
   */
  configure(type: ProviderType, config: ProviderConfig): void {
    this.configs.set(type, { ...config, type });
  }

  /**
   * Get configured provider
   */
  async get(type?: ProviderType): Promise<BaseAIProvider> {
    const providerType = type || this.defaultProvider;
    const config = this.configs.get(providerType);

    if (!config) {
      // Try to get provider without config (might use env vars)
      return providerRegistry.get(providerType);
    }

    return providerRegistry.get(providerType, config);
  }

  /**
   * Get the default provider
   */
  async getDefault(): Promise<BaseAIProvider> {
    return this.get(this.defaultProvider);
  }

  /**
   * List all available models from all configured providers
   */
  async listAllModels(): Promise<Array<{ provider: ProviderType; models: ModelInfo[] }>> {
    const result: Array<{ provider: ProviderType; models: ModelInfo[] }> = [];

    for (const [type] of this.configs) {
      try {
        const provider = await providerRegistry.get(type);
        const models = await provider.getModels();
        result.push({ provider: type, models });
      } catch (error) {
        console.error(`Failed to get models for provider ${type}:`, error);
      }
    }

    return result;
  }

  /**
   * Find the best model for a given task across all providers
   */
  async findBestModel(requirements: {
    task?: 'text' | 'vision' | 'embeddings';
    capabilities?: string[];
    maxCost?: number;
  }): Promise<{ provider: ProviderType; model: ModelInfo } | null> {
    const allModels = await this.listAllModels();

    for (const { provider, models } of allModels) {
      // Filter models based on requirements
      let filtered = models;

      if (requirements.task) {
        filtered = filtered.filter(m => {
          if (requirements.task === 'text') return true;
          if (requirements.task === 'vision') return m.capabilities.vision;
          if (requirements.task === 'embeddings') return m.capabilities.embeddings;
          return false;
        });
      }

      if (requirements.capabilities) {
        filtered = filtered.filter(m =>
          requirements.capabilities!.every(cap => {
            switch (cap) {
              case 'thinking': return m.capabilities.thinking;
              case 'tools': return m.capabilities.tools;
              case 'vision': return m.capabilities.vision;
              case 'embeddings': return m.capabilities.embeddings;
              default: return true;
            }
          })
        );
      }

      if (requirements.maxCost) {
        filtered = filtered.filter(m =>
          !m.pricing ||
          ((m.pricing.input || 0) + (m.pricing.output || 0)) <= requirements.maxCost!
        );
      }

      if (filtered.length > 0) {
        // Return the first matching model
        const model = filtered[0];
        if (model) {
          return { provider, model };
        }
      }
    }

    return null;
  }
}

// Create singleton instance
export const providerManager = new ProviderManager();

// Export types
export type { ModelInfo, BaseChatRequest, BaseChatResponse, BaseStreamEvent, BaseEmbeddingRequest, BaseEmbeddingResponse } from './base-provider';
export { BaseAIProvider } from './base-provider';
export { OllamaProvider } from './ollama-provider';
export { HuggingFaceProvider } from './huggingface-provider';
export type { HuggingFaceConfig } from './huggingface-provider';
export type { OCRGenerationRequest, OCRGenerationResponse } from '@/types/api';

// Convenience functions
export async function getProvider(type?: ProviderType): Promise<BaseAIProvider> {
  return providerManager.get(type);
}

export async function getDefaultProvider(): Promise<BaseAIProvider> {
  return providerManager.getDefault();
}

export function configureProvider(type: ProviderType, config: ProviderConfig): void {
  providerManager.configure(type, config);
}

export function setDefaultProvider(type: ProviderType): void {
  providerManager.setDefault(type);
}