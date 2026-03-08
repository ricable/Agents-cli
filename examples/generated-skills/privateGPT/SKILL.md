---
name: private-gpt
version: 0.0.0
description: "Interact with your documents using the power of GPT, 100% privately, no data leaks. Use this skill whenever the user works with private-gpt or tasks related to interact with your documents using the power of gpt, 100% privately, no data leaks — even if they don't mention "private-gpt" by name."
ingredients:
  - zylon-ai/private-gpt
tags:
  - cli
# homepage: https://privategpt.dev
# license: Apache-2.0
---

# private-gpt

Interact with your documents using the power of GPT, 100% privately, no data leaks

**Source**: https://privategpt.dev

## Overview

private-gpt provides interact with your documents using the power of gpt, 100% privately, no data leaks. Agents benefit from private-gpt because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add zylon-ai/private-gpt

# Or clone from GitHub
git clone https://github.com/zylon-ai/private-gpt.git
```

## Usage

```bash
# Show help and available options
private-gpt --help

# Check version
private-gpt --version
```

Refer to the project documentation for detailed usage:
- https://privategpt.dev

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add zylon-ai/private-gpt

# 2. Verify installation
agents-cli run private-gpt -- --version

# 3. Explore capabilities
agents-cli schema private-gpt --json
```

### Piping with other tools

```bash
# Chain private-gpt output with jq for structured processing
agents-cli run private-gpt -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run private-gpt -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run private-gpt -- --help --json

# Introspect full command schema
agents-cli schema private-gpt --json

# Dry-run before executing (safe exploration)
agents-cli run private-gpt -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe private-gpt --json
```

## When to Use This Tool

Use `private-gpt` when:
- Your task involves interact with your documents using the power of gpt, 100% privately, no data leaks
- A task requires private-gpt-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what private-gpt provides
