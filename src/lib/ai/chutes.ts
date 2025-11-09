import {
  ImageGenerationRequest,
  ImageGenerationResponse,
  ImageGenerationStreamEvent,
  DualImageGenerationResponse,
  ImageModel,
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoGenerationStreamEvent,
  VideoModel,
  VideoUploadRequest,
  VideoUploadResponse,
  TextGenerationRequest,
  TextGenerationResponse,
  TextStreamEvent
} from '@/types/api';

export class ChutesService {
  private apiKey: string;
  private imageApiUrl: string;
  private videoApiUrl: string;
  private textApiUrl: string;

  constructor() {
    this.apiKey = process.env.CHUTES_API_KEY || '';
    this.imageApiUrl = process.env.CHUTES_IMAGE_API_URL || 'https://image.chutes.ai';
    this.videoApiUrl = process.env.CHUTES_VIDEO_API_URL || 'https://chutes-wan-2-2-i2v-14b-fast.chutes.ai';
    this.textApiUrl = process.env.CHUTES_API_BASE_URL || 'https://llm.chutes.ai/v1';
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
    };
  }

  // Image Generation Methods
  async generateImage(params: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      const startTime = Date.now();

      const response = await fetch(`${this.imageApiUrl}/generate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          prompt: params.prompt,
          negative_prompt: params.negative_prompt,
          width: params.width || 1024,
          height: params.height || 1024,
          steps: params.steps || 30,
          cfg_scale: params.cfg || 4.5,
          seed: params.seed || 0,
          model: params.model || 'chroma',
          return_base64: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        let errorMessage = `Image generation failed: ${response.statusText}`;

        // Handle nested error structure
        if (error.detail) {
          if (typeof error.detail === 'string') {
            errorMessage = error.detail;
          } else if (error.detail.message) {
            errorMessage = error.detail.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      const generationTime = Date.now() - startTime;

      return {
        success: true,
        image_id: data.image_id || `img-${Date.now()}`,
        image_base64: data.image_base64,
        format: data.format || 'jpeg',
        width: data.width || params.width || 1024,
        height: data.height || params.height || 1024,
        generation_time_ms: generationTime,
        parameters: {
          model: params.model || 'chroma',
          ...params,
        },
        model_used: params.model || 'chroma',
        seed_used: data.seed || params.seed || 0,
        request_id: data.request_id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image generation failed',
        image_id: `error-${Date.now()}`,
        format: 'jpeg',
        width: params.width || 1024,
        height: params.height || 1024,
        generation_time_ms: 0,
        parameters: params as unknown as Record<string, unknown>,
        model_used: params.model || 'chroma',
        seed_used: params.seed || 0,
      };
    }
  }

  async generateDualImage(params: ImageGenerationRequest): Promise<DualImageGenerationResponse> {
    const startTime = Date.now();

    // Generate with both models in parallel
    const [chromaResult, fluxResult] = await Promise.all([
      this.generateImage({ ...params, model: 'chroma' }),
      this.generateImage({ ...params, model: 'flux' }),
    ]);

    const totalTime = Date.now() - startTime;

    const errors: Record<string, string> = {};
    if (!chromaResult.success) errors.chroma = chromaResult.error || 'Failed to generate';
    if (!fluxResult.success) errors.flux = fluxResult.error || 'Failed to generate';

    return {
      success: chromaResult.success || fluxResult.success,
      chroma: chromaResult.success ? chromaResult : undefined,
      neta_lumina: fluxResult.success ? { ...fluxResult, model_used: 'FLUX.1 [dev]' } : undefined,
      total_generation_time_ms: totalTime,
      request_id: `dual-${Date.now()}`,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    } as DualImageGenerationResponse;
  }

  async* streamImageGeneration(
    params: ImageGenerationRequest
  ): AsyncGenerator<ImageGenerationStreamEvent> {
    try {

      // Initial progress
      yield {
        type: 'progress',
        timestamp: new Date().toISOString(),
        progress: 0.1,
        stage: 'initializing',
        message: 'Starting image generation...',
      };

      const result = await this.generateImage(params);

      // Simulate intermediate progress steps
      yield {
        type: 'progress',
        timestamp: new Date().toISOString(),
        progress: 0.3,
        stage: 'processing',
        message: 'Processing prompt...',
      };

      yield {
        type: 'progress',
        timestamp: new Date().toISOString(),
        progress: 0.6,
        stage: 'generating',
        message: 'Generating image...',
      };

      yield {
        type: 'progress',
        timestamp: new Date().toISOString(),
        progress: 0.9,
        stage: 'finalizing',
        message: 'Finalizing image...',
      };

      // Complete event
      yield {
        type: 'complete',
        timestamp: new Date().toISOString(),
        image_id: result.image_id,
        ...(result.image_base64 && { image_base64: result.image_base64 }),
        generation_time_ms: result.generation_time_ms,
      };
    } catch (error) {
      yield {
        type: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Streaming failed',
        details: { error_type: 'generation_error' },
      };
    }
  }

  // Video Generation Methods
  async uploadSourceImage(params: VideoUploadRequest): Promise<VideoUploadResponse> {
    try {
      const response = await fetch(`${this.videoApiUrl}/upload`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          image_base64: params.image_base64,
          filename: params.filename,
          format: params.format || 'jpeg',
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        let errorMessage = `Upload failed: ${response.statusText}`;

        // Handle nested error structure
        if (error.detail) {
          if (typeof error.detail === 'string') {
            errorMessage = error.detail;
          } else if (error.detail.message) {
            errorMessage = error.detail.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      return {
        success: true,
        image_id: data.image_id || `img-${Date.now()}`,
        image_url: data.image_url,
        temporary: data.temporary !== false,
        expires_at: data.expires_at,
      };
    } catch (error) {
      throw new Error(`Failed to upload source image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateVideo(params: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    try {
      const startTime = Date.now();

      // Extract base64 data if it has a data URI prefix
      const base64Data = params.image?.includes('base64,')
        ? params.image?.split('base64,')[1]
        : params.image;

      const response = await fetch(`${this.videoApiUrl}/generate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          image: base64Data,
          prompt: params.prompt,
          negative_prompt: params.negative_prompt,
          frames: params.frames || 21,
          fps: params.fps || 16,
          guidance_scale: params.guidance_scale || 1.0,
          guidance_scale_2: params.guidance_scale_2 || 1.0,
          resolution: params.resolution || '480p',
          fast: params.fast !== false,
          seed: params.seed || -1,
          return_url: true,
          return_base64: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        let errorMessage = `Video generation failed: ${response.statusText}`;

        // Handle nested error structure
        if (error.detail) {
          if (typeof error.detail === 'string') {
            errorMessage = error.detail;
          } else if (error.detail.message) {
            errorMessage = error.detail.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      const generationTime = Date.now() - startTime;

      return {
        success: true,
        video_id: data.video_id || `vid-${Date.now()}`,
        video_url: data.video_url,
        format: data.format || 'mp4',
        width: data.width || 480,
        height: data.height || 480,
        frames: data.frames || params.frames || 21,
        fps: data.fps || params.fps || 16,
        duration: data.duration || (data.frames || params.frames || 21) / (data.fps || params.fps || 16),
        file_size: data.file_size,
        generation_time_ms: generationTime,
        parameters: {
          prompt: params.prompt,
          resolution: params.resolution || '480p',
          ...(({ prompt, ...rest }) => rest)(params),
        },
        model_used: 'wan-2-2-i2v-14b-fast',
        seed_used: data.seed || params.seed || -1,
        request_id: data.request_id,
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Video generation failed',
        video_id: `error-${Date.now()}`,
        format: 'mp4',
        width: 480,
        height: 480,
        frames: params.frames || 21,
        fps: params.fps || 16,
        duration: (params.frames || 21) / (params.fps || 16),
        generation_time_ms: 0,
        parameters: params as unknown as Record<string, unknown>,
        model_used: 'wan-2-2-i2v-14b-fast',
        seed_used: params.seed || -1,
        created_at: new Date().toISOString(),
      };
    }
  }

  async* streamVideoGeneration(
    params: VideoGenerationRequest
  ): AsyncGenerator<VideoGenerationStreamEvent> {
    try {

      // Simulate progress updates
      const progressSteps = [
        { progress: 0.1, stage: 'uploading', message: 'Uploading source image...' },
        { progress: 0.2, stage: 'processing', message: 'Processing image...' },
        { progress: 0.3, stage: 'analyzing', message: 'Analyzing motion parameters...' },
        { progress: 0.4, stage: 'generating', message: 'Generating initial frames...' },
        { progress: 0.6, stage: 'generating', message: 'Generating video frames...' },
        { progress: 0.8, stage: 'enhancing', message: 'Enhancing video quality...' },
        { progress: 0.9, stage: 'encoding', message: 'Encoding video...' },
      ];

      for (const step of progressSteps) {
        yield {
          type: 'progress',
          timestamp: new Date().toISOString(),
          progress: step.progress,
          stage: step.stage,
          message: step.message,
          frames_completed: Math.floor((params.frames || 21) * step.progress),
        };

        // Add delay to simulate actual processing
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Generate the actual video
      const result = await this.generateVideo(params);

      if (result.success) {
        yield {
          type: 'complete',
          timestamp: new Date().toISOString(),
          video_id: result.video_id,
          ...(result.video_url && { video_url: result.video_url }),
          generation_time_ms: result.generation_time_ms,
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      yield {
        type: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Video streaming failed',
        details: { error_type: 'generation_error' },
      };
    }
  }

  // Model Information Methods
  async getImageModels(): Promise<ImageModel[]> {
    // Return hardcoded models since Chutes doesn't have a models endpoint
    // Note: Currently only 'chroma' model is available on Chutes AI
    return [
      {
        name: 'chroma',
        display_name: 'Chroma',
        description: 'Fast and efficient image generation model',
        max_width: 2048,
        max_height: 2048,
        supported_formats: ['jpeg', 'png'],
        features: ['text-to-image', 'fast-generation'],
      },
    ];
  }

  async getVideoModels(): Promise<VideoModel[]> {
    // Return hardcoded video model info
    return [
      {
        name: 'wan-2-2-i2v-14b-fast',
        display_name: 'Wan 2.2 I2V (Fast)',
        description: 'Fast image-to-video generation model',
        max_frames: 140,
        max_resolution: '720p',
        supported_formats: ['mp4'],
        features: ['image-to-video', 'fast-mode'],
        avg_generation_time: '30-60 seconds',
      },
    ];
  }

  // Text Generation Methods
  async generateText(params: TextGenerationRequest): Promise<TextGenerationResponse> {
    const response = await fetch(`${this.textApiUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 1024,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      let errorMessage = `Text generation failed: ${response.statusText}`;

      // Handle nested error structure
      if (error.detail) {
        if (typeof error.detail === 'string') {
          errorMessage = error.detail;
        } else if (error.detail.message) {
          errorMessage = error.detail.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    return {
      success: true,
      content: choice?.message?.content || '',
      model_used: params.model || 'Alibaba-NLP/Tongyi-DeepResearch-30B-A3B',
      usage: {
        prompt_tokens: data.usage?.prompt_tokens || 0,
        completion_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0,
      },
      finish_reason: choice?.finish_reason || 'stop',
    };
  }

  async* streamText(params: TextGenerationRequest): AsyncGenerator<TextStreamEvent> {
    console.log('[CHUTES] Starting stream with model:', params.model);

    // Check if this is a reasoning model
    const isReasoningModel = params.model?.includes('gpt-oss-20b') ||
                            params.model?.includes('Tongyi-DeepResearch') ||
                            params.model?.includes('reasoning');

    const requestBody: any = {
      model: params.model,
      messages: params.messages,
      temperature: params.temperature || 0.7,
      max_tokens: params.max_tokens || 1024,
      stream: true,
    };

    // Add thinking parameter for reasoning models
    if (isReasoningModel) {
      requestBody.think = true;
      console.log('[CHUTES] Enabling think mode for reasoning model:', params.model);
    }

    console.log('[CHUTES] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${this.textApiUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      let errorMessage = `Text generation failed: ${response.statusText}`;

      // Handle nested error structure
      if (error.detail) {
        if (typeof error.detail === 'string') {
          errorMessage = error.detail;
        } else if (error.detail.message) {
          errorMessage = error.detail.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }

    let accumulatedContent = '';
    let accumulatedReasoning = '';
    let isInThinking = false;
    let thinkingBuffer = '';

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              yield {
                type: 'done',
                content: accumulatedContent,
                accumulated: accumulatedContent,
                ...(accumulatedReasoning && { reasoning: accumulatedReasoning }),
                model: params.model || 'Alibaba-NLP/Tongyi-DeepResearch-30B-A3B',
              };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;

              // Debug logging to see the actual structure
              if (delta) {
                console.log('[CHUTES] Delta received:', {
                  hasContent: !!delta.content,
                  hasReasoning: !!delta.reasoning,
                  hasThinking: !!delta.thinking,
                  hasReasoningContent: !!delta.reasoning_content,
                  content: delta.content?.substring(0, 100),
                  fullDelta: delta
                });
              }

              if (delta?.content) {
                const content = delta.content;

                // Handle thinking tokens
                // Check for common thinking markers
                if (content.includes('<thinking>')) {
                  isInThinking = true;
                  const parts = content.split('<thinking>');
                  if (parts[0]) {
                    accumulatedContent += parts[0];
                  }
                  thinkingBuffer = parts[1] || '';
                  console.log('[CHUTES] Found <thinking> tag');
                } else if (content.includes('</thinking>')) {
                  isInThinking = false;
                  const parts = content.split('</thinking>');
                  if (parts[0]) {
                    thinkingBuffer += parts[0];
                  }
                  accumulatedReasoning += thinkingBuffer;
                  thinkingBuffer = '';
                  if (parts[1]) {
                    accumulatedContent += parts[1];
                  }
                  console.log('[CHUTES] Found </thinking> tag, accumulated reasoning:', accumulatedReasoning.length);
                } else if (isInThinking) {
                  thinkingBuffer += content;
                  // Yield reasoning event
                  yield {
                    type: 'reasoning',
                    content: content,
                    accumulated: accumulatedReasoning + thinkingBuffer,
                  };
                } else {
                  accumulatedContent += content;
                  // Yield content event
                  yield {
                    type: 'content',
                    content: content,
                    accumulated: accumulatedContent,
                  };
                }
              }

              // Check for separate reasoning field
              if (delta?.reasoning) {
                console.log('[CHUTES] Found reasoning in delta.reasoning');
                accumulatedReasoning += delta.reasoning;
                yield {
                  type: 'reasoning',
                  content: delta.reasoning,
                  accumulated: accumulatedReasoning,
                };
              }

              // Check for separate thinking field
              if (delta?.thinking) {
                console.log('[CHUTES] Found thinking in delta.thinking');
                accumulatedReasoning += delta.thinking;
                yield {
                  type: 'reasoning',
                  content: delta.thinking,
                  accumulated: accumulatedReasoning,
                };
              }

              // Check for reasoning_content field (used by Tongyi-DeepResearch)
              if (delta?.reasoning_content) {
                console.log('[CHUTES] Found reasoning in delta.reasoning_content');
                accumulatedReasoning += delta.reasoning_content;
                yield {
                  type: 'reasoning',
                  content: delta.reasoning_content,
                  accumulated: accumulatedReasoning,
                };
              }

              // Yield usage info if available
              if (parsed.usage) {
                yield {
                  type: 'usage',
                  usage: {
                    prompt_tokens: parsed.usage.prompt_tokens || 0,
                    completion_tokens: parsed.usage.completion_tokens || 0,
                    total_tokens: parsed.usage.total_tokens || 0,
                  },
                };
              }
            } catch (e) {
              // Ignore JSON parse errors for streaming chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// Export singleton instance
export const chutesService = new ChutesService();