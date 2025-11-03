import {
  BaseAIProvider,
  BaseChatRequest,
  BaseChatResponse,
  BaseStreamEvent,
  BaseEmbeddingRequest,
  BaseEmbeddingResponse,
  BaseChatMessage,
  ModelInfo,
} from './base-provider';
import { ollamaCloud, ChatRequest, Message, Tool, StreamEvent } from '@/lib/ai/ollama-cloud';

export class OllamaProvider extends BaseAIProvider {
  name = 'Ollama Cloud';
  type = 'ollama' as const;

  private initialized = false;

  async initialize(config: { apiKey?: string; baseUrl?: string }): Promise<void> {
    if (!config.apiKey) {
      config.apiKey = process.env.OLLAMA_API_KEY;
    }
    if (!config.baseUrl) {
      config.baseUrl = process.env.OLLAMA_BASE_URL;
    }

    // Update the Ollama Cloud client configuration
    ollamaCloud.client.updateConfig(config);

    this.initialized = true;
  }

  async test(): Promise<boolean> {
    try {
      return await ollamaCloud.test();
    } catch {
      return false;
    }
  }

  async getModels(): Promise<ModelInfo[]> {
    const models = await ollamaCloud.models.getTextModels();

    return models.map(model => {
      const capabilities = ollamaCloud.models.getModelCapabilitiesDetailed(model.model);
      return {
        id: model.model,
        name: model.name,
        displayName: ollamaCloud.models.formatModelName(model.model),
        description: capabilities.description,
        capabilities: {
          text: true,
          vision: capabilities.supportsVision,
          tools: capabilities.supportsTools,
          thinking: capabilities.supportsThinking,
          embeddings: model.model.includes('embedding'),
        },
        contextWindow: capabilities.contextWindow,
        pricing: {
          input: 0, // Ollama Cloud is currently free
          output: 0,
        },
      };
    });
  }

  async createChat(request: BaseChatRequest): Promise<BaseChatResponse> {
    if (!this.initialized) {
      await this.initialize({});
    }

    const ollamaRequest = this.convertToOllamaRequest(request);
    const response = await ollamaCloud.chat.createChat(ollamaRequest);

    return this.convertFromOllamaResponse(response);
  }

  async* streamChat(request: BaseChatRequest): AsyncGenerator<BaseStreamEvent, void, unknown> {
    if (!this.initialized) {
      await this.initialize({});
    }

    const ollamaRequest = this.convertToOllamaRequest(request);

    for await (const event of ollamaCloud.chat.streamChat(ollamaRequest)) {
      yield this.convertStreamEvent(event);
    }
  }

  async createEmbeddings(request: BaseEmbeddingRequest): Promise<BaseEmbeddingResponse> {
    if (!this.initialized) {
      await this.initialize({});
    }

    const response = await ollamaCloud.embeddings.createEmbedding({
      model: request.model,
      input: request.input,
    });

    return {
      embeddings: response.embeddings,
      model: response.model,
      usage: {
        prompt_tokens: response.prompt_eval_count || 0,
        total_tokens: (response.prompt_eval_count || 0) + (response.eval_count || 0),
      },
    };
  }

  private convertToOllamaRequest(request: BaseChatRequest): ChatRequest {
    return {
      model: request.model,
      messages: this.convertMessages(request.messages),
      temperature: request.temperature,
      options: {
        temperature: request.temperature,
        num_predict: request.max_tokens,
        top_p: request.top_p,
      },
      tools: request.tools as Tool[],
      stream: request.stream,
      think: request.think,
      format: request.format,
    };
  }

  protected convertMessages(messages: BaseChatMessage[]): Message[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      images: msg.images,
      tool_calls: msg.tool_calls,
    }));
  }

  private convertFromOllamaResponse(response: any): BaseChatResponse {
    return {
      content: response.message?.content || '',
      model: response.model,
      usage: {
        prompt_tokens: response.prompt_eval_count || 0,
        completion_tokens: response.eval_count || 0,
        total_tokens: (response.prompt_eval_count || 0) + (response.eval_count || 0),
      },
      finish_reason: response.done ? 'stop' : 'length',
      thinking: response.message?.thinking,
      tool_calls: response.message?.tool_calls,
    };
  }

  private convertStreamEvent(event: StreamEvent): BaseStreamEvent {
    switch (event.type) {
      case 'start':
        return {
          type: 'start',
        };

      case 'content':
        return {
          type: 'content',
          content: event.content,
          accumulated: event.content,
        };

      case 'thinking':
        return {
          type: 'thinking',
          thinking: event.thinking,
        };

      case 'tool_call':
        return {
          type: 'tool_call',
          tool_calls: event.tool_calls,
        };

      case 'complete':
        return {
          type: 'done',
          content: event.content || '',
          accumulated: event.content,
          usage: event.metrics ? {
            prompt_tokens: event.metrics.prompt_eval_count,
            completion_tokens: event.metrics.eval_count,
            total_tokens: event.metrics.prompt_eval_count + event.metrics.eval_count,
          } : undefined,
        };

      case 'error':
        return {
          type: 'error',
          error: event.error,
        };

      default:
        return {
          type: 'error',
          error: `Unknown event type: ${(event as any).type}`,
        };
    }
  }

  getCapabilities() {
    return {
      streaming: true,
      tools: true,
      vision: true,
      thinking: true,
      embeddings: true,
      structuredOutputs: true,
    };
  }
}