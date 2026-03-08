---
name: text-generation-inference
version: 0.0.0
description: "Large Language Model Text Generation Inference. Use this skill whenever the user works with text-generation-inference or tasks related to large language model text generation inference — even if they don't mention "text-generation-inference" by name."
ingredients:
  - huggingface/text-generation-inference
tags:
  - bloom
  - deep-learning
  - falcon
  - gpt
  - inference
  - nlp
  - pytorch
  - starcoder
  - transformer
  - cli
# homepage: http://hf.co/docs/text-generation-inference
# license: Apache-2.0
---

# text-generation-inference

Large Language Model Text Generation Inference

**Source**: http://hf.co/docs/text-generation-inference

## Overview

text-generation-inference provides large language model text generation inference. Agents benefit from text-generation-inference because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add huggingface/text-generation-inference

# Or clone from GitHub
git clone https://github.com/huggingface/text-generation-inference.git
```

## Usage

```bash
# Show help and available options
text-generation-inference --help

# Check version
text-generation-inference --version
```

Refer to the project documentation for detailed usage:
- http://hf.co/docs/text-generation-inference

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add huggingface/text-generation-inference

# 2. Verify installation
agents-cli run text-generation-inference -- --version

# 3. Explore capabilities
agents-cli schema text-generation-inference --json
```

### Piping with other tools

```bash
# Chain text-generation-inference output with jq for structured processing
agents-cli run text-generation-inference -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run text-generation-inference -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run text-generation-inference -- --help --json

# Introspect full command schema
agents-cli schema text-generation-inference --json

# Dry-run before executing (safe exploration)
agents-cli run text-generation-inference -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe text-generation-inference --json
```

## When to Use This Tool

Use `text-generation-inference` when:
- Your task involves large language model text generation inference
- A task requires text-generation-inference-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what text-generation-inference provides
