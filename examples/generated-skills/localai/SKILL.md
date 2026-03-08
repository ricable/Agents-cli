---
name: LocalAI
version: 0.0.0
description: ":robot: The free, Open Source alternative to OpenAI, Claude and others. Self-hosted and local-first. Drop-in replacement,  running on consumer-grade hardware. No GPU required. Runs gguf, transformers, diffusers and many more. Features: Generate Text, MCP, Audio, Video, Images, Voice Cloning, Distributed, P2P and decentralized inference. Use this skill when working with LocalAI-related tasks."
ingredients:
  - mudler/LocalAI
tags:
  - ai
  - api
  - audio-generation
  - decentralized
  - distributed
  - gemma
  - image-generation
  - libp2p
  - llama
  - llm
  - mamba
  - mcp
  - mistral
  - musicgen
  - object-detection
  - rerank
  - rwkv
  - stable-diffusion
  - text-generation
  - tts
  - cli
# homepage: https://localai.io
# license: MIT
---

# LocalAI

:robot: The free, Open Source alternative to OpenAI, Claude and others. Self-hosted and local-first. Drop-in replacement,  running on consumer-grade hardware. No GPU required. Runs gguf, transformers, diffusers and many more. Features: Generate Text, MCP, Audio, Video, Images, Voice Cloning, Distributed, P2P and decentralized inference

**Source**: https://localai.io

## Usage

```bash
# Show help
LocalAI --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run LocalAI -- --help --json

# Introspect command schema
agents-cli schema LocalAI --json

# Dry-run before executing
agents-cli run LocalAI -- <args> --dry-run
```
