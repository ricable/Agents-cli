---
name: TensorRT
version: 0.0.0
description: "CLI tool: TensorRT. Use this skill whenever the user works with TensorRT or tasks related to cli tool: tensorrt — even if they don't mention "TensorRT" by name."
ingredients:
  - NVIDIA/TensorRT
tags:
  - cli
---

# TensorRT

CLI tool: TensorRT

## Overview

TensorRT provides cli tool: tensorrt. Agents benefit from TensorRT because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add NVIDIA/TensorRT

# Or clone from GitHub
git clone https://github.com/NVIDIA/TensorRT.git
```

## Usage

```bash
# Show help and available options
TensorRT --help

# Check version
TensorRT --version
```

Refer to the project documentation for detailed usage:
- https://github.com/NVIDIA/TensorRT

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add NVIDIA/TensorRT

# 2. Verify installation
agents-cli run TensorRT -- --version

# 3. Explore capabilities
agents-cli schema TensorRT --json
```

### Piping with other tools

```bash
# Chain TensorRT output with jq for structured processing
agents-cli run TensorRT -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run TensorRT -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run TensorRT -- --help --json

# Introspect full command schema
agents-cli schema TensorRT --json

# Dry-run before executing (safe exploration)
agents-cli run TensorRT -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe TensorRT --json
```

## When to Use This Tool

Use `TensorRT` when:
- Your task involves cli tool: tensorrt
- A task requires TensorRT-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what TensorRT provides
