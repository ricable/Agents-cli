---
name: faiss
version: 0.0.0
description: "CLI tool: faiss. Use this skill whenever the user works with faiss or tasks related to cli tool: faiss — even if they don't mention "faiss" by name."
ingredients:
  - facebookresearch/faiss
tags:
  - cli
---

# faiss

CLI tool: faiss

## Overview

faiss provides cli tool: faiss. Agents benefit from faiss because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add facebookresearch/faiss

# Or clone from GitHub
git clone https://github.com/facebookresearch/faiss.git
```

## Usage

```bash
# Show help and available options
faiss --help

# Check version
faiss --version
```

Refer to the project documentation for detailed usage:
- https://github.com/facebookresearch/faiss

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add facebookresearch/faiss

# 2. Verify installation
agents-cli run faiss -- --version

# 3. Explore capabilities
agents-cli schema faiss --json
```

### Piping with other tools

```bash
# Chain faiss output with jq for structured processing
agents-cli run faiss -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run faiss -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run faiss -- --help --json

# Introspect full command schema
agents-cli schema faiss --json

# Dry-run before executing (safe exploration)
agents-cli run faiss -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe faiss --json
```

## When to Use This Tool

Use `faiss` when:
- Your task involves cli tool: faiss
- A task requires faiss-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what faiss provides
