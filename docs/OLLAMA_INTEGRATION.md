# Ollama Cloud Integration

This document explains how to use the Ollama Cloud integration in your project.

## Overview

Ollama Cloud provides free access to powerful AI models including:
- **Text Models**: gpt-oss:20b, gpt-oss:120b, deepseek-v3.1:671b, qwen3-coder:480b, etc.
- **Vision Models**: qwen3-vl:235b, qwen3-vl:235b-instruct
- **Embedding Models**: qwen3-embedding, embeddinggemma, all-minilm

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```env
# Ollama Cloud API
OLLAMA_API_KEY=your-api-key-here
OLLAMA_BASE_URL=https://ollama.com
OLLAMA_DEFAULT_MODEL=gpt-oss:20b

# Set Ollama as default provider
AI_DEFAULT_PROVIDER=ollama
```

### 2. Get API Key

1. Go to [https://ollama.com/settings/api](https://ollama.com/settings/api)
2. Generate an API key
3. Add it to your environment variables

## Usage

### Direct Service Usage

```typescript
import { ollamaCloud } from '@/lib/ai/ollama-cloud';

// Chat completion
const response = await ollamaCloud.chat.createChat({
  model: 'gpt-oss:20b',
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(response.message.content);

// With thinking tokens
const thinkingResponse = await ollamaCloud.chat.createChat({
  model: 'deepseek-v3.1:671b',
  messages: [{ role: 'user', content: 'Solve step by step' }],
  think: true,
});

console.log('Thinking:', thinkingResponse.message.thinking);
console.log('Answer:', thinkingResponse.message.content);

// Streaming
for await (const event of ollamaCloud.chat.streamChat({
  model: 'gpt-oss:20b',
  messages: [{ role: 'user', content: 'Tell me a story' }],
})) {
  if (event.type === 'content') {
    console.log(event.content);
  }
}

// Embeddings
const embedding = await ollamaCloud.embeddings.createEmbedding({
  model: 'qwen3-embedding',
  input: 'Your text here',
});

console.log(embedding.embeddings[0]); // 1024-dimensional vector
```

### Using AI Manager (Recommended)

The AI Manager provides a unified interface for all providers:

```typescript
import { aiManager, generateText, generateTextStream } from '@/lib/ai';

// Generate text
const response = await generateText({
  prompt: 'Explain quantum computing',
  model: 'deepseek-v3.1:671b',
  temperature: 0.7,
});

// Stream text
for await (const chunk of generateTextStream({
  prompt: 'Write a poem',
  model: 'gpt-oss:20b',
})) {
  console.log(chunk.content);
}

// Generate code
const code = await aiManager.generateCode({
  prompt: 'Create a TypeScript function for bubble sort',
  model: 'qwen3-coder:480b',
  language: 'typescript',
});

// Switch providers
aiManager.setProvider('openrouter'); // or 'chutes', 'ollama'
```

### API Routes

You can also use Ollama via API routes:

```typescript
// Client-side
const response = await fetch('/api/ollama/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-oss:20b',
    messages: [{ role: 'user', content: 'Hello!' }],
    stream: false,
  }),
});

const data = await response.json();
console.log(data.content);
```

## Model Capabilities

### Text Models

| Model | Size | Thinking | Tools | Context |
|-------|------|----------|-------|---------|
| gpt-oss:20b | 20B | ✅ | ✅ | 32K |
| gpt-oss:120b | 120B | ✅ | ✅ | 32K |
| deepseek-v3.1:671b | 671B | ✅ | ✅ | 32K |
| qwen3-coder:480b | 480B | ❌ | ✅ | 262K |
| kimi-k2:1t | 1T | ❌ | ✅ | 32K |

### Vision Models

| Model | Size | Vision | Tools | Context |
|-------|------|--------|-------|---------|
| qwen3-vl:235b | 235B | ✅ | ✅ | 131K |
| qwen3-vl:235b-instruct | 235B | ✅ | ✅ | 131K |

### Embedding Models

| Model | Dimensions | Description |
|-------|------------|-------------|
| qwen3-embedding | 1024 | Highest quality |
| embeddinggemma | 384 | Balanced |
| all-minilm | 384 | Fast multilingual |

## Features

### 1. Thinking Tokens

Models like `deepseek-v3.1:671b` and `gpt-oss` support reasoning traces:

```typescript
const response = await ollamaCloud.chat.createChat({
  model: 'deepseek-v3.1:671b',
  messages: [{ role: 'user', content: 'Explain how photosynthesis works' }],
  think: true,
});

// Access the reasoning
console.log('Reasoning:', response.message.thinking);
console.log('Answer:', response.message.content);
```

### 2. Tool Calling

```typescript
const tools = [{
  type: 'function',
  function: {
    name: 'get_weather',
    description: 'Get weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string' }
      }
    }
  }
}];

const response = await ollamaCloud.chat.createChat({
  model: 'qwen3-coder:480b',
  messages: [{ role: 'user', content: 'What is the weather in Tokyo?' }],
  tools,
});

// Handle tool calls
if (response.message.tool_calls) {
  for (const toolCall of response.message.tool_calls) {
    console.log('Call:', toolCall.function.name);
    console.log('Args:', toolCall.function.arguments);
  }
}
```

### 3. Structured Outputs

```typescript
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
    email: { type: 'string', format: 'email' }
  },
  required: ['name', 'age']
};

const response = await ollamaCloud.chat.createChat({
  model: 'gpt-oss:20b',
  messages: [{ role: 'user', content: 'Extract user info from: John is 30 years old, john@example.com' }],
  format: schema,
});

const structured = JSON.parse(response.message.content);
console.log(structured); // { name: 'John', age: 30, email: 'john@example.com' }
```

### 4. Vision

```typescript
const response = await ollamaCloud.chat.createVisionChat({
  model: 'qwen3-vl:235b',
  messages: [{ role: 'user', content: 'Describe this image' }],
  images: ['data:image/jpeg;base64,/9j/4AAQ...'],
});
```

## Best Practices

1. **Choose the right model**:
   - Fast tasks: `gpt-oss:20b`
   - Complex reasoning: `deepseek-v3.1:671b`
   - Code generation: `qwen3-coder:480b`
   - Image understanding: `qwen3-vl:235b`

2. **Handle rate limits**:
   - Ollama Cloud has undocumented rate limits
   - Implement exponential backoff for retries
   - Monitor for 429 errors

3. **Use streaming for long responses**:
   - Better user experience
   - Reduces perceived latency

4. **Cache embeddings**:
   - Embeddings are deterministic
   - Cache to avoid recomputation

## Error Handling

```typescript
import { OllamaError } from '@/lib/ai/ollama-cloud/types';

try {
  const response = await ollamaCloud.chat.createChat(request);
} catch (error) {
  if (error instanceof OllamaError) {
    if (error.type === 'rate_limit') {
      // Implement backoff
    } else if (error.type === 'auth_error') {
      // Check API key
    }
  }
}
```

## Comparison with Other Providers

| Feature | Ollama Cloud | OpenRouter | Chutes AI |
|---------|--------------|------------|------------|
| Cost | FREE | Paid | Paid |
| Rate Limits | Undocumented | Defined | Defined |
| Models | 10+ | 100+ | Limited |
| Thinking | ✅ | ❌ | ❌ |
| Local Option | ✅ | ❌ | ❌ |
| Vision | ✅ | ✅ | ❌ |