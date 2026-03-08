---
name: tokenizers
version: 0.0.0
description: "CLI tool: tokenizers. Use this skill whenever the user works with tokenizers or tasks related to cli tool: tokenizers — even if they don't mention "tokenizers" by name."
ingredients:
  - huggingface/tokenizers
tags:
  - cli
---

# tokenizers

CLI tool: tokenizers

## Overview

tokenizers provides cli tool: tokenizers. Agents benefit from tokenizers because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add huggingface/tokenizers

# Or clone from GitHub
git clone https://github.com/huggingface/tokenizers.git
```

## Help Reference

The following is the tool's built-in help output for reference:

```
cloning the template failed!
```

## Usage

```bash
# Show help and available options
tokenizers --help

# Check version
tokenizers --version
```

Refer to the project documentation for detailed usage:
- https://github.com/huggingface/tokenizers

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add huggingface/tokenizers

# 2. Verify installation
agents-cli run tokenizers -- --version

# 3. Explore capabilities
agents-cli schema tokenizers --json
```

### Piping with other tools

```bash
# Chain tokenizers output with jq for structured processing
agents-cli run tokenizers -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run tokenizers -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run tokenizers -- --help --json

# Introspect full command schema
agents-cli schema tokenizers --json

# Dry-run before executing (safe exploration)
agents-cli run tokenizers -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe tokenizers --json
```

## When to Use This Tool

Use `tokenizers` when:
- Your task involves cli tool: tokenizers
- A task requires tokenizers-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what tokenizers provides
