---
name: @huggingface/inference
version: 4.13.15
description: "Typescript client for the Hugging Face Inference Providers and Inference Endpoints. Use this skill whenever the user works with @huggingface/inference or tasks related to typescript client for the hugging face inference providers and inference endpoints — even if they don't mention "@huggingface/inference" by name."
ingredients:
  - @huggingface/inference
tags:
  - ai
  - hugging face
  - hugging face typescript
  - huggingface
  - huggingface-inference-api
  - huggingface-inference-api-typescript
  - inference
  - cli
# homepage: https://github.com/huggingface/huggingface.js#readme
# license: MIT
---

# @huggingface/inference

Typescript client for the Hugging Face Inference Providers and Inference Endpoints

**Source**: https://github.com/huggingface/huggingface.js#readme

## Overview

@huggingface/inference provides typescript client for the hugging face inference providers and inference endpoints. Agents benefit from @huggingface/inference because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @huggingface/inference

# Or install directly via npm
npm install -g @huggingface/inference
```

## Usage

```bash
# Show help and available options
@huggingface/inference --help

# Check version
@huggingface/inference --version
```

Refer to the project documentation for detailed usage:
- https://github.com/huggingface/huggingface.js#readme

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @huggingface/inference

# 2. Verify installation
agents-cli run @huggingface/inference -- --version

# 3. Explore capabilities
agents-cli schema @huggingface/inference --json
```

### Piping with other tools

```bash
# Chain @huggingface/inference output with jq for structured processing
agents-cli run @huggingface/inference -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @huggingface/inference -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @huggingface/inference -- --help --json

# Introspect full command schema
agents-cli schema @huggingface/inference --json

# Dry-run before executing (safe exploration)
agents-cli run @huggingface/inference -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @huggingface/inference --json
```

## When to Use This Tool

Use `@huggingface/inference` when:
- Your task involves typescript client for the hugging face inference providers and inference endpoints
- A task requires @huggingface/inference-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @huggingface/inference provides
