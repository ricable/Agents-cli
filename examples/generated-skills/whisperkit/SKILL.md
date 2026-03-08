---
name: WhisperKit
version: 0.0.0
description: "CLI tool: WhisperKit. Use this skill whenever the user works with WhisperKit or tasks related to cli tool: whisperkit — even if they don't mention "WhisperKit" by name."
ingredients:
  - argmaxinc/WhisperKit
tags:
  - cli
---

# WhisperKit

CLI tool: WhisperKit

## Overview

WhisperKit provides cli tool: whisperkit. Agents benefit from WhisperKit because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add argmaxinc/WhisperKit

# Or clone from GitHub
git clone https://github.com/argmaxinc/WhisperKit.git
```

## Usage

```bash
# Show help and available options
WhisperKit --help

# Check version
WhisperKit --version
```

Refer to the project documentation for detailed usage:
- https://github.com/argmaxinc/WhisperKit

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add argmaxinc/WhisperKit

# 2. Verify installation
agents-cli run WhisperKit -- --version

# 3. Explore capabilities
agents-cli schema WhisperKit --json
```

### Piping with other tools

```bash
# Chain WhisperKit output with jq for structured processing
agents-cli run WhisperKit -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run WhisperKit -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run WhisperKit -- --help --json

# Introspect full command schema
agents-cli schema WhisperKit --json

# Dry-run before executing (safe exploration)
agents-cli run WhisperKit -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe WhisperKit --json
```

## When to Use This Tool

Use `WhisperKit` when:
- Your task involves cli tool: whisperkit
- A task requires WhisperKit-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what WhisperKit provides
