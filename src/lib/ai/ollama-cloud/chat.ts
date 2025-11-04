import {
  ChatRequest,
  ChatResponse,
  ChatChunk,
  StreamEvent,
  Tool,
  ToolCall,
  ModelCapabilities,
} from './types';
import { ollamaClient } from './client';

export class ChatService {
  /**
   * Send a chat completion request (non-streaming)
   */
  async createChat(request: ChatRequest): Promise<ChatResponse> {
    const response = await ollamaClient.post<ChatResponse>('/api/chat', {
      model: request.model,
      messages: request.messages,
      tools: request.tools,
      format: request.format,
      options: request.options,
      think: request.think,
      keep_alive: request.keep_alive,
      template: request.template,
      stream: false,
    });

    return response;
  }

  /**
   * Send a streaming chat completion request
   */
  async* streamChat(request: ChatRequest): AsyncGenerator<StreamEvent, void, unknown> {
    // Emit start event
    yield {
      type: 'start',
      timestamp: new Date().toISOString(),
    };

    let accumulatedContent = '';
    let accumulatedThinking = '';
    let accumulatedToolCalls: ToolCall[] = [];

    try {
      const stream = await ollamaClient.stream('/api/chat', {
        model: request.model,
        messages: request.messages,
        tools: request.tools,
        format: request.format,
        options: request.options,
        think: request.think,
        keep_alive: request.keep_alive,
        template: request.template,
      });

      for await (const chunk of ollamaClient.parseNdjsonStream<ChatChunk>(stream)) {
        // Handle content
        if (chunk.message?.content) {
          accumulatedContent += chunk.message.content;
          yield {
            type: 'content',
            timestamp: new Date().toISOString(),
            content: chunk.message.content,
          };
        }

        // Handle thinking/reasoning
        if (chunk.message?.thinking) {
          accumulatedThinking += chunk.message.thinking;
          yield {
            type: 'thinking',
            timestamp: new Date().toISOString(),
            thinking: chunk.message.thinking,
          };
        }

        // Handle tool calls
        if (chunk.message?.tool_calls) {
          accumulatedToolCalls = chunk.message.tool_calls;
          yield {
            type: 'tool_call',
            timestamp: new Date().toISOString(),
            tool_calls: chunk.message.tool_calls,
          };
        }

        // Handle completion
        if (chunk.done) {
          yield {
            type: 'complete',
            timestamp: new Date().toISOString(),
            content: accumulatedContent,
            ...(accumulatedThinking && { thinking: accumulatedThinking }),
            ...(accumulatedToolCalls.length > 0 && { tool_calls: accumulatedToolCalls }),
            done: true,
            metrics: {
              total_duration: chunk.total_duration || 0,
              prompt_eval_count: chunk.prompt_eval_count || 0,
              eval_count: chunk.eval_count || 0,
            },
          };
          return;
        }
      }
    } catch (error) {
      yield {
        type: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
      return;
    }
  }

  /**
   * Create a chat with structured output
   */
  async createStructuredChat<T>(
    request: ChatRequest & { schema: Record<string, any> }
  ): Promise<T> {
    const response = await ollamaClient.post<ChatResponse>('/api/chat', {
      model: request.model,
      messages: request.messages,
      format: request.schema,
      options: request.options,
      stream: false,
    });

    try {
      return JSON.parse(response.message.content) as T;
    } catch (error) {
      throw new Error(`Failed to parse structured response: ${error}`);
    }
  }

  /**
   * Execute tool calling workflow
   */
  async executeTools(
    request: ChatRequest & { tools: Tool[] },
    toolExecutor: (toolName: string, args: Record<string, any>) => Promise<any>,
    maxIterations: number = 5
  ): Promise<ChatResponse> {
    let messages = [...request.messages];
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;

      // Request model response
      const response = await this.createChat({
        ...request,
        messages,
      });

      // Check if model wants to use tools
      if (response.message.tool_calls && response.message.tool_calls.length > 0) {
        // Add assistant's response with tool calls
        messages.push({
          role: 'assistant',
          content: response.message.content,
          tool_calls: response.message.tool_calls,
        });

        // Execute each tool call
        for (const toolCall of response.message.tool_calls) {
          try {
            const toolResult = await toolExecutor(
              toolCall.function.name,
              toolCall.function.arguments
            );

            // Add tool result to messages
            messages.push({
              role: 'tool',
              content: JSON.stringify(toolResult),
            });
          } catch (error) {
            // Add error as tool result
            messages.push({
              role: 'tool',
              content: JSON.stringify({
                error: error instanceof Error ? error.message : 'Tool execution failed',
              }),
            });
          }
        }
      } else {
        // No more tool calls, return final response
        return response;
      }
    }

    throw new Error(`Maximum tool execution iterations (${maxIterations}) exceeded`);
  }

  /**
   * Create a vision chat with images
   */
  async createVisionChat(
    request: ChatRequest & { images: string[] }
  ): Promise<ChatResponse> {
    // Ensure the first user message has images
    const messages = request.messages.map(msg => {
      if (msg.role === 'user' && request.messages[0] && msg.content === request.messages[0].content) {
        return {
          ...msg,
          images: request.images,
        };
      }
      return msg;
    });

    return this.createChat({
      ...request,
      messages,
    });
  }

  /**
   * Get model capabilities
   */
  getModelCapabilities(model: string): ModelCapabilities {
    const capabilities: Record<string, ModelCapabilities> = {
      'deepseek-v3.1:671b': {
        supportsThinking: true,
        supportsVision: false,
        supportsTools: true,
        supportsStructuredOutputs: true,
        supportsEmbeddings: false,
        contextWindow: 32768,
      },
      'qwen3-coder:480b': {
        supportsThinking: false,
        supportsVision: false,
        supportsTools: true,
        supportsStructuredOutputs: true,
        supportsEmbeddings: false,
        contextWindow: 262144,
      },
      'qwen3-vl:235b': {
        supportsThinking: false,
        supportsVision: true,
        supportsTools: true,
        supportsStructuredOutputs: true,
        supportsEmbeddings: false,
        contextWindow: 131072,
      },
      'qwen3-vl:235b-instruct': {
        supportsThinking: false,
        supportsVision: true,
        supportsTools: true,
        supportsStructuredOutputs: true,
        supportsEmbeddings: false,
        contextWindow: 131072,
      },
      'gpt-oss:20b': {
        supportsThinking: true,
        supportsVision: false,
        supportsTools: true,
        supportsStructuredOutputs: true,
        supportsEmbeddings: false,
        contextWindow: 32768,
      },
      'gpt-oss:120b': {
        supportsThinking: true,
        supportsVision: false,
        supportsTools: true,
        supportsStructuredOutputs: true,
        supportsEmbeddings: false,
        contextWindow: 32768,
      },
      'kimi-k2:1t': {
        supportsThinking: false,
        supportsVision: false,
        supportsTools: true,
        supportsStructuredOutputs: true,
        supportsEmbeddings: false,
        contextWindow: 32768,
      },
      'glm-4.6': {
        supportsThinking: false,
        supportsVision: false,
        supportsTools: true,
        supportsStructuredOutputs: true,
        supportsEmbeddings: false,
        contextWindow: 202752,
      },
      'minimax-m2': {
        supportsThinking: false,
        supportsVision: false,
        supportsTools: true,
        supportsStructuredOutputs: true,
        supportsEmbeddings: false,
        contextWindow: 32768,
      },
      'llama-3.2-3b': {
        supportsThinking: false,
        supportsVision: false,
        supportsTools: true,
        supportsStructuredOutputs: true,
        supportsEmbeddings: false,
        contextWindow: 131072,
      },
      'llama-3.3-70b': {
        supportsThinking: false,
        supportsVision: false,
        supportsTools: true,
        supportsStructuredOutputs: false,
        supportsEmbeddings: false,
        contextWindow: 131072,
      },
    };

    return (
      capabilities[model] || {
        supportsThinking: false,
        supportsVision: false,
        supportsTools: false,
        supportsStructuredOutputs: false,
        supportsEmbeddings: false,
        contextWindow: 4096,
      }
    );
  }

  /**
   * List available chat models with their capabilities
   */
  async listModels() {
    const response = await ollamaClient.get<{ models: any[] }>('/api/tags');

    return response.models
      .filter(model => model.type === 'text')
      .map(model => ({
        name: model.model,
        displayName: model.name,
        size: model.size,
        modifiedAt: model.modified_at,
        capabilities: this.getModelCapabilities(model.model),
      }));
  }
}

// Export singleton instance
export const chatService = new ChatService();