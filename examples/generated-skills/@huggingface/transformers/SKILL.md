---
name: @huggingface/transformers
version: 3.8.1
description: "State-of-the-art Machine Learning for the web. Run 🤗 Transformers directly in your browser, with no need for a server!. Use this skill whenever the user works with @huggingface/transformers or tasks related to state-of-the-art machine learning for the web. run 🤗 transformers directly in your browser, with no need for a server! — even if they don't mention "@huggingface/transformers" by name."
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

## Overview

@huggingface/transformers provides state-of-the-art machine learning for the web. run 🤗 transformers directly in your browser, with no need for a server!. Agents benefit from @huggingface/transformers because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @huggingface/transformers

# Or install directly via npm
npm install -g @huggingface/transformers
```

## Usage

```bash
# Show help and available options
@huggingface/transformers --help

# Check version
@huggingface/transformers --version
```

Refer to the project documentation for detailed usage:
- https://github.com/huggingface/transformers.js#readme

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @huggingface/transformers

# 2. Verify installation
agents-cli run @huggingface/transformers -- --version

# 3. Explore capabilities
agents-cli schema @huggingface/transformers --json
```

### Piping with other tools

```bash
# Chain @huggingface/transformers output with jq for structured processing
agents-cli run @huggingface/transformers -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @huggingface/transformers -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @huggingface/transformers -- --help --json

# Introspect full command schema
agents-cli schema @huggingface/transformers --json

# Dry-run before executing (safe exploration)
agents-cli run @huggingface/transformers -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @huggingface/transformers --json
```

## When to Use This Tool

Use `@huggingface/transformers` when:
- Your task involves state-of-the-art machine learning for the web. run 🤗 transformers directly in your browser, with no need for a server!
- A task requires @huggingface/transformers-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @huggingface/transformers provides
