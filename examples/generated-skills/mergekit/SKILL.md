---
name: mergekit
version: 0.0.0
description: "Tools for merging pretrained large language models.. Use this skill whenever the user works with mergekit or tasks related to tools for merging pretrained large language models — even if they don't mention "mergekit" by name."
ingredients:
  - arcee-ai/mergekit
tags:
  - llama
  - llm
  - model-merging
  - cli
# homepage: https://github.com/arcee-ai/mergekit
# license: LGPL-3.0
---

# mergekit

Tools for merging pretrained large language models.

**Source**: https://github.com/arcee-ai/mergekit

## Overview

mergekit provides tools for merging pretrained large language models. Agents benefit from mergekit because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add arcee-ai/mergekit

# Or clone from GitHub
git clone https://github.com/arcee-ai/mergekit.git
```

## Usage

```bash
# Show help and available options
mergekit --help

# Check version
mergekit --version
```

Refer to the project documentation for detailed usage:
- https://github.com/arcee-ai/mergekit

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add arcee-ai/mergekit

# 2. Verify installation
agents-cli run mergekit -- --version

# 3. Explore capabilities
agents-cli schema mergekit --json
```

### Piping with other tools

```bash
# Chain mergekit output with jq for structured processing
agents-cli run mergekit -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run mergekit -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run mergekit -- --help --json

# Introspect full command schema
agents-cli schema mergekit --json

# Dry-run before executing (safe exploration)
agents-cli run mergekit -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe mergekit --json
```

## When to Use This Tool

Use `mergekit` when:
- Your task involves tools for merging pretrained large language models
- A task requires mergekit-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what mergekit provides
