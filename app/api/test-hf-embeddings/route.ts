import { NextRequest, NextResponse } from 'next/server';
import { HuggingFaceProvider } from '@/lib/ai/providers/huggingface-provider';

export async function GET() {
  console.log('🔍 Testing Hugging Face embedding models...\n');

  const testResults = {
    timestamp: new Date().toISOString(),
    results: {},
    errors: [],
    summary: {
      totalModels: 0,
      workingModels: 0,
      failedModels: 0,
    },
    provider: 'Hugging Face',
  };

  // Initialize provider
  const provider = new HuggingFaceProvider();

  try {
    await provider.initialize({
      type: 'huggingface',
      apiKey: process.env.HUGGINGFACE_API_KEY || '',
    });
  } catch (error) {
    const errorMsg = `Failed to initialize Hugging Face provider: ${error}`;
    console.error(errorMsg);
    testResults.errors.push(errorMsg);
    return NextResponse.json(testResults);
  }

  // Test texts
  const testTexts = [
    "What is artificial intelligence?",
    "Machine learning is a subset of AI",
    "The sky is blue during daytime",
    "Python is a popular programming language",
  ];

  // Get available models
  try {
    const models = await provider.getModels();
    testResults.results.availableModels = models.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      dimensions: getModelDimensions(m.id),
    }));
    testResults.summary.totalModels = models.length;
    console.log(`Found ${models.length} embedding models`);
  } catch (error) {
    const errorMsg = `Failed to fetch models: ${error}`;
    console.error(errorMsg);
    testResults.errors.push(errorMsg);
  }

  // Test a few popular models
  const modelsToTest = [
    'sentence-transformers/all-MiniLM-L6-v2',
    'BAAI/bge-small-en-v1.5',
    'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
  ];

  for (const modelName of modelsToTest) {
    console.log(`\nTesting model: ${modelName}`);

    const modelResult = {
      modelName,
      embeddingGenerated: false,
      dimensions: 0,
      sampleValues: [] as number[],
      error: null as string | null,
      similarityTest: null as { score: number; text1: string; text2: string } | null,
    };

    try {
      // Test single embedding
      const embeddingResponse = await provider.getEmbeddings({
        model: modelName,
        input: testTexts[0],
      });

      if (embeddingResponse.embeddings && embeddingResponse.embeddings.length > 0) {
        const embedding = embeddingResponse.embeddings[0];
        modelResult.embeddingGenerated = true;
        modelResult.dimensions = embedding.length;
        modelResult.sampleValues = embedding.slice(0, 5).map(v => parseFloat(v.toFixed(6)));

        console.log(`✅ Embedding generated successfully`);
        console.log(`   Dimensions: ${embedding.length}`);
        console.log(`   Sample: [${modelResult.sampleValues.join(', ')}...]`);

        testResults.summary.workingModels++;
      }

      // Test batch embeddings (2 texts)
      const batchEmbeddings = await provider.getEmbeddings({
        model: modelName,
        input: [testTexts[0], testTexts[1]],
      });

      if (batchEmbeddings.embeddings && batchEmbeddings.embeddings.length >= 2) {
        // Calculate similarity
        const similarity = cosineSimilarity(
          batchEmbeddings.embeddings[0],
          batchEmbeddings.embeddings[1]
        );

        modelResult.similarityTest = {
          score: parseFloat(similarity.toFixed(6)),
          text1: testTexts[0],
          text2: testTexts[1],
        };

        console.log(`✅ Similarity test: ${similarity.toFixed(6)}`);
        console.log(`   "${testTexts[0]}" vs "${testTexts[1]}"`);
      }
    } catch (error) {
      const errorMsg = `Error testing ${modelName}: ${error}`;
      console.error(`❌ ${errorMsg}`);
      modelResult.error = errorMsg;
      testResults.errors.push(errorMsg);
      testResults.summary.failedModels++;
    }

    testResults.results[modelName] = modelResult;
  }

  // Add info about free tier
  testResults.results.freeTierInfo = {
    provider: 'Hugging Face',
    freeRequestsPerMonth: '~30,000',
    rateLimit: '~1 request/second',
    modelsAvailable: testResults.results.availableModels?.length || 0,
    note: 'Free tier requires API key from https://huggingface.co/settings/tokens',
  };

  console.log('\n✅ Hugging Face embedding tests completed!');
  console.log(`Summary: ${testResults.summary.workingModels}/${testResults.summary.totalModels} models working`);

  return NextResponse.json(testResults);
}

export async function POST(request: NextRequest) {
  try {
    const { texts, model = 'sentence-transformers/all-MiniLM-L6-v2' } = await request.json();

    if (!texts || !Array.isArray(texts) || texts.length < 2) {
      return NextResponse.json(
        { error: 'Please provide at least 2 texts to compare' },
        { status: 400 }
      );
    }

    const provider = new HuggingFaceProvider();
    await provider.initialize({
      type: 'huggingface',
      apiKey: process.env.HUGGINGFACE_API_KEY || '',
    });

    // Generate embeddings for all texts
    const embeddings = await provider.getEmbeddings({
      model,
      input: texts,
    });

    // Calculate similarity matrix
    const similarityMatrix = [];
    for (let i = 0; i < texts.length; i++) {
      const row = [];
      for (let j = 0; j < texts.length; j++) {
        row.push(
          parseFloat(cosineSimilarity(embeddings.embeddings[i], embeddings.embeddings[j]).toFixed(6))
        );
      }
      similarityMatrix.push(row);
    }

    // Find most similar pairs
    const similarPairs = [];
    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        similarPairs.push({
          text1: texts[i],
          text2: texts[j],
          similarity: similarityMatrix[i][j]
        });
      }
    }

    // Sort by similarity
    similarPairs.sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json({
      provider: 'Hugging Face',
      model,
      texts,
      similarityMatrix,
      mostSimilar: similarPairs.slice(0, 3), // Top 3 most similar pairs
      embeddingDimensions: embeddings.embeddings[0]?.length || 0,
      usage: embeddings.usage,
    });

  } catch (error) {
    console.error('Error in POST /api/test-hf-embeddings:', error);
    return NextResponse.json(
      { error: error.toString() },
      { status: 500 }
    );
  }
}

// Helper function to get model dimensions
function getModelDimensions(modelId: string): number {
  const dimensions: Record<string, number> = {
    'sentence-transformers/all-MiniLM-L6-v2': 384,
    'sentence-transformers/all-mpnet-base-v2': 768,
    'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2': 384,
    'BAAI/bge-small-en-v1.5': 384,
    'mixedbread-ai/mxbai-embed-large-v1': 1024,
  };
  return dimensions[modelId] || 0;
}

// Helper function for cosine similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must be of same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}