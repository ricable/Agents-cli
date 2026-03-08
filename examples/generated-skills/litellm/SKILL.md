---
name: litellm
version: 0.0.0
description: "Python SDK, Proxy Server (AI Gateway) to call 100+ LLM APIs in OpenAI (or native) format, with cost tracking, guardrails, loadbalancing and logging. [Bedrock, Azure, OpenAI, VertexAI, Cohere, Anthropic, Sagemaker, HuggingFace, VLLM, NVIDIA NIM]. Use this skill when working with litellm-related tasks."
ingredients:
  - BerriAI/litellm
tags:
  - ai-gateway
  - anthropic
  - azure-openai
  - bedrock
  - gateway
  - langchain
  - litellm
  - llm
  - llm-gateway
  - llmops
  - mcp-gateway
  - openai
  - openai-proxy
  - vertex-ai
  - cli
# homepage: https://docs.litellm.ai/docs/
# license: NOASSERTION
---

# litellm

Python SDK, Proxy Server (AI Gateway) to call 100+ LLM APIs in OpenAI (or native) format, with cost tracking, guardrails, loadbalancing and logging. [Bedrock, Azure, OpenAI, VertexAI, Cohere, Anthropic, Sagemaker, HuggingFace, VLLM, NVIDIA NIM]

**Source**: https://docs.litellm.ai/docs/

## Usage

```bash
# Show help
litellm --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run litellm -- --help --json

# Introspect command schema
agents-cli schema litellm --json

# Dry-run before executing
agents-cli run litellm -- <args> --dry-run
```
