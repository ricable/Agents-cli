---
name: AutoGPTQ
version: 0.0.0
description: "An easy-to-use LLMs quantization package with user-friendly apis, based on GPTQ algorithm.. Use this skill whenever the user works with AutoGPTQ or tasks related to an easy-to-use llms quantization package with user-friendly apis, based on gptq algorithm — even if they don't mention "AutoGPTQ" by name."
ingredients:
  - AutoGPTQ/AutoGPTQ
tags:
  - deep-learning
  - inference
  - large-language-models
  - llms
  - nlp
  - pytorch
  - quantization
  - transformer
  - transformers
  - cli
# homepage: https://github.com/AutoGPTQ/AutoGPTQ
# license: MIT
---

# AutoGPTQ

An easy-to-use LLMs quantization package with user-friendly apis, based on GPTQ algorithm.

**Source**: https://github.com/AutoGPTQ/AutoGPTQ

## Overview

AutoGPTQ provides an easy-to-use llms quantization package with user-friendly apis, based on gptq algorithm. Agents benefit from AutoGPTQ because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add AutoGPTQ/AutoGPTQ

# Or clone from GitHub
git clone https://github.com/AutoGPTQ/AutoGPTQ.git
```

## Usage

```bash
# Show help and available options
AutoGPTQ --help

# Check version
AutoGPTQ --version
```

Refer to the project documentation for detailed usage:
- https://github.com/AutoGPTQ/AutoGPTQ

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add AutoGPTQ/AutoGPTQ

# 2. Verify installation
agents-cli run AutoGPTQ -- --version

# 3. Explore capabilities
agents-cli schema AutoGPTQ --json
```

### Piping with other tools

```bash
# Chain AutoGPTQ output with jq for structured processing
agents-cli run AutoGPTQ -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run AutoGPTQ -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run AutoGPTQ -- --help --json

# Introspect full command schema
agents-cli schema AutoGPTQ --json

# Dry-run before executing (safe exploration)
agents-cli run AutoGPTQ -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe AutoGPTQ --json
```

## When to Use This Tool

Use `AutoGPTQ` when:
- Your task involves an easy-to-use llms quantization package with user-friendly apis, based on gptq algorithm
- A task requires AutoGPTQ-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what AutoGPTQ provides
