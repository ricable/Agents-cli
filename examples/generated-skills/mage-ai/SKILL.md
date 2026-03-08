---
name: mage-ai
version: 0.0.0
description: "CLI tool: mage-ai. Use this skill whenever the user works with mage-ai or tasks related to cli tool: mage-ai — even if they don't mention "mage-ai" by name."
ingredients:
  - mage-ai/mage-ai
tags:
  - cli
---

# mage-ai

CLI tool: mage-ai

## Overview

mage-ai provides cli tool: mage-ai. Agents benefit from mage-ai because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add mage-ai/mage-ai

# Or clone from GitHub
git clone https://github.com/mage-ai/mage-ai.git
```

## Usage

```bash
# Show help and available options
mage-ai --help

# Check version
mage-ai --version
```

Refer to the project documentation for detailed usage:
- https://github.com/mage-ai/mage-ai

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add mage-ai/mage-ai

# 2. Verify installation
agents-cli run mage-ai -- --version

# 3. Explore capabilities
agents-cli schema mage-ai --json
```

### Piping with other tools

```bash
# Chain mage-ai output with jq for structured processing
agents-cli run mage-ai -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run mage-ai -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run mage-ai -- --help --json

# Introspect full command schema
agents-cli schema mage-ai --json

# Dry-run before executing (safe exploration)
agents-cli run mage-ai -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe mage-ai --json
```

## When to Use This Tool

Use `mage-ai` when:
- Your task involves cli tool: mage-ai
- A task requires mage-ai-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what mage-ai provides
