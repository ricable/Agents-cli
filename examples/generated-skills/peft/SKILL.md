---
name: peft
version: 0.0.0
description: "🤗 PEFT: State-of-the-art Parameter-Efficient Fine-Tuning.. Use this skill whenever the user works with peft or tasks related to 🤗 peft: state-of-the-art parameter-efficient fine-tuning — even if they don't mention "peft" by name."
ingredients:
  - huggingface/peft
tags:
  - adapter
  - diffusion
  - fine-tuning
  - llm
  - lora
  - parameter-efficient-learning
  - peft
  - python
  - pytorch
  - transformers
  - cli
# homepage: https://huggingface.co/docs/peft
# license: Apache-2.0
---

# peft

🤗 PEFT: State-of-the-art Parameter-Efficient Fine-Tuning.

**Source**: https://huggingface.co/docs/peft

## Overview

peft provides 🤗 peft: state-of-the-art parameter-efficient fine-tuning. Agents benefit from peft because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add huggingface/peft

# Or clone from GitHub
git clone https://github.com/huggingface/peft.git
```

## Usage

```bash
# Show help and available options
peft --help

# Check version
peft --version
```

Refer to the project documentation for detailed usage:
- https://huggingface.co/docs/peft

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add huggingface/peft

# 2. Verify installation
agents-cli run peft -- --version

# 3. Explore capabilities
agents-cli schema peft --json
```

### Piping with other tools

```bash
# Chain peft output with jq for structured processing
agents-cli run peft -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run peft -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run peft -- --help --json

# Introspect full command schema
agents-cli schema peft --json

# Dry-run before executing (safe exploration)
agents-cli run peft -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe peft --json
```

## When to Use This Tool

Use `peft` when:
- Your task involves 🤗 peft: state-of-the-art parameter-efficient fine-tuning
- A task requires peft-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what peft provides
