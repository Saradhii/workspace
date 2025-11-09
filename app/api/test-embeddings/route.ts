import { NextRequest, NextResponse } from 'next/server';
import { embeddingsService } from '@/lib/ai/ollama-cloud/embeddings';
import { ollamaClient } from '@/lib/ai/ollama-cloud/client';

export async function GET() {
  console.log('🚀 Testing embedding models...\n');

  const testResults: any = {
    timestamp: new Date().toISOString(),
    results: {},
    errors: [],
    summary: {
      totalModels: 0,
      workingModels: 0,
      failedModels: 0
    }
  };

  // Test texts
  const testTexts = [
    "What is artificial intelligence?",
    "Machine learning is a subset of AI",
    "The sky is blue"
  ];

  // Models to test
  const modelsToTest = ['qwen3-embedding', 'embeddinggemma', 'all-minilm'];

  // 1. Check available models
  try {
    const response = await ollamaClient.get('/api/tags');
    const models = response as { models: { model: string; type: string }[] };

    const availableModels = models.models.map(m => m.model);
    console.log('Available models:', availableModels);

    testResults.results.availableModels = availableModels;
    testResults.summary.totalModels = modelsToTest.length;

    // Check if embedding models exist
    const embeddingModelsAvailable = models.models.some(m =>
      m.model.toLowerCase().includes('embed')
    );

    if (!embeddingModelsAvailable) {
      const warning = "No embedding models found on Ollama Cloud. Embedding models (qwen3-embedding, embeddinggemma, all-minilm) are only available for local Ollama installations.";
      testResults.errors.push(warning);
      testResults.results.note = "To use embeddings, you need to run Ollama locally and pull the embedding models with: ollama pull qwen3-embedding";
    }
  } catch (error) {
    const errorMsg = `Failed to fetch models: ${error}`;
    console.error(errorMsg);
    testResults.errors.push(errorMsg);
  }

  // 2. Test each embedding model
  for (const modelName of modelsToTest) {
    console.log(`\nTesting model: ${modelName}`);

    const modelResult = {
      modelName,
      embeddingGenerated: false,
      dimensions: 0,
      sampleValues: [] as number[],
      error: null as string | null,
      similarityTest: null as { score: number; text1: string; text2: string } | null
    };

    try {
      // Test single embedding
      const embeddingResponse = await embeddingsService.createEmbedding({
        model: modelName,
        input: testTexts[0]
      });

      if (embeddingResponse.embeddings && embeddingResponse.embeddings.length > 0) {
        const embedding = embeddingResponse.embeddings[0];
        if (embedding) {
          modelResult.embeddingGenerated = true;
          modelResult.dimensions = embedding.length;
        modelResult.sampleValues = embedding.slice(0, 5).map(v => parseFloat(v.toFixed(6)));

        console.log(`✅ Embedding generated successfully`);
        console.log(`   Dimensions: ${embedding.length}`);
        console.log(`   Sample: [${modelResult.sampleValues.join(', ')}...]`);
        }
        testResults.summary.workingModels++;
      }

      // Test batch embeddings (2 texts)
      const batchEmbeddings = await embeddingsService.createBatchEmbeddings(
        modelName,
        [testTexts[0], testTexts[1]]
      );

      if (batchEmbeddings.length === 2 && batchEmbeddings[0] && batchEmbeddings[1]) {
        // Calculate similarity
        const similarity = embeddingsService.cosineSimilarity(
          batchEmbeddings[0],
          batchEmbeddings[1]
        );

        modelResult.similarityTest = {
          score: parseFloat(similarity.toFixed(6)),
          text1: testTexts[0],
          text2: testTexts[1]
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

  // 3. Test model info
  console.log('\n📊 Model Information:');
  const modelInfo: any = {};
  for (const modelName of modelsToTest) {
    const info = embeddingsService.getModelInfo(modelName);
    modelInfo[modelName] = info;
    console.log(`${modelName}: ${info.dimensions}D - ${info.description}`);
  }
  testResults.results.modelInfo = modelInfo;

  // 4. Test clustering if we have at least 2 working models
  if (testResults.summary.workingModels >= 1) {
    try {
      console.log('\n🔄 Testing text clustering...');
      const clusters = await embeddingsService.clusterTexts(
        testTexts,
        'qwen3-embedding',
        0.7
      );
      console.log(`✅ Clusters formed: ${clusters.length}`);
      (testResults.results as any).clusteringTest = {
        success: true,
        clusterCount: clusters.length,
        clusters: clusters
      };
    } catch (error) {
      console.error(`❌ Clustering test failed: ${error}`);
      (testResults.results as any).clusteringTest = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // 5. List available embedding models
  try {
    const availableEmbeddingModels = await embeddingsService.listEmbeddingModels();
    console.log('\n📋 Available embedding models:');
    availableEmbeddingModels.forEach(m => {
      console.log(`  - ${m.name}: ${m.dimensions}D - ${m.description}`);
    });
    testResults.results.availableEmbeddingModels = availableEmbeddingModels;
  } catch (error) {
    console.error(`❌ Failed to list embedding models: ${error}`);
    testResults.errors.push(`Failed to list embedding models: ${error}`);
  }

  console.log('\n✅ Embedding tests completed!');
  console.log(`Summary: ${testResults.summary.workingModels}/${testResults.summary.totalModels} models working`);

  return NextResponse.json(testResults);
}

// Test similarity calculation
export async function POST(request: NextRequest) {
  try {
    const { texts, model = 'qwen3-embedding' } = await request.json();

    if (!texts || !Array.isArray(texts) || texts.length < 2) {
      return NextResponse.json(
        { error: 'Please provide at least 2 texts to compare' },
        { status: 400 }
      );
    }

    // Generate embeddings for all texts
    const embeddings = await embeddingsService.createBatchEmbeddings(model, texts);

    // Calculate similarity matrix
    const similarityMatrix = [];
    for (let i = 0; i < embeddings.length; i++) {
      const row = [];
      for (let j = 0; j < embeddings.length; j++) {
        row.push(
          parseFloat(embeddingsService.cosineSimilarity(embeddings[i], embeddings[j]).toFixed(6))
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
      model,
      texts,
      similarityMatrix,
      mostSimilar: similarPairs.slice(0, 3), // Top 3 most similar pairs
      embeddingDimensions: embeddings[0]?.length || 0
    });

  } catch (error) {
    console.error('Error in POST /api/test-embeddings:', error);
    return NextResponse.json(
      { error: error.toString() },
      { status: 500 }
    );
  }
}