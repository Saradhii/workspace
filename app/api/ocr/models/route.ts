import { NextResponse } from 'next/server';
import { providerRegistry } from '@/lib/ai/providers';

export async function GET() {
  try {
    // Get Hugging Face provider
    const provider = await providerRegistry.get('huggingface');

    // Get all models from the provider
    const allModels = await provider.getModels();

    // Filter only vision/OCR models
    const ocrModels = allModels.filter(model =>
      model.capabilities.vision && !model.capabilities.embeddings
    ).map(model => ({
      id: model.id,
      name: model.name,
      display_name: model.displayName,
      description: model.description,
      supported_formats: ['jpeg', 'jpg', 'png', 'webp', 'bmp'],
      max_image_size: 4096,
      features: model.capabilities.vision ? ['ocr', 'document-processing'] : [],
      output_formats: model.id.includes('DeepSeek-OCR') ? ['markdown', 'text'] : ['text'],
      languages: model.id.includes('DeepSeek-OCR') ? ['en', 'zh'] : ['en'],
    }));

    return NextResponse.json({
      success: true,
      models: ocrModels,
      count: ocrModels.length,
      provider: 'huggingface',
    });
  } catch (error) {
    console.error('Failed to fetch OCR models:', error);

    // Return hardcoded models as fallback
    const fallbackModels = [
      {
        id: 'deepseek-ai/DeepSeek-OCR',
        name: 'DeepSeek-OCR',
        display_name: 'DeepSeek OCR',
        description: '3B parameter model for converting documents to markdown',
        supported_formats: ['jpeg', 'jpg', 'png', 'webp', 'bmp'],
        max_image_size: 4096,
        features: ['ocr', 'document-processing', 'markdown-output'],
        output_formats: ['markdown', 'text'],
        languages: ['en', 'zh'],
      },
      {
        id: 'Salesforce/blip-image-captioning-base',
        name: 'BLIP Image Captioning',
        display_name: 'BLIP Image Captioning Base',
        description: 'Image captioning model that can describe images',
        supported_formats: ['jpeg', 'jpg', 'png', 'webp'],
        max_image_size: 384,
        features: ['image-captioning', 'ocr'],
        output_formats: ['text'],
        languages: ['en'],
      },
    ];

    return NextResponse.json({
      success: true,
      models: fallbackModels,
      count: fallbackModels.length,
      provider: 'huggingface',
    });
  }
}