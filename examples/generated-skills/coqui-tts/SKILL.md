---
name: TTS
version: 0.0.0
description: "CLI tool: TTS. Use this skill whenever the user works with TTS or tasks related to cli tool: tts — even if they don't mention "TTS" by name."
ingredients:
  - coqui-ai/TTS
tags:
  - cli
---

# TTS

CLI tool: TTS

## Overview

TTS provides cli tool: tts. Agents benefit from TTS because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add coqui-ai/TTS

# Or clone from GitHub
git clone https://github.com/coqui-ai/TTS.git
```

## Usage

```bash
# Show help and available options
TTS --help

# Check version
TTS --version
```

Refer to the project documentation for detailed usage:
- https://github.com/coqui-ai/TTS

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add coqui-ai/TTS

# 2. Verify installation
agents-cli run TTS -- --version

# 3. Explore capabilities
agents-cli schema TTS --json
```

### Piping with other tools

```bash
# Chain TTS output with jq for structured processing
agents-cli run TTS -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run TTS -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run TTS -- --help --json

# Introspect full command schema
agents-cli schema TTS --json

# Dry-run before executing (safe exploration)
agents-cli run TTS -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe TTS --json
```

## When to Use This Tool

Use `TTS` when:
- Your task involves cli tool: tts
- A task requires TTS-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what TTS provides
