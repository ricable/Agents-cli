---
name: @huggingface/transformers
version: 3.8.1
description: "State-of-the-art Machine Learning for the web. Run 🤗 Transformers directly in your browser, with no need for a server!. Use this skill when working with @huggingface/transformers-related tasks."
ingredients:
  - @huggingface/transformers
tags:
  - transformers
  - transformers.js
  - huggingface
  - hugging face
  - machine learning
  - deep learning
  - artificial intelligence
  - AI
  - ML
  - cli
# homepage: https://github.com/huggingface/transformers.js#readme
# license: Apache-2.0
---

# @huggingface/transformers

State-of-the-art Machine Learning for the web. Run 🤗 Transformers directly in your browser, with no need for a server!

**Source**: https://github.com/huggingface/transformers.js#readme

## Usage

```bash
# Show help
@huggingface/transformers --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @huggingface/transformers -- --help --json

# Introspect command schema
agents-cli schema @huggingface/transformers --json

# Dry-run before executing
agents-cli run @huggingface/transformers -- <args> --dry-run
```
