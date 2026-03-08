---
name: txtai
version: 0.0.0
description: "💡 All-in-one AI framework for semantic search, LLM orchestration and language model workflows. Use this skill when working with txtai-related tasks."
ingredients:
  - neuml/txtai
tags:
  - agents
  - ai
  - ai-agents
  - embeddings
  - information-retrieval
  - language-model
  - large-language-models
  - llm
  - nlp
  - python
  - rag
  - retrieval-augmented-generation
  - search
  - search-engine
  - semantic-search
  - sentence-embeddings
  - transformers
  - txtai
  - vector-database
  - vector-search
  - cli
# homepage: https://neuml.github.io/txtai
# license: Apache-2.0
---

# txtai

💡 All-in-one AI framework for semantic search, LLM orchestration and language model workflows

**Source**: https://neuml.github.io/txtai

## Usage

```bash
# Show help
txtai --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run txtai -- --help --json

# Introspect command schema
agents-cli schema txtai --json

# Dry-run before executing
agents-cli run txtai -- <args> --dry-run
```
