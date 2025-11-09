import { NextRequest, NextResponse } from 'next/server';
import { providerRegistry } from '@/lib/ai/providers';
import { OCRGenerationRequest, OCRGenerationResponse } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body: OCRGenerationRequest = await request.json();

    const { image, model, prompt, user_id, options } = body;

    // Validate required fields
    if (!image) {
      return NextResponse.json({
        success: false,
        error: 'Image is required',
        error_type: 'validation_error',
      } as OCRGenerationResponse, { status: 400 });
    }

    // Get Hugging Face provider
    const provider = await providerRegistry.get('huggingface');

    // Check if provider has OCR capability
    const capabilities = provider.getCapabilities();
    if (!capabilities.vision) {
      return NextResponse.json({
        success: false,
        error: 'OCR not supported by current provider configuration',
        error_type: 'provider_error',
      } as OCRGenerationResponse, { status: 400 });
    }

    // Perform OCR
    const result = await (provider as any).performOCR({
      image,
      model: model || 'deepseek-ai/DeepSeek-OCR',
      prompt: prompt || (model?.includes('DeepSeek-OCR') ? 'Convert this document to markdown:' : 'Extract text from this image:'),
      user_id,
      options,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('OCR processing error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'OCR processing failed',
      error_type: 'server_error',
      request_id: `ocr-${Date.now()}`,
    } as OCRGenerationResponse, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'OCR processing endpoint. Use POST with image data.',
    usage: {
      method: 'POST',
      body: {
        image: 'data:image/png;base64,iVBORw0KGgoAAAANS...', // base64 encoded image
        model: 'deepseek-ai/DeepSeek-OCR (optional)',
        prompt: 'Convert this document to markdown: (optional)',
        options: {
          output_format: 'text | markdown | json (optional)',
          preserve_layout: 'boolean (optional)',
          language: 'string (optional)',
        }
      }
    },
    example_prompts: {
      'deepseek-ai/DeepSeek-OCR': [
        'Convert this document to markdown:',
        'Free OCR.',
        'Extract all text from this image:',
        '<image>\nOCR this image'
      ],
      'other models': [
        'Describe this image and extract any text:',
        'What text is in this image?',
        'Extract text from this document:'
      ]
    },
    supported_models: [
      'deepseek-ai/DeepSeek-OCR',
      'Salesforce/blip-image-captioning-base',
      'nlpconnect/vit-gpt2-image-captioning',
    ]
  });
}