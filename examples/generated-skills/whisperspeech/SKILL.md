---
name: WhisperSpeech
version: 0.0.0
description: "CLI tool: WhisperSpeech. Use this skill whenever the user works with WhisperSpeech or tasks related to cli tool: whisperspeech — even if they don't mention "WhisperSpeech" by name."
ingredients:
  - WhisperSpeech/WhisperSpeech
tags:
  - cli
---

# WhisperSpeech

CLI tool: WhisperSpeech

## Overview

WhisperSpeech provides cli tool: whisperspeech. Agents benefit from WhisperSpeech because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add WhisperSpeech/WhisperSpeech

# Or clone from GitHub
git clone https://github.com/WhisperSpeech/WhisperSpeech.git
```

## Usage

```bash
# Show help and available options
WhisperSpeech --help

# Check version
WhisperSpeech --version
```

Refer to the project documentation for detailed usage:
- https://github.com/WhisperSpeech/WhisperSpeech

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add WhisperSpeech/WhisperSpeech

# 2. Verify installation
agents-cli run WhisperSpeech -- --version

# 3. Explore capabilities
agents-cli schema WhisperSpeech --json
```

### Piping with other tools

```bash
# Chain WhisperSpeech output with jq for structured processing
agents-cli run WhisperSpeech -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run WhisperSpeech -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run WhisperSpeech -- --help --json

# Introspect full command schema
agents-cli schema WhisperSpeech --json

# Dry-run before executing (safe exploration)
agents-cli run WhisperSpeech -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe WhisperSpeech --json
```

## When to Use This Tool

Use `WhisperSpeech` when:
- Your task involves cli tool: whisperspeech
- A task requires WhisperSpeech-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what WhisperSpeech provides
