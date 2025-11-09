#!/usr/bin/env node

// Check HuggingFace API key configuration
require('dotenv').config();

console.log('HuggingFace API Configuration Check\n');

const apiKey = process.env.HUGGINGFACE_API_KEY;

if (!apiKey) {
  console.log('❌ HUGGINGFACE_API_KEY not found in environment');
  console.log('\nTo fix this:');
  console.log('1. Get an API key from https://huggingface.co/settings/tokens');
  console.log('2. Add it to your .env file: HUGGINGFACE_API_KEY=hf_your_key_here');
  console.log('3. Restart your development server');
} else if (apiKey.startsWith('hf_')) {
  console.log('✅ HuggingFace API key found and properly formatted');
  console.log(`   Key starts with: ${apiKey.substring(0, 10)}...`);

  // Test the API
  console.log('\nTesting API connection...');
  testAPI();
} else {
  console.log('⚠️  API key found but may be incorrectly formatted');
  console.log(`   Key starts with: ${apiKey.substring(0, 10)}...`);
  console.log('   HuggingFace API keys should start with "hf_"');
}

async function testAPI() {
  try {
    // Test with a simple text generation model
    const response = await fetch('https://api-inference.huggingface.co/models/distilbert-base-uncased', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: 'Hello world',
      }),
    });

    if (response.ok || response.status === 401) {
      console.log('✅ API endpoint is reachable');
      if (response.status === 401) {
        console.log('   Note: Got 401 error, but endpoint is reachable');
      }
    } else {
      console.log('❌ API test failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Status: ${response.statusText}`);
    }
  } catch (error) {
    console.log('❌ Could not connect to HuggingFace API');
    console.log(`   Error: ${error.message}`);
  }
}

console.log('\nAPI Endpoints:');
console.log('- Old (deprecated): https://api-inference.huggingface.co');
console.log('- New: https://router.huggingface.co/hf-inference');
console.log('- OpenAI compatible: https://router.huggingface.co/v1');