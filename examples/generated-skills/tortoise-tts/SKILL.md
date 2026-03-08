---
name: tortoise-tts
version: 0.0.0
description: "CLI tool: tortoise-tts. Use this skill whenever the user works with tortoise-tts or tasks related to cli tool: tortoise-tts — even if they don't mention "tortoise-tts" by name."
ingredients:
  - neonbjb/tortoise-tts
tags:
  - cli
---

# tortoise-tts

CLI tool: tortoise-tts

## Overview

tortoise-tts provides cli tool: tortoise-tts. Agents benefit from tortoise-tts because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add neonbjb/tortoise-tts

# Or clone from GitHub
git clone https://github.com/neonbjb/tortoise-tts.git
```

## Usage

```bash
# Show help and available options
tortoise-tts --help

# Check version
tortoise-tts --version
```

Refer to the project documentation for detailed usage:
- https://github.com/neonbjb/tortoise-tts

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add neonbjb/tortoise-tts

# 2. Verify installation
agents-cli run tortoise-tts -- --version

# 3. Explore capabilities
agents-cli schema tortoise-tts --json
```

### Piping with other tools

```bash
# Chain tortoise-tts output with jq for structured processing
agents-cli run tortoise-tts -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run tortoise-tts -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run tortoise-tts -- --help --json

# Introspect full command schema
agents-cli schema tortoise-tts --json

# Dry-run before executing (safe exploration)
agents-cli run tortoise-tts -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe tortoise-tts --json
```

## When to Use This Tool

Use `tortoise-tts` when:
- Your task involves cli tool: tortoise-tts
- A task requires tortoise-tts-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what tortoise-tts provides
