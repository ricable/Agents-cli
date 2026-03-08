---
name: gemini-cli
version: 0.34.0-nightly.20260304.28af4e127
description: "CLI tool: gemini-cli. Use this skill whenever the user works with gemini-cli or tasks related to cli tool: gemini-cli — even if they don't mention "gemini-cli" by name."
ingredients:
  - google-gemini/gemini-cli
tags:
  - cli
---

# gemini-cli

CLI tool: gemini-cli

## Overview

gemini-cli provides cli tool: gemini-cli. Agents benefit from gemini-cli because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add google-gemini/gemini-cli

# Or clone from GitHub
git clone https://github.com/google-gemini/gemini-cli.git
```

## Usage

```bash
# Show help and available options
gemini-cli --help

# Check version
gemini-cli --version
```

Refer to the project documentation for detailed usage:
- https://github.com/google-gemini/gemini-cli

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add google-gemini/gemini-cli

# 2. Verify installation
agents-cli run gemini-cli -- --version

# 3. Explore capabilities
agents-cli schema gemini-cli --json
```

### Piping with other tools

```bash
# Chain gemini-cli output with jq for structured processing
agents-cli run gemini-cli -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run gemini-cli -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run gemini-cli -- --help --json

# Introspect full command schema
agents-cli schema gemini-cli --json

# Dry-run before executing (safe exploration)
agents-cli run gemini-cli -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe gemini-cli --json
```

## When to Use This Tool

Use `gemini-cli` when:
- Your task involves cli tool: gemini-cli
- A task requires gemini-cli-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what gemini-cli provides
