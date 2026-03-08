---
name: PaddleOCR
version: 0.0.0
description: "CLI tool: PaddleOCR. Use this skill whenever the user works with PaddleOCR or tasks related to cli tool: paddleocr — even if they don't mention "PaddleOCR" by name."
ingredients:
  - PaddlePaddle/PaddleOCR
tags:
  - cli
---

# PaddleOCR

CLI tool: PaddleOCR

## Overview

PaddleOCR provides cli tool: paddleocr. Agents benefit from PaddleOCR because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add PaddlePaddle/PaddleOCR

# Or clone from GitHub
git clone https://github.com/PaddlePaddle/PaddleOCR.git
```

## Usage

```bash
# Show help and available options
PaddleOCR --help

# Check version
PaddleOCR --version
```

Refer to the project documentation for detailed usage:
- https://github.com/PaddlePaddle/PaddleOCR

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add PaddlePaddle/PaddleOCR

# 2. Verify installation
agents-cli run PaddleOCR -- --version

# 3. Explore capabilities
agents-cli schema PaddleOCR --json
```

### Piping with other tools

```bash
# Chain PaddleOCR output with jq for structured processing
agents-cli run PaddleOCR -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run PaddleOCR -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run PaddleOCR -- --help --json

# Introspect full command schema
agents-cli schema PaddleOCR --json

# Dry-run before executing (safe exploration)
agents-cli run PaddleOCR -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe PaddleOCR --json
```

## When to Use This Tool

Use `PaddleOCR` when:
- Your task involves cli tool: paddleocr
- A task requires PaddleOCR-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what PaddleOCR provides
