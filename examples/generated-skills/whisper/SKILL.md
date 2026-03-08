---
name: whisper
version: 0.0.0
description: "CLI tool: whisper. Use this skill whenever the user works with whisper or tasks related to cli tool: whisper — even if they don't mention "whisper" by name."
ingredients:
  - openai/whisper
tags:
  - cli
---

# whisper

CLI tool: whisper

## Overview

whisper provides cli tool: whisper. Agents benefit from whisper because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add openai/whisper

# Or clone from GitHub
git clone https://github.com/openai/whisper.git
```

## Usage

```bash
# Show help and available options
whisper --help

# Check version
whisper --version
```

Refer to the project documentation for detailed usage:
- https://github.com/openai/whisper

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add openai/whisper

# 2. Verify installation
agents-cli run whisper -- --version

# 3. Explore capabilities
agents-cli schema whisper --json
```

### Piping with other tools

```bash
# Chain whisper output with jq for structured processing
agents-cli run whisper -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run whisper -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run whisper -- --help --json

# Introspect full command schema
agents-cli schema whisper --json

# Dry-run before executing (safe exploration)
agents-cli run whisper -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe whisper --json
```

## When to Use This Tool

Use `whisper` when:
- Your task involves cli tool: whisper
- A task requires whisper-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what whisper provides
