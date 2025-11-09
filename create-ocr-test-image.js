#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function createOCRTestImage() {
  console.log('Creating comprehensive OCR test image...\n');

  const browser = await puppeteer.launch({
    headless: true
  });

  try {
    const page = await browser.newPage();

    // Set viewport to A4 size
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2 // For higher quality
    });

    // Load the HTML file
    const htmlPath = path.join(__dirname, 'public', 'ocr-test-sample.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    await page.setContent(htmlContent);

    // Wait for content to load
    await page.waitForTimeout(1000);

    // Capture as PNG
    const screenshotPath = path.join(__dirname, 'public', 'ocr-test-comprehensive.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      type: 'png',
      quality: 100
    });

    console.log('✅ OCR test image created successfully!');
    console.log(`📍 Location: ${screenshotPath}`);
    console.log('📄 You can now use this image to test OCR capabilities');

    // Also create a PDF version
    const pdfPath = path.join(__dirname, 'public', 'ocr-test-comprehensive.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true
    });

    console.log('📄 PDF version also created');
    console.log(`📍 Location: ${pdfPath}`);

    console.log('\n📋 Test Document Includes:');
    console.log('  • Tables with merged cells');
    console.log('  • Mathematical formulas');
    console.log('  • Multiple font sizes and styles');
    console.log('  • Mixed languages (English, German, French, Spanish)');
    console.log('  • Receipt with calculations');
    console.log('  • Low contrast text');
    line.log('  • Handwritten note simulation');
    console.log('  • Special characters and symbols');
    console.log('  • Barcodes and QR codes');

    console.log('\n🚀 To test with your OCR API:');
    console.log('1. Visit http://localhost:3000/test-ocr');
    console.log('2. Upload the image: /ocr-test-comprehensive.png');
    console.log('3. Check the extracted text against the expected output');

  } catch (error) {
    console.error('❌ Error creating OCR test image:', error);
    console.log('\n💡 Alternative: You can manually');
    console.log('  1. Open /public/ocr-test-sample.html in browser');
    console.log('  2. Take a screenshot or print to PDF');
    console.log('  3. Use that for OCR testing');
  } finally {
    await browser.close();
  }
}

// Check if puppeteer is installed
try {
  require('puppeteer');
  createOCRTestImage();
} catch (error) {
  console.log('⚠️  Puppeteer not installed');
  console.log('\n💡 To install puppeteer, run:');
  console.log('   npm install puppeteer');
  console.log('\nOr manually create the test image:');
  console.log('1. Open http://localhost:3000/ocr-test-sample.html');
  console.log('2. Take a screenshot');
  console.log('3. Save as ocr-test-comprehensive.png');
}