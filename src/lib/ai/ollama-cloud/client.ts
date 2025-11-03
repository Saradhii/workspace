import { OllamaConfig, OllamaError } from './types';

export class OllamaClient {
  private config: OllamaConfig;
  private baseUrl: string;

  constructor(config?: Partial<OllamaConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.OLLAMA_API_KEY || '',
      baseUrl: config?.baseUrl || process.env.OLLAMA_BASE_URL || 'https://ollama.com',
      defaultModel: config?.defaultModel || 'gpt-oss:20b',
      timeout: config?.timeout || 60000, // 60 seconds default
      retries: config?.retries || 3,
      retryDelay: config?.retryDelay || 1000,
    };

    this.baseUrl = this.config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Handle different error formats
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }

      // Handle rate limiting
      if (response.status === 429) {
        throw new OllamaError({
          error: 'Rate limit exceeded. Please try again later.',
          type: 'rate_limit',
          code: '429',
        });
      }

      // Handle authentication errors
      if (response.status === 401) {
        throw new OllamaError({
          error: 'Invalid API key or authentication failed.',
          type: 'auth_error',
          code: '401',
        });
      }

      // Handle model not found
      if (response.status === 404) {
        throw new OllamaError({
          error: 'Model not found or endpoint does not exist.',
          type: 'not_found',
          code: '404',
        });
      }

      // Generic error
      const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new OllamaError({
        error: errorMessage,
        type: 'api_error',
        code: response.status.toString(),
      });
    }

    return response.json();
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt: number = 1
  ): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(this.config.timeout || 60000),
      });

      // Retry on 5xx errors
      if (response.status >= 500 && attempt < (this.config.retries || 3)) {
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay || 1000));
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      return response;
    } catch (error) {
      // Retry on network errors
      if (attempt < (this.config.retries || 3) &&
          error instanceof Error &&
          (error.name === 'TypeError' || error.name === 'TimeoutError')) {
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay || 1000));
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await this.fetchWithRetry(
      url.toString(),
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}${endpoint}`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      }
    );

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}${endpoint}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    return this.handleResponse<T>(response);
  }

  // Streaming support for chat completions
  async stream(endpoint: string, data: any): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({ ...data, stream: true }),
    });

    if (!response.ok) {
      await this.handleResponse(response);
    }

    if (!response.body) {
      throw new Error('Response body is not available for streaming');
    }

    return response.body;
  }

  // Utility method to parse NDJSON streams
  async* parseNdjsonStream<T>(stream: ReadableStream<Uint8Array>): AsyncGenerator<T, void, unknown> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              yield parsed;
            } catch (error) {
              console.warn('Failed to parse NDJSON line:', line, error);
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          yield parsed;
        } catch (error) {
          console.warn('Failed to parse final NDJSON buffer:', buffer, error);
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // Get client configuration
  getConfig(): Omit<OllamaConfig, 'apiKey'> {
    return {
      baseUrl: this.config.baseUrl,
      defaultModel: this.config.defaultModel,
      timeout: this.config.timeout,
      retries: this.config.retries,
      retryDelay: this.config.retryDelay,
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<OllamaConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.baseUrl) {
      this.baseUrl = newConfig.baseUrl.replace(/\/$/, '');
    }
  }
}

// Create default client instance
export const ollamaClient = new OllamaClient();