# OCR Testing Guide

## Quick Start

### 1. Test the Comprehensive OCR Image

1. **Generate the test image** (optional):
   ```bash
   npm install puppeteer
   node create-ocr-test-image.js
   ```

2. **Or manually create**:
   - Open http://localhost:3000/ocr-test-sample.html
   - Take a screenshot or print to PDF
   - Save as `ocr-test-comprehensive.png`

3. **Test with OCR**:
   - Go to http://localhost:3000/test-ocr
   - Upload the test image
   - Check extraction accuracy

### 2. Expected OCR Output

The test image should extract:
- ✅ Header text and metadata
- ✅ Two-column layout content
- ✅ Complete financial table with calculations
- ✅ Mathematical formulas
- ✅ Receipt details with totals
- ✅ Mixed languages (4 languages)
- ✅ Special characters and symbols
- ✅ Low contrast text (may fail - this is expected!)
- ✅ Handwritten notes

## What to Look For

### ✅ Success Indicators:
- All table data extracted correctly
- Numbers and calculations preserved
- Mixed languages readable
- Special characters maintained

### ⚠️ Expected Failures:
- Low contrast text (intentionally difficult)
- Barcode/QR code (requires specialized readers)
- Perfect signature replication

### 📊 Calculate Accuracy:
```
Accuracy = (Correctly extracted characters / Total characters) × 100
```

## Advanced Testing

### 1. Rate Limit Testing
Run multiple requests quickly to test free tier limits:
```javascript
// Quick test script
for (let i = 0; i < 40; i++) {
  fetch('/api/ocr/process', { /* your image */ })
    .then(r => r.json())
    .then(r => console.log(`Request ${i}:`, r.success ? '✅' : '❌'));
}
```

### 2. Performance Testing
Monitor:
- Processing time per image
- Memory usage
- Queue delays

### 3. Edge Cases
Test with:
- Very large images (>10MB)
- Unusual formats (TIFF, BMP)
- Rotated images
- Damaged/corrupted files

## Troubleshooting

### "Rate Limit Exceeded"
- Wait 1 minute between batches
- Implement request queuing
- Consider PRO tier for production

### "Model Loading" Errors
- Wait 30 seconds for cold start
- Try again after initial load
- Cache successful results

### "Not Found" Errors
- Check model name spelling
- Verify API key validity
- Try alternative models

## Benchmarking

Compare DeepSeek-OCR with:
1. **Tesseract** (open-source)
2. **Google Vision AI**
3. **AWS Textract**
4. **Azure Form Recognizer**

Metrics to track:
- Accuracy percentage
- Processing speed
- Cost per 1000 pages
- Language support

## Production Considerations

### Do's:
- ✅ Implement caching
- ✅ Use retry logic
- ✅ Monitor rate limits
- ✅ Optimize image sizes

### Don'ts:
- ❌ Don't send original resolution images
- ❌ Don't ignore rate limits
- ❌ Don't rely on 100% uptime
- ❌ Don't process without backup

## Free Tier Optimization

### Reduce Costs:
- Pre-process images before sending
- Batch similar documents
- Use efficient image formats
- Cache aggressively

### Performance Tips:
```javascript
// Example: Client-side rate limiting
let lastRequest = 0;
const MIN_INTERVAL = 2000; // 2 seconds

async function ocrWithLimit(image) {
  const now = Date.now();
  const elapsed = now - lastRequest;

  if (elapsed < MIN_INTERVAL) {
    await new Promise(resolve =>
      setTimeout(resolve, MIN_INTERVAL - elapsed)
    );
  }

  lastRequest = Date.now();
  // Make OCR request
}
```

## Resources

- [HuggingFace Pricing](https://huggingface.co/pricing)
- [DeepSeek-OCR Model](https://huggingface.co/deepseek-ai/DeepSeek-OCR)
- [Free Tier Limits](./HUGGINGFACE_LIMITS.md)
- [Test Image Generator](./create-ocr-test-image.js)