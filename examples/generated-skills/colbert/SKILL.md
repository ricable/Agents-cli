---
name: ColBERT
version: 0.0.0
description: "CLI tool: ColBERT. Use this skill whenever the user works with ColBERT or tasks related to cli tool: colbert — even if they don't mention "ColBERT" by name."
ingredients:
  - stanford-futuredata/ColBERT
tags:
  - cli
---

# ColBERT

CLI tool: ColBERT

## Overview

ColBERT provides cli tool: colbert. Agents benefit from ColBERT because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add stanford-futuredata/ColBERT

# Or clone from GitHub
git clone https://github.com/stanford-futuredata/ColBERT.git
```

## Usage

```bash
# Show help and available options
ColBERT --help

# Check version
ColBERT --version
```

Refer to the project documentation for detailed usage:
- https://github.com/stanford-futuredata/ColBERT

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add stanford-futuredata/ColBERT

# 2. Verify installation
agents-cli run ColBERT -- --version

# 3. Explore capabilities
agents-cli schema ColBERT --json
```

### Piping with other tools

```bash
# Chain ColBERT output with jq for structured processing
agents-cli run ColBERT -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run ColBERT -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run ColBERT -- --help --json

# Introspect full command schema
agents-cli schema ColBERT --json

# Dry-run before executing (safe exploration)
agents-cli run ColBERT -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe ColBERT --json
```

## When to Use This Tool

Use `ColBERT` when:
- Your task involves cli tool: colbert
- A task requires ColBERT-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what ColBERT provides
