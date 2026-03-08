---
name: mastra
version: 0.1.11
description: "CLI tool: mastra. Use this skill whenever the user works with mastra or tasks related to cli tool: mastra — even if they don't mention "mastra" by name."
ingredients:
  - mastra-ai/mastra
tags:
  - cli
---

# mastra

CLI tool: mastra

## Overview

mastra provides cli tool: mastra. Agents benefit from mastra because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add mastra-ai/mastra

# Or clone from GitHub
git clone https://github.com/mastra-ai/mastra.git
```

## Usage

```bash
# Show help and available options
mastra --help

# Check version
mastra --version
```

Refer to the project documentation for detailed usage:
- https://github.com/mastra-ai/mastra

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add mastra-ai/mastra

# 2. Verify installation
agents-cli run mastra -- --version

# 3. Explore capabilities
agents-cli schema mastra --json
```

### Piping with other tools

```bash
# Chain mastra output with jq for structured processing
agents-cli run mastra -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run mastra -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run mastra -- --help --json

# Introspect full command schema
agents-cli schema mastra --json

# Dry-run before executing (safe exploration)
agents-cli run mastra -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe mastra --json
```

## When to Use This Tool

Use `mastra` when:
- Your task involves cli tool: mastra
- A task requires mastra-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what mastra provides
