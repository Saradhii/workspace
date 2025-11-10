import { BaseAIProvider, ModelInfo, BaseEmbeddingRequest, BaseEmbeddingResponse } from './base-provider';
import { ProviderConfig } from './index';
import { OCRGenerationRequest, OCRGenerationResponse } from '@/types/api';

export interface HuggingFaceConfig extends ProviderConfig {
  apiKey: string;
  baseUrl?: string;
}

export class HuggingFaceProvider extends BaseAIProvider {
  name = 'Hugging Face';
  type = 'custom' as const;

  private apiKey: string;
  private baseUrl: string;
  private initialized = false;

  constructor() {
    super();
    this.apiKey = process.env.HUGGINGFACE_API_KEY || '';
    this.baseUrl = process.env.HUGGINGFACE_BASE_URL || 'https://router.huggingface.co/v1';
  }

  async initialize(config: HuggingFaceConfig): Promise<void> {
    this.apiKey = config.apiKey || this.apiKey;
    this.baseUrl = config.baseUrl || this.baseUrl;

    if (!this.apiKey) {
      console.warn('Hugging Face API key not configured, some features may not work');
    }

    this.initialized = true;
  }

  async test(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.warn('[HuggingFace] No API key provided');
        return false;
      }

      // Try to ping a simple model to test the API
      const response = await fetch(`${this.baseUrl}/models/distilbert-base-uncased`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: "Hello world",
        }),
      });

      // If we get a 401, the API is reachable but auth failed
      // If we get a 200 or 429, the API is working
      return response.status === 200 || response.status === 401 || response.status === 429;
    } catch {
      return false;
    }
  }

  async getModels(): Promise<ModelInfo[]> {
    // Combine embedding models and OCR models
    const models: ModelInfo[] = [
      // Embedding models
      {
        id: 'sentence-transformers/all-MiniLM-L6-v2',
        name: 'All-MiniLM-L6-v2',
        displayName: 'All-MiniLM-L6-v2',
        description: 'Fast and efficient English embedding model',
        capabilities: {
          text: false,
          vision: false,
          tools: false,
          thinking: false,
          embeddings: true,
        },
        pricing: {
          input: 0, // Free tier available
          output: 0,
        },
        contextWindow: 512,
      },
      {
        id: 'sentence-transformers/all-mpnet-base-v2',
        name: 'All-MPNet-Base-v2',
        displayName: 'All-MPNet-Base-v2',
        description: 'High quality English embedding model',
        capabilities: {
          text: false,
          vision: false,
          tools: false,
          thinking: false,
          embeddings: true,
        },
        pricing: {
          input: 0, // Free tier available
          output: 0,
        },
        contextWindow: 514,
      },
      {
        id: 'BAAI/bge-small-en-v1.5',
        name: 'BGE Small EN v1.5',
        displayName: 'BGE Small EN v1.5',
        description: 'Better English embedding model from BAAI',
        capabilities: {
          text: false,
          vision: false,
          tools: false,
          thinking: false,
          embeddings: true,
        },
        pricing: {
          input: 0, // Free tier available
          output: 0,
        },
        contextWindow: 512,
      },
      // OCR/Vision Models
      {
        id: 'deepseek-ai/DeepSeek-OCR',
        name: 'DeepSeek-OCR',
        displayName: 'DeepSeek OCR',
        description: '3B parameter model for converting documents to markdown',
        capabilities: {
          text: false,
          vision: true,
          tools: false,
          thinking: false,
          embeddings: false,
        },
        pricing: {
          input: 0, // Free tier available
          output: 0,
        },
        contextWindow: 512,
      },
      {
        id: 'microsoft/DialoGPT-medium',
        name: 'DialoGPT Medium',
        displayName: 'DialoGPT (OCR fallback)',
        description: 'Alternative model for OCR tasks',
        capabilities: {
          text: true,
          vision: true,
          tools: false,
          thinking: false,
          embeddings: false,
        },
        pricing: {
          input: 0,
          output: 0,
        },
        contextWindow: 512,
      },
      {
        id: 'Salesforce/blip-image-captioning-base',
        name: 'BLIP Image Captioning',
        displayName: 'BLIP Image Captioning Base',
        description: 'Image captioning model that can describe images',
        capabilities: {
          text: false,
          vision: true,
          tools: false,
          thinking: false,
          embeddings: false,
        },
        pricing: {
          input: 0, // Free tier available
          output: 0,
        },
        contextWindow: 512,
      },
      {
        id: 'nlpconnect/vit-gpt2-image-captioning',
        name: 'ViT GPT2 Image Captioning',
        displayName: 'ViT GPT2 Image Captioning',
        description: 'Vision Transformer + GPT2 for image captioning',
        capabilities: {
          text: false,
          vision: true,
          tools: false,
          thinking: false,
          embeddings: false,
        },
        pricing: {
          input: 0, // Free tier available
          output: 0,
        },
        contextWindow: 512,
      },
    ];

    return models;
  }

  async getEmbeddings(request: BaseEmbeddingRequest): Promise<BaseEmbeddingResponse> {
    if (!this.apiKey) {
      throw new Error('Hugging Face API key not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/models/${request.model}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: Array.isArray(request.input) ? request.input : [request.input],
            options: {
              use_cache: request.options?.use_cache ?? true,
              wait_for_model: request.options?.wait_for_model ?? true,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.error || error.message || `Hugging Face API error: ${response.statusText}`
        );
      }

      const data = await response.json();

      // Handle both single and multiple inputs
      let embeddings: number[][];

      if (Array.isArray(data)) {
        // Direct array of embeddings
        if (data.length > 0 && Array.isArray(data[0])) {
          // Multiple embeddings
          embeddings = data;
        } else {
          // Single embedding
          embeddings = [data];
        }
      } else if (data && Array.isArray(data.embeddings)) {
        // Object with embeddings field
        embeddings = data.embeddings;
      } else {
        throw new Error('Unexpected response format');
      }

      return {
        embeddings: embeddings,
        model: request.model,
        usage: request.input
          ? {
              prompt_tokens: Array.isArray(request.input)
                ? Math.round(request.input.join(' ').length / 4)
                : Math.round(request.input.length / 4),
              total_tokens: Array.isArray(request.input)
                ? Math.round(request.input.join(' ').length / 4)
                : Math.round(request.input.length / 4),
            }
          : undefined,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate embeddings: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Perform OCR on an image using vision models via chat completion
   */
  async performOCR(request: OCRGenerationRequest): Promise<OCRGenerationResponse> {
    if (!this.initialized) {
      await this.initialize({});
    }

    // Add :novita provider suffix for DeepSeek-OCR
    let model = request.model || 'deepseek-ai/DeepSeek-OCR';
    if (model === 'deepseek-ai/DeepSeek-OCR' && !model.includes(':')) {
      model = 'deepseek-ai/DeepSeek-OCR:novita';
    }

    const startTime = Date.now();

    // Default prompts based on model
    const defaultPrompt = model.includes('DeepSeek-OCR')
      ? 'Convert this document to markdown:'
      : 'Describe this image and extract any text:';
    const prompt = request.prompt || defaultPrompt;

    try {
      // Use the full data URI format
      const imageUrl = request.image.includes('data:')
        ? request.image
        : `data:image/jpeg;base64,${request.image}`;

      // Use chat completions endpoint
      const apiUrl = `${this.baseUrl}/chat/completions`;

      // Format request as OpenAI-compatible chat completion with image
      const requestBody = {
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ]
      };

      console.log('[HuggingFace] OCR Request (Chat Completion):', {
        url: apiUrl,
        hasApiKey: !!this.apiKey,
        model: model,
        prompt: prompt.substring(0, 50) + '...'
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[HuggingFace] API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        throw new Error(`HuggingFace API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      // Extract text from chat completion response
      const extractedText = data.choices?.[0]?.message?.content || '';

      if (!extractedText) {
        console.warn('[HuggingFace] Empty response:', data);
        throw new Error('No content in response');
      }

      // Check for truncation
      const isTruncated = this.detectTruncation(extractedText);
      if (isTruncated) {
        console.warn('[HuggingFace] Response appears to be truncated:', {
          length: extractedText.length,
          lastChars: extractedText.slice(-100)
        });
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        text: extractedText,
        markdown: model.includes('DeepSeek-OCR') ? extractedText : undefined,
        model_used: model,
        processing_time_ms: processingTime,
        request_id: `ocr-${Date.now()}`,
        truncated: isTruncated,
        warning: isTruncated ? 'Response may be truncated - consider splitting large documents' : undefined
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OCR processing failed',
        error_type: 'api_error',
        model_used: model,
        request_id: `ocr-${Date.now()}`,
      };
    }
  }


  /**
   * Detect if the OCR response was truncated
   */
  private detectTruncation(text: string): boolean {
    if (!text || text.length < 100) return false;

    // Check for common truncation patterns
    const truncationIndicators = [
      '...',
      '…',
      'Continue',
      'More text',
      '[TRUNCATED]',
      'elided',
      'etc.',
      'and more',
      'Additional text'
    ];

    const lastChars = text.slice(-200).toLowerCase();
    const indicators = truncationIndicators.some(indicator =>
      lastChars.includes(indicator.toLowerCase())
    );

    // Check if text ends abruptly (mid-sentence)
    const endsAbruptly = (
      text.trim().slice(-3).match(/[a-z]/) && // Ends with lowercase
      !text.trim().match(/[.!?]$/) && // No ending punctuation
      text.length > 500 // Only check for longer texts
    );

    // Check for incomplete table rows or list items
    const incompleteStructure = (
      (text.match(/\|/g) && text.match(/\|/g)!.length % 3 !== 0) || // Table columns not complete
      (text.match(/-/g) && text.slice(-10).match(/[-\*]/)) // Incomplete list
    );

    return indicators || endsAbruptly || incompleteStructure;
  }

  // Chat methods are not implemented for Hugging Face embeddings provider
  async createChat(): Promise<any> {
    throw new Error('Chat not supported by Hugging Face provider');
  }

  async streamChat(): Promise<any> {
    throw new Error('Chat streaming not supported by Hugging Face provider');
  }

  protected convertMessages(): any {
    throw new Error('Message conversion not supported by Hugging Face provider');
  }

  protected convertResponse(): any {
    throw new Error('Response conversion not supported by Hugging Face provider');
  }

  async getImageModels(): Promise<any[]> {
    throw new Error('Image models listing not supported by Hugging Face provider');
  }

  async getCodeModels(): Promise<any[]> {
    throw new Error('Code models not supported by Hugging Face provider');
  }

  getCapabilities() {
    return {
      streaming: false,
      tools: false,
      vision: true, // Now supports vision for OCR
      thinking: false,
      embeddings: true,
      structuredOutputs: false,
    };
  }
}