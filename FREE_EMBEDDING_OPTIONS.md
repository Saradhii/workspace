# Free Embedding Models Options

## Summary
I've successfully implemented a Hugging Face provider for free embeddings and tested various options. Here's what's available:

## 1. **Hugging Face Inference API** ✅ (Implemented)

### Free Tier Details:
- **Free requests**: ~30,000 requests/month
- **Rate limit**: ~1 request/second
- **No cost**: Completely free for embedding models

### Available Models:
1. **sentence-transformers/all-MiniLM-L6-v2** - 384 dimensions
   - Fast and efficient English model
   - Good for general purpose embeddings

2. **BAAI/bge-small-en-v1.5** - 384 dimensions
   - High quality English model from BAAI
   - Better performance than MiniLM

3. **sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2** - 384 dimensions
   - Supports 50+ languages
   - Good for multilingual applications

4. **sentence-transformers/all-mpnet-base-v2** - 768 dimensions
   - Higher quality, larger embeddings
   - Better for semantic search

5. **mixedbread-ai/mxbai-embed-large-v1** - 1024 dimensions
   - Large model with highest performance

### Setup:
1. Get API key from https://huggingface.co/settings/tokens
2. Add to .env: `HUGGINGFACE_API_KEY=hf_your_token_here`
3. Restart development server
4. Test at: `http://localhost:3000/test-hf-embeddings`

## 2. **Google AI Studio (Gemini)**

### Free Tier:
- **15 requests/minute**
- **1,500 requests/day**
- **text-embedding-004** model
- **768 dimensions**

### Setup:
1. Get API key from https://aistudio.google.com/app/apikey
2. Use model: `models/text-embedding-004`

## 3. **Local Ollama** (Most Private)

### Models:
- `qwen3-embedding` - 1024 dimensions
- `embeddinggemma` - 384 dimensions
- `all-minilm` - 384 dimensions

### Setup:
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull embedding models
ollama pull qwen3-embedding
ollama pull embeddinggemma
ollama pull all-minilm

# Run locally
ollama serve
```

## 4. **Browser/Client-side Options**

### Transformers.js
- Run embeddings directly in browser
- No API costs
- Completely offline
- Lower performance than server models

## Implementation Status

✅ **Completed:**
- Hugging Face provider implementation
- Test page at `/test-hf-embeddings`
- Provider registry integration
- Free tier information display

⚠️ **Note:**
- Hugging Face requires API key setup to work
- The placeholder key in .env needs to be replaced with a real key

## Recommendation

For your RAG feature, I recommend:

1. **Start with Hugging Face** - Best free tier with multiple models
2. **Add local Ollama** as fallback for privacy
3. **Consider Google Gemini** for additional capacity

The Hugging Face integration is ready to use once you add a real API key. The test page at `http://localhost:3000/test-hf-embeddings` will show detailed results and allow testing of similarity calculations.