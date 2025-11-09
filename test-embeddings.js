// Test script for embedding models
// Run with: node test-embeddings.js

// Since we're in a Next.js project, we'll need to set up the environment
const fetch = require('node-fetch');

// Configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const CHUTES_BASE_URL = process.env.CHUTES_API_BASE_URL || 'https://llm.chutes.ai/v1';
const CHUTES_API_KEY = process.env.CHUTES_API_KEY || '';

// Test texts
const testTexts = [
  "What is artificial intelligence?",
  "Machine learning is a subset of AI",
  "Deep learning uses neural networks",
  "The sky is blue",
  "Python is a programming language"
];

async function testOllamaEmbeddings() {
  console.log('\n🔍 Testing Ollama Cloud Embeddings...\n');

  const embeddingModels = ['qwen3-embedding', 'embeddinggemma', 'all-minilm'];

  for (const model of embeddingModels) {
    try {
      console.log(`Testing model: ${model}`);

      const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          prompt: testTexts[0] // Test with first text
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ Success! Embedding dimensions: ${data.embedding.length}`);
        console.log(`  📊 Sample values: [${data.embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
      } else {
        console.log(`  ❌ Failed with status: ${response.status}`);
        const error = await response.text();
        console.log(`     Error: ${error}`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log();
  }
}

async function testChutesEmbeddings() {
  console.log('🔍 Testing Chutes AI for embeddings...\n');

  // Check if Chutes has an embedding endpoint
  try {
    const response = await fetch(`${CHUTES_BASE_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${CHUTES_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const models = await response.json();
      const embeddingModels = models.data?.filter(m =>
        m.id.toLowerCase().includes('embed') ||
        m.object === 'embedding' ||
        m.capabilities?.includes('embedding')
      );

      if (embeddingModels && embeddingModels.length > 0) {
        console.log('  ✅ Found embedding models:');
        embeddingModels.forEach(m => {
          console.log(`     - ${m.id}: ${m.description || 'No description'}`);
        });

        // Test the first embedding model
        const testModel = embeddingModels[0];
        console.log(`\n  Testing model: ${testModel.id}`);

        const embedResponse = await fetch(`${CHUTES_BASE_URL}/embeddings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CHUTES_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: testModel.id,
            input: testTexts[0]
          })
        });

        if (embedResponse.ok) {
          const embedData = await embedResponse.json();
          console.log(`  ✅ Embedding generated! Dimensions: ${embedData.data[0].embedding.length}`);
        } else {
          console.log(`  ❌ Embedding failed: ${embedResponse.status}`);
        }
      } else {
        console.log('  ❌ No embedding models found in Chutes AI');
      }
    } else {
      console.log(`  ❌ Failed to fetch Chutes models: ${response.status}`);
    }
  } catch (error) {
    console.log(`  ❌ Error testing Chutes: ${error.message}`);
  }
}

async function testSimilarity() {
  console.log('\n🔍 Testing similarity calculation with Ollama...\n');

  try {
    // Get embeddings for two texts
    const embeddings = [];

    for (let i = 0; i < 2; i++) {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen3-embedding',
          prompt: testTexts[i]
        })
      });

      if (response.ok) {
        const data = await response.json();
        embeddings.push(data.embedding);
      }
    }

    if (embeddings.length === 2) {
      // Calculate cosine similarity
      const similarity = cosineSimilarity(embeddings[0], embeddings[1]);
      console.log(`  Text 1: "${testTexts[0]}"`);
      console.log(`  Text 2: "${testTexts[1]}"`);
      console.log(`  📊 Similarity score: ${similarity.toFixed(4)}`);
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }
}

function cosineSimilarity(vecA, vecB) {
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

async function checkAvailableModels() {
  console.log('🔍 Checking available models in Ollama...\n');

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);

    if (response.ok) {
      const data = await response.json();
      const allModels = data.models || [];

      console.log(`  Total models found: ${allModels.length}`);

      // Check for embedding models
      const embeddingKeywords = ['embed', 'embedding', 'minilm', 'gemma'];
      const embeddingModels = allModels.filter(m =>
        embeddingKeywords.some(keyword =>
          m.model.toLowerCase().includes(keyword)
        )
      );

      if (embeddingModels.length > 0) {
        console.log('\n  ✅ Embedding models available:');
        embeddingModels.forEach(m => {
          console.log(`     - ${m.model} (${m.size || 'unknown size'})`);
        });
      } else {
        console.log('\n  ❌ No embedding models found. You may need to pull them first:');
        console.log('     Run: ollama pull qwen3-embedding');
        console.log('     Run: ollama pull embeddinggemma');
        console.log('     Run: ollama pull all-minilm');
      }
    } else {
      console.log(`  ❌ Failed to fetch models: ${response.status}`);
      console.log('  Make sure Ollama is running locally or update OLLAMA_BASE_URL');
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    console.log('  Make sure Ollama is installed and running');
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Embedding Models Test\n');
  console.log('=====================================');

  // Check available models first
  await checkAvailableModels();

  // Test Ollama embeddings
  await testOllamaEmbeddings();

  // Test Chutes embeddings (if available)
  if (CHUTES_API_KEY) {
    await testChutesEmbeddings();
  } else {
    console.log('⚠️  Skipping Chutes AI test - no API key provided');
  }

  // Test similarity calculation
  await testSimilarity();

  console.log('\n✅ Tests completed!');
}

// Run the tests
runTests().catch(console.error);