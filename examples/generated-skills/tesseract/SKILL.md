---
name: tesseract
version: 0.0.0
description: "CLI tool: tesseract. Use this skill whenever the user works with tesseract or tasks related to cli tool: tesseract — even if they don't mention "tesseract" by name."
ingredients:
  - tesseract-ocr/tesseract
tags:
  - cli
---

# tesseract

CLI tool: tesseract

## Overview

tesseract provides cli tool: tesseract. Agents benefit from tesseract because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add tesseract-ocr/tesseract

# Or clone from GitHub
git clone https://github.com/tesseract-ocr/tesseract.git
```

## Usage

```bash
# Show help and available options
tesseract --help

# Check version
tesseract --version
```

Refer to the project documentation for detailed usage:
- https://github.com/tesseract-ocr/tesseract

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add tesseract-ocr/tesseract

# 2. Verify installation
agents-cli run tesseract -- --version

# 3. Explore capabilities
agents-cli schema tesseract --json
```

### Piping with other tools

```bash
# Chain tesseract output with jq for structured processing
agents-cli run tesseract -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run tesseract -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run tesseract -- --help --json

# Introspect full command schema
agents-cli schema tesseract --json

# Dry-run before executing (safe exploration)
agents-cli run tesseract -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe tesseract --json
```

## When to Use This Tool

Use `tesseract` when:
- Your task involves cli tool: tesseract
- A task requires tesseract-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what tesseract provides
