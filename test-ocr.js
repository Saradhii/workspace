#!/usr/bin/env node

// Test script for DeepSeek OCR API
// Run with: node test-ocr.js

const fs = require('fs');
const path = require('path');

// Helper function to convert file to base64
function fileToBase64(filePath) {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    return `data:image/${path.extname(filePath).slice(1)};base64,${imageBuffer.toString('base64')}`;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

// Test the OCR API
async function testOCR() {
  const baseUrl = 'http://localhost:3000';

  console.log('Testing DeepSeek OCR Integration\n');

  // Test 1: Get available OCR models
  console.log('1. Fetching available OCR models...');
  try {
    const modelsResponse = await fetch(`${baseUrl}/api/ocr/models`);
    const modelsData = await modelsResponse.json();

    console.log('Status:', modelsResponse.status);
    console.log('Models:', JSON.stringify(modelsData, null, 2));
  } catch (error) {
    console.error('Error fetching models:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Process OCR (if you have a test image)
  console.log('2. Testing OCR processing...');

  // Create a simple test image path (you can replace with your own image)
  const testImagePath = './test-image.png'; // Replace with actual image path

  if (fs.existsSync(testImagePath)) {
    const base64Image = fileToBase64(testImagePath);

    if (base64Image) {
      try {
        const ocrResponse = await fetch(`${baseUrl}/api/ocr/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64Image,
            model: 'deepseek-ai/DeepSeek-OCR',
            prompt: 'Convert this document to markdown:',
            options: {
              output_format: 'markdown',
              preserve_layout: true,
            },
          }),
        });

        const ocrData = await ocrResponse.json();

        console.log('Status:', ocrResponse.status);
        console.log('Response:', JSON.stringify(ocrData, null, 2));
      } catch (error) {
        console.error('Error processing OCR:', error.message);
      }
    }
  } else {
    console.log(`Test image not found at ${testImagePath}`);
    console.log('To test with an actual image:');
    console.log('1. Place an image file at ./test-image.png');
    console.log('2. Or modify the testImagePath variable in this script');
    console.log('3. Run the script again');
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Test different prompts with DeepSeek-OCR
  console.log('3. Testing different prompts...');

  const prompts = [
    'Convert this document to markdown:',
    'Free OCR.',
    'Extract all text from this image:',
    '<image>\nOCR this image',
  ];

  if (fs.existsSync(testImagePath)) {
    for (const prompt of prompts) {
      console.log(`\nTesting prompt: "${prompt}"`);

      const base64Image = fileToBase64(testImagePath);
      if (base64Image) {
        try {
          const ocrResponse = await fetch(`${baseUrl}/api/ocr/process`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64Image,
              model: 'deepseek-ai/DeepSeek-OCR',
              prompt: prompt,
            }),
          });

          const ocrData = await ocrResponse.json();

          if (ocrData.success) {
            console.log(`✅ Success with prompt: "${prompt}"`);
            console.log(`   Output length: ${ocrData.text?.length || 0} chars`);
            console.log(`   Model used: ${ocrData.model_used}`);
          } else {
            console.log(`❌ Failed with prompt: "${prompt}"`);
            console.log(`   Error: ${ocrData.error}`);
          }
        } catch (error) {
          console.log(`❌ Error with prompt "${prompt}": ${error.message}`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Test with different models
  console.log('4. Testing with different models...');

  const models = [
    'deepseek-ai/DeepSeek-OCR',
    'Salesforce/blip-image-captioning-base',
  ];

  for (const model of models) {
    console.log(`\nTesting model: ${model}`);

    // You would need actual image data for this test
    if (fs.existsSync(testImagePath)) {
      const base64Image = fileToBase64(testImagePath);
      if (base64Image) {
        try {
          const ocrResponse = await fetch(`${baseUrl}/api/ocr/process`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64Image,
              model: model,
              prompt: model.includes('DeepSeek') ? 'Convert to markdown:' : 'Extract text:',
            }),
          });

          const ocrData = await ocrResponse.json();

          if (ocrData.success) {
            console.log(`✅ Model ${model} works!`);
            console.log(`   Output: ${ocrData.text?.substring(0, 100)}...`);
          } else {
            console.log(`❌ Model ${model} failed: ${ocrData.error}`);
          }
        } catch (error) {
          console.log(`❌ Error with ${model}: ${error.message}`);
        }
      }
    } else {
      console.log(`- To test ${model}, provide actual image data`);
      console.log(`- Endpoint: POST /api/ocr/process`);
      console.log(`- Body: { "image": "base64-data", "model": "${model}", "prompt": "..." }`);
    }
  }

  console.log('\n✅ OCR API integration test completed!');
  console.log('\nTo test with your own image:');
  console.log('1. Place an image at ./test-image.png');
  console.log('2. Or modify the testImagePath in this script');
  console.log('3. Run: node test-ocr.js');
  console.log('\nFor API usage examples, visit: http://localhost:3000/api/ocr/process');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    return response.ok;
  } catch {
    console.log('❌ Server not running on http://localhost:3000');
    console.log('Please start the server with: npm run dev');
    return false;
  }
}

// Main execution
async function main() {
  console.log('DeepSeek OCR Integration Test');
  console.log('=============================\n');

  const serverRunning = await checkServer();

  if (serverRunning) {
    await testOCR();
  } else {
    console.log('\nTo run this test:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Run this script: node test-ocr.js');
  }
}

// Run the test
main().catch(console.error);