#!/bin/bash

# Test script to check thinking tokens support across different providers and models
# Make sure the dev server is running on localhost:3001

echo "=== Testing Thinking Tokens Across Providers ==="
echo ""
echo "Note: Make sure the dev server is running on localhost:3001"
echo ""

# Function to test a streaming API
test_stream_api() {
    local test_name="$1"
    local url="$2"
    local payload="$3"

    echo "=========================================="
    echo "Test: $test_name"
    echo "URL: $url"
    echo "Payload: $payload"
    echo "=========================================="
    echo ""

    # Make the request and capture the first few chunks
    response=$(curl -s -X POST "$url" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        --no-buffer | head -50)

    echo "Response (first 50 lines):"
    echo "$response"
    echo ""
    echo "----------------------------------------"
    echo ""
}

# Test 1: Chutes + Tongyi-DeepResearch-30B
test_stream_api \
    "Chutes AI + Tongyi-DeepResearch-30B" \
    "http://localhost:3001/api/texts/generate-stream" \
    '{
        "model": "chutes:Alibaba-NLP/Tongyi-DeepResearch-30B-A3B",
        "messages": [{"role": "user", "content": "Think step by step: What is 15% of 240?"}],
        "stream": true,
        "max_tokens": 500,
        "temperature": 0.7
    }'

# Test 2: Chutes + GPT-OSS-20b
test_stream_api \
    "Chutes AI + GPT-OSS-20b" \
    "http://localhost:3001/api/texts/generate-stream" \
    '{
        "model": "chutes:openai/gpt-oss-20b",
        "messages": [{"role": "user", "content": "Think step by step: What is 15% of 240?"}],
        "stream": true,
        "max_tokens": 500,
        "temperature": 0.7
    }'

# Test 3: OpenRouter + Llama-3.3-70b
test_stream_api \
    "OpenRouter + Llama-3.3-70b-instruct" \
    "http://localhost:3001/api/texts/generate-stream" \
    '{
        "model": "meta-llama/llama-3.3-70b-instruct:free",
        "messages": [{"role": "user", "content": "Think step by step: What is 15% of 240?"}],
        "stream": true,
        "max_tokens": 500,
        "temperature": 0.7
    }'

# Test 4: Ollama Chat API with think=true
test_stream_api \
    "Ollama + GPT-OSS with think=true" \
    "http://localhost:3001/api/ollama/chat" \
    '{
        "model": "gpt-oss:20b",
        "messages": [{"role": "user", "content": "Think step by step: What is 15% of 240?"}],
        "stream": true,
        "think": true
    }'

# Test 5: Chutes + Gemma (non-reasoning model as control)
test_stream_api \
    "Chutes AI + Gemma-3-4B (Control - No Reasoning)" \
    "http://localhost:3001/api/texts/generate-stream" \
    '{
        "model": "chutes:unsloth/gemma-3-4b-it",
        "messages": [{"role": "user", "content": "What is 15% of 240?"}],
        "stream": true,
        "max_tokens": 500,
        "temperature": 0.7
    }'

echo "=== Testing Complete ==="
echo ""
echo "Look for:"
echo "- 'reasoning' field in delta"
echo "- 'thinking' field in delta"
echo "- '<thinking>' tags in content"
echo "- Special parameters like 'think': true"
echo "- Different response structures"