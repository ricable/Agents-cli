---
name: audiocraft
version: 0.0.0
description: "CLI tool: audiocraft. Use this skill whenever the user works with audiocraft or tasks related to cli tool: audiocraft — even if they don't mention "audiocraft" by name."
ingredients:
  - facebookresearch/audiocraft
tags:
  - cli
---

# audiocraft

CLI tool: audiocraft

## Overview

audiocraft provides cli tool: audiocraft. Agents benefit from audiocraft because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add facebookresearch/audiocraft

# Or clone from GitHub
git clone https://github.com/facebookresearch/audiocraft.git
```

## Usage

```bash
# Show help and available options
audiocraft --help

# Check version
audiocraft --version
```

Refer to the project documentation for detailed usage:
- https://github.com/facebookresearch/audiocraft

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add facebookresearch/audiocraft

# 2. Verify installation
agents-cli run audiocraft -- --version

# 3. Explore capabilities
agents-cli schema audiocraft --json
```

### Piping with other tools

```bash
# Chain audiocraft output with jq for structured processing
agents-cli run audiocraft -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run audiocraft -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run audiocraft -- --help --json

# Introspect full command schema
agents-cli schema audiocraft --json

# Dry-run before executing (safe exploration)
agents-cli run audiocraft -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe audiocraft --json
```

## When to Use This Tool

Use `audiocraft` when:
- Your task involves cli tool: audiocraft
- A task requires audiocraft-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what audiocraft provides
