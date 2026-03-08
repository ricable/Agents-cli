---
name: fastText
version: 0.0.0
description: "CLI tool: fastText. Use this skill whenever the user works with fastText or tasks related to cli tool: fasttext — even if they don't mention "fastText" by name."
ingredients:
  - facebookresearch/fastText
tags:
  - cli
---

# fastText

CLI tool: fastText

## Overview

fastText provides cli tool: fasttext. Agents benefit from fastText because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add facebookresearch/fastText

# Or clone from GitHub
git clone https://github.com/facebookresearch/fastText.git
```

## Usage

```bash
# Show help and available options
fastText --help

# Check version
fastText --version
```

Refer to the project documentation for detailed usage:
- https://github.com/facebookresearch/fastText

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add facebookresearch/fastText

# 2. Verify installation
agents-cli run fastText -- --version

# 3. Explore capabilities
agents-cli schema fastText --json
```

### Piping with other tools

```bash
# Chain fastText output with jq for structured processing
agents-cli run fastText -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run fastText -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run fastText -- --help --json

# Introspect full command schema
agents-cli schema fastText --json

# Dry-run before executing (safe exploration)
agents-cli run fastText -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe fastText --json
```

## When to Use This Tool

Use `fastText` when:
- Your task involves cli tool: fasttext
- A task requires fastText-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what fastText provides
