// Base interface for all AI providers
export interface BaseChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  images?: string[];
  tool_calls?: Array<{
    function: {
      name: string;
      arguments: Record<string, any>;
    };
  }>;
}

export interface BaseChatRequest {
  model: string;
  messages: BaseChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: Record<string, any>;
    };
  }>;
  [key: string]: any;
}

export interface BaseChatResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason?: string;
  thinking?: string;
  tool_calls?: Array<{
    function: {
      name: string;
      arguments: Record<string, any>;
    };
  }>;
}

export interface BaseStreamEvent {
  type: 'start' | 'content' | 'thinking' | 'tool_call' | 'done' | 'error';
  content?: string;
  thinking?: string;
  tool_calls?: any[];
  accumulated?: string;
  usage?: any;
  error?: string;
}

export interface BaseEmbeddingRequest {
  input: string | string[];
  model: string;
}

export interface BaseEmbeddingResponse {
  embeddings: number[][];
  model: string;
  usage?: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  capabilities: {
    text: boolean;
    vision: boolean;
    tools: boolean;
    thinking: boolean;
    embeddings: boolean;
  };
  contextWindow?: number;
  pricing?: {
    input?: number;
    output?: number;
  };
}

export abstract class BaseAIProvider {
  abstract name: string;
  abstract type: 'openai' | 'ollama' | 'custom';

  /**
   * Initialize the provider with configuration
   */
  abstract initialize(config: any): Promise<void>;

  /**
   * Test if the provider is working
   */
  abstract test(): Promise<boolean>;

  /**
   * Get available models
   */
  abstract getModels(): Promise<ModelInfo[]>;

  /**
   * Create a chat completion
   */
  abstract createChat(request: BaseChatRequest): Promise<BaseChatResponse>;

  /**
   * Create a streaming chat completion
   */
  abstract streamChat(request: BaseChatRequest): AsyncIterable<BaseStreamEvent>;

  /**
   * Create embeddings
   */
  abstract createEmbeddings(request: BaseEmbeddingRequest): Promise<BaseEmbeddingResponse>;

  /**
   * Get provider capabilities
   */
  getCapabilities() {
    return {
      streaming: true,
      tools: true,
      vision: false,
      thinking: false,
      embeddings: false,
      structuredOutputs: false,
    };
  }

  /**
   * Convert messages to provider format
   */
  protected abstract convertMessages(messages: BaseChatMessage[]): any;

  /**
   * Convert response from provider format
   */
  protected abstract convertResponse(response: any): BaseChatResponse;

  /**
   * Handle errors
   */
  protected handleError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(error?.message || 'Unknown error occurred');
  }

  /**
   * Calculate cost based on usage
   */
  calculateCost(usage: { prompt_tokens: number; completion_tokens: number }, model: ModelInfo): number {
    if (!model.pricing) return 0;

    const inputCost = (usage.prompt_tokens / 1000) * (model.pricing.input || 0);
    const outputCost = (usage.completion_tokens / 1000) * (model.pricing.output || 0);

    return inputCost + outputCost;
  }
}