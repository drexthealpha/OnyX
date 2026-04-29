---
name: onyx-edge-inference
description: How to use Google AI Edge LiteRT on-device models. Model download, .tflite format, inference API, Gemma4 setup, when edge is faster than cloud, battery vs accuracy tradeoffs.
origin: ONYX
---

# ONYX Edge Inference

The edge inference system provides on-device AI capabilities through Google AI Edge LiteRT. This skill covers how to set up and use edge models for offline or privacy-sensitive computing.

## What LiteRT Is

LiteRT (formerly TensorFlow Lite) is an on-device inference runtime. It runs .tflite models directly on device — no network calls, no cloud dependency. ONYX uses LiteRT as the primary offline compute backend.

Benefits:

- Zero network latency
- Complete privacy (data never leaves device)
- Works offline
- No API costs

## Model Download and Placement

Download .tflite models to the ./models directory:

```bash
# Gemma4 2B INT4 (recommended for general use)
curl -L https://huggingface.co/google/gemma-2b-tflite/resolve/main/gemma2b_q4.tflite \
  -o ./models/gemma2b_q4.tflite

# Gemma4 7B INT4 (higher quality, more RAM)
curl -L https://huggingface.co/google/gemma-2b-tflite/resolve/main/gemma2b_q4.tflite \
  -o ./models/gemma2b_q4.tflite

# Verify placement
ls -la ./models/
# -rw-r--r-- 1.4G gemma2b_q4.tflite
```

Other useful models:

- mobilenet_v3_slim.tflite — Image classification
- bert_qa.tflite — Question answering  
- whisper_tiny.tflite — Speech-to-text

## Inference API

Use the inference API through the compute layer:

```typescript
import { inferEdge } from '@onyx/nomad/fallback/compute'

const result = await inferEdge({
  model: './models/gemma2b_q4.tflite',
  prompt: 'Summarize the key risks of DeFi yield farming:',
  maxTokens: 200,
  temperature: 0.7,
})

// Returns:
// {
//   text: 'Key risks include: impermanent loss, smart contract bugs...',
//   tokensGenerated: 142,
//   latencyMs: 180,
//   model: './models/gemma2b_q4.tflite'
// }
```

The API returns the generated text, token count, and latency for monitoring.

## Gemma4 Setup Specifics

Gemma4 is the primary edge model for ONYX:

- **Format**: .tflite with MediaPipe LLM Inference API
- **Quantization**: INT4 (4-bit) for speed/size balance
- **RAM requirement**: ~2GB available for Gemma4 2B INT4
- **Context window**: 8192 tokens

Performance on various hardware:

| Hardware | Tokens/Second (CPU) | Tokens/Second (GPU) |
|---------|---------------------|---------------------|
| M2 MacBook | ~25 | ~60 |
| M1 MacBook | ~18 | ~40 |
| Desktop (RTX 3080) | ~35 | ~80 |
| Mobile (recent) | ~8 | ~15 |

## When Edge Is Faster Than Cloud

Edge inference beats cloud in specific scenarios:

1. **Latency**: Edge ~100-200ms vs cloud ~500-2000ms for first token
2. **Offline**: Cloud requires connectivity; edge works anywhere
3. **Privacy**: Sensitive queries never leave the device
4. **High-frequency simple tasks**: Classification, summarization, Q&A

Use cloud for complex reasoning. Use edge for quick follow-ups and simple queries.

## Battery vs Accuracy Tradeoffs

| Model | Size | Accuracy | RAM Usage | Battery Impact |
|-------|------|----------|----------|----------------|
| Gemma4 2B INT4 | 1.4GB | Good | ~2GB | Low |
| Gemma4 2B FP16 | 4GB | Better | ~4GB | Medium |
| Gemma4 7B INT4 | 4.5GB | Best | ~6GB | High |

For mobile use, the 2B INT4 model balances quality and battery life.

## GPU Delegate Configuration

Enable GPU acceleration for 2-3x speedup:

```typescript
const result = await inferEdge({
  model: './models/gemma2b_q4.tflite',
  prompt: 'Explain zk-SNARKs simply:',
  maxTokens: 150,
  config: {
    delegate: 'gpu',  // 'cpu' | 'gpu' | 'nnapi' (Android)
    numThreads: 4,
  },
})
```

GPU delegate:

- **macOS**: Uses Metal
- **Linux**: Uses CUDA
- **Android**: Uses NNAPI

## When to Prefer Cloud Over Edge

Use cloud models (Sonnet/Opus) when:

- Complex multi-step reasoning required
- Long context (>4096 tokens)
- Code generation (edge models weaker here)
- Access to up-to-date information

Use edge as fallback or quick-response system:

1. First response from cloud during research
2. Follow-up clarification from edge
3. Offline mode questions

## Integration with Nomad

The getAvailableBackend() function auto-detects available backends:

```typescript
import { getAvailableBackend } from '@onyx/nomad'

const backend = await getAvailableBackend()

// Returns:
// { type: 'edge', model: './models/gemma2b_q4.tflite' }
// OR: { type: 'local-ollama', model: 'llama2' }
// OR: { type: 'local-lmstudio', model: 'gemma-2b' }
```

Priority: edge → ollama → lmstudio

## Complete Setup Example

Setting up edge inference for a new machine:

```bash
# 1. Create models directory
mkdir -p ./models

# 2. Download Gemma4 2B
curl -L https://huggingface.co/google/gemma-2b-tflite/resolve/main/gemma2b_q4.tflite \
  -o ./models/gemma2b_q4.tflite

# 3. Test inference
bun -e "
import { inferEdge } from '@onyx/nomad/fallback/compute'
const r = await inferEdge({ model: './models/gemma2b_q4.tflite', prompt: 'Hi', maxTokens: 10 })
console.log(r.text)
"
```

Output: "Hello! I'm here to help..."

## No Additional Environment Variables

Edge inference requires no API keys — models run locally. The only requirement is having .tflite files in the ./models directory.