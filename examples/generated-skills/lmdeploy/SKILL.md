---
name: lmdeploy
version: 0.0.0
description: "LMDeploy is a toolkit for compressing, deploying, and serving LLMs.. Use this skill whenever the user works with lmdeploy or tasks related to lmdeploy is a toolkit for compressing, deploying, and serving llms — even if they don't mention "lmdeploy" by name."
ingredients:
  - InternLM/lmdeploy
tags:
  - codellama
  - cuda-kernels
  - deepspeed
  - fastertransformer
  - internlm
  - llama
  - llama2
  - llama3
  - llm
  - llm-inference
  - turbomind
  - cli
# homepage: https://lmdeploy.readthedocs.io/en/latest
# license: Apache-2.0
---

# lmdeploy

LMDeploy is a toolkit for compressing, deploying, and serving LLMs.

**Source**: https://lmdeploy.readthedocs.io/en/latest

## Overview

lmdeploy provides lmdeploy is a toolkit for compressing, deploying, and serving llms. Agents benefit from lmdeploy because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add InternLM/lmdeploy

# Or clone from GitHub
git clone https://github.com/InternLM/lmdeploy.git
```

## Usage

```bash
# Show help and available options
lmdeploy --help

# Check version
lmdeploy --version
```

Refer to the project documentation for detailed usage:
- https://lmdeploy.readthedocs.io/en/latest

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add InternLM/lmdeploy

# 2. Verify installation
agents-cli run lmdeploy -- --version

# 3. Explore capabilities
agents-cli schema lmdeploy --json
```

### Piping with other tools

```bash
# Chain lmdeploy output with jq for structured processing
agents-cli run lmdeploy -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run lmdeploy -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run lmdeploy -- --help --json

# Introspect full command schema
agents-cli schema lmdeploy --json

# Dry-run before executing (safe exploration)
agents-cli run lmdeploy -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe lmdeploy --json
```

## When to Use This Tool

Use `lmdeploy` when:
- Your task involves lmdeploy is a toolkit for compressing, deploying, and serving llms
- A task requires lmdeploy-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what lmdeploy provides
