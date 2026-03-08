---
name: sentence-transformers
version: 0.0.0
description: "CLI tool: sentence-transformers. Use this skill whenever the user works with sentence-transformers or tasks related to cli tool: sentence-transformers — even if they don't mention "sentence-transformers" by name."
ingredients:
  - UKPLab/sentence-transformers
tags:
  - cli
---

# sentence-transformers

CLI tool: sentence-transformers

## Overview

sentence-transformers provides cli tool: sentence-transformers. Agents benefit from sentence-transformers because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add UKPLab/sentence-transformers

# Or clone from GitHub
git clone https://github.com/UKPLab/sentence-transformers.git
```

## Usage

```bash
# Show help and available options
sentence-transformers --help

# Check version
sentence-transformers --version
```

Refer to the project documentation for detailed usage:
- https://github.com/UKPLab/sentence-transformers

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add UKPLab/sentence-transformers

# 2. Verify installation
agents-cli run sentence-transformers -- --version

# 3. Explore capabilities
agents-cli schema sentence-transformers --json
```

### Piping with other tools

```bash
# Chain sentence-transformers output with jq for structured processing
agents-cli run sentence-transformers -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run sentence-transformers -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run sentence-transformers -- --help --json

# Introspect full command schema
agents-cli schema sentence-transformers --json

# Dry-run before executing (safe exploration)
agents-cli run sentence-transformers -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe sentence-transformers --json
```

## When to Use This Tool

Use `sentence-transformers` when:
- Your task involves cli tool: sentence-transformers
- A task requires sentence-transformers-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what sentence-transformers provides
