---
name: ragflow
version: 0.0.0
description: "RAGFlow is a leading open-source Retrieval-Augmented Generation (RAG) engine that fuses cutting-edge RAG with Agent capabilities to create a superior context layer for LLMs. Use this skill when working with ragflow-related tasks."
ingredients:
  - infiniflow/ragflow
tags:
  - agent
  - agentic
  - agentic-ai
  - agentic-workflow
  - ai
  - ai-search
  - context-engineering
  - context-retrieval
  - deep-research
  - deepseek
  - deepseek-r1
  - document-parser
  - document-understanding
  - graphrag
  - llm
  - mcp
  - ollama
  - openai
  - rag
  - retrieval-augmented-generation
  - cli
# homepage: https://ragflow.io
# license: Apache-2.0
---

# ragflow

RAGFlow is a leading open-source Retrieval-Augmented Generation (RAG) engine that fuses cutting-edge RAG with Agent capabilities to create a superior context layer for LLMs

**Source**: https://ragflow.io

## Usage

```bash
# Show help
ragflow --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run ragflow -- --help --json

# Introspect command schema
agents-cli schema ragflow --json

# Dry-run before executing
agents-cli run ragflow -- <args> --dry-run
```
