---
name: onnxruntime
version: 0.0.0
description: "CLI tool: onnxruntime. Use this skill whenever the user works with onnxruntime or tasks related to cli tool: onnxruntime — even if they don't mention "onnxruntime" by name."
ingredients:
  - microsoft/onnxruntime
tags:
  - cli
---

# onnxruntime

CLI tool: onnxruntime

## Overview

onnxruntime provides cli tool: onnxruntime. Agents benefit from onnxruntime because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add microsoft/onnxruntime

# Or clone from GitHub
git clone https://github.com/microsoft/onnxruntime.git
```

## Usage

```bash
# Show help and available options
onnxruntime --help

# Check version
onnxruntime --version
```

Refer to the project documentation for detailed usage:
- https://github.com/microsoft/onnxruntime

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add microsoft/onnxruntime

# 2. Verify installation
agents-cli run onnxruntime -- --version

# 3. Explore capabilities
agents-cli schema onnxruntime --json
```

### Piping with other tools

```bash
# Chain onnxruntime output with jq for structured processing
agents-cli run onnxruntime -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run onnxruntime -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run onnxruntime -- --help --json

# Introspect full command schema
agents-cli schema onnxruntime --json

# Dry-run before executing (safe exploration)
agents-cli run onnxruntime -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe onnxruntime --json
```

## When to Use This Tool

Use `onnxruntime` when:
- Your task involves cli tool: onnxruntime
- A task requires onnxruntime-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what onnxruntime provides
