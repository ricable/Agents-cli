---
name: parler-tts
version: 0.0.0
description: "CLI tool: parler-tts. Use this skill whenever the user works with parler-tts or tasks related to cli tool: parler-tts — even if they don't mention "parler-tts" by name."
ingredients:
  - huggingface/parler-tts
tags:
  - cli
---

# parler-tts

CLI tool: parler-tts

## Overview

parler-tts provides cli tool: parler-tts. Agents benefit from parler-tts because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add huggingface/parler-tts

# Or clone from GitHub
git clone https://github.com/huggingface/parler-tts.git
```

## Usage

```bash
# Show help and available options
parler-tts --help

# Check version
parler-tts --version
```

Refer to the project documentation for detailed usage:
- https://github.com/huggingface/parler-tts

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add huggingface/parler-tts

# 2. Verify installation
agents-cli run parler-tts -- --version

# 3. Explore capabilities
agents-cli schema parler-tts --json
```

### Piping with other tools

```bash
# Chain parler-tts output with jq for structured processing
agents-cli run parler-tts -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run parler-tts -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run parler-tts -- --help --json

# Introspect full command schema
agents-cli schema parler-tts --json

# Dry-run before executing (safe exploration)
agents-cli run parler-tts -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe parler-tts --json
```

## When to Use This Tool

Use `parler-tts` when:
- Your task involves cli tool: parler-tts
- A task requires parler-tts-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what parler-tts provides
