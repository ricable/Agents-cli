---
name: pytorch-image-models
version: 0.0.0
description: "CLI tool: pytorch-image-models. Use this skill whenever the user works with pytorch-image-models or tasks related to cli tool: pytorch-image-models — even if they don't mention "pytorch-image-models" by name."
ingredients:
  - huggingface/pytorch-image-models
tags:
  - cli
---

# pytorch-image-models

CLI tool: pytorch-image-models

## Overview

pytorch-image-models provides cli tool: pytorch-image-models. Agents benefit from pytorch-image-models because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add huggingface/pytorch-image-models

# Or clone from GitHub
git clone https://github.com/huggingface/pytorch-image-models.git
```

## Usage

```bash
# Show help and available options
pytorch-image-models --help

# Check version
pytorch-image-models --version
```

Refer to the project documentation for detailed usage:
- https://github.com/huggingface/pytorch-image-models

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add huggingface/pytorch-image-models

# 2. Verify installation
agents-cli run pytorch-image-models -- --version

# 3. Explore capabilities
agents-cli schema pytorch-image-models --json
```

### Piping with other tools

```bash
# Chain pytorch-image-models output with jq for structured processing
agents-cli run pytorch-image-models -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run pytorch-image-models -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run pytorch-image-models -- --help --json

# Introspect full command schema
agents-cli schema pytorch-image-models --json

# Dry-run before executing (safe exploration)
agents-cli run pytorch-image-models -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe pytorch-image-models --json
```

## When to Use This Tool

Use `pytorch-image-models` when:
- Your task involves cli tool: pytorch-image-models
- A task requires pytorch-image-models-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what pytorch-image-models provides
