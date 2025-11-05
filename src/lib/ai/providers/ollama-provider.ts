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
import { ollamaCloud, ChatRequest, ChatResponse, Message, Tool, StreamEvent } from '@/lib/ai/ollama-cloud';

export class OllamaProvider extends BaseAIProvider {
  name = 'Ollama Cloud';
  type = 'ollama' as const;

  private initialized = false;

  async initialize(config: { apiKey?: string; baseUrl?: string }): Promise<void> {
    const ollamaConfig: { apiKey?: string; baseUrl?: string } = {};

    if (config.apiKey || process.env.OLLAMA_API_KEY) {
      ollamaConfig.apiKey = config.apiKey || process.env.OLLAMA_API_KEY || '';
    }

    if (config.baseUrl) {
      ollamaConfig.baseUrl = config.baseUrl;
    } else if (process.env.OLLAMA_BASE_URL) {
      ollamaConfig.baseUrl = process.env.OLLAMA_BASE_URL;
    }

    // Update the Ollama Cloud client configuration
    ollamaCloud.client.updateConfig(ollamaConfig);

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
        ...(capabilities.description && { description: capabilities.description }),
        capabilities: {
          text: true,
          vision: capabilities.supportsVision || false,
          tools: capabilities.supportsTools || false,
          thinking: capabilities.supportsThinking || false,
          embeddings: model.model.includes('embedding'),
        },
        ...(capabilities.contextWindow && { contextWindow: capabilities.contextWindow }),
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

    return this.convertResponse(response);
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
        ...(request.temperature !== undefined && { temperature: request.temperature }),
        ...(request.max_tokens !== undefined && { num_predict: request.max_tokens }),
        ...(request.top_p !== undefined && { top_p: request.top_p }),
      },
      tools: request.tools as Tool[],
      stream: request.stream,
      think: request.think,
      format: request.format,
    };
  }

  protected convertMessages(messages: BaseChatMessage[]): Message[] {
    return messages.map(msg => {
      const message: Message = {
        role: msg.role,
        content: msg.content,
      };

      if (msg.images && msg.images.length > 0) {
        message.images = msg.images;
      }

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        message.tool_calls = msg.tool_calls;
      }

      return message;
    });
  }

  protected convertResponse(response: ChatResponse): BaseChatResponse {
    const result: BaseChatResponse = {
      content: response.message?.content || '',
      model: response.model,
      usage: {
        prompt_tokens: response.prompt_eval_count || 0,
        completion_tokens: response.eval_count || 0,
        total_tokens: (response.prompt_eval_count || 0) + (response.eval_count || 0),
      },
      finish_reason: response.done ? 'stop' : 'length',
    };

    if (response.message?.thinking !== undefined) {
      result.thinking = response.message.thinking;
    }

    if (response.message?.tool_calls && response.message.tool_calls.length > 0) {
      result.tool_calls = response.message.tool_calls;
    }

    return result;
  }

  private convertStreamEvent(event: StreamEvent): BaseStreamEvent {
    switch (event.type) {
      case 'start':
        return {
          type: 'start',
        };

      case 'content':
        const contentResult: BaseStreamEvent = {
          type: 'content',
        };
        if (event.content !== undefined) {
          contentResult.content = event.content;
          contentResult.accumulated = event.content;
        }
        return contentResult;

      case 'thinking':
        const thinkingResult: BaseStreamEvent = {
          type: 'thinking',
        };
        if (event.thinking !== undefined) {
          thinkingResult.thinking = event.thinking;
        }
        return thinkingResult;

      case 'tool_call':
        const toolCallResult: BaseStreamEvent = {
          type: 'tool_call',
        };
        if (event.tool_calls && event.tool_calls.length > 0) {
          toolCallResult.tool_calls = event.tool_calls;
        }
        return toolCallResult;

      case 'complete':
        const completeResult: BaseStreamEvent = {
          type: 'done',
          content: event.content || '',
        };
        if (event.content !== undefined) {
          completeResult.accumulated = event.content;
        }
        if (event.metrics) {
          completeResult.usage = {
            prompt_tokens: event.metrics.prompt_eval_count,
            completion_tokens: event.metrics.eval_count,
            total_tokens: event.metrics.prompt_eval_count + event.metrics.eval_count,
          };
        }
        return completeResult;

      case 'error':
        const errorResult: BaseStreamEvent = {
          type: 'error',
        };
        if (event.error !== undefined) {
          errorResult.error = event.error;
        }
        return errorResult;

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