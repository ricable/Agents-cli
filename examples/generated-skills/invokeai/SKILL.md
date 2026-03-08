---
name: InvokeAI
version: 0.0.0
description: "CLI tool: InvokeAI. Use this skill whenever the user works with InvokeAI or tasks related to cli tool: invokeai — even if they don't mention "InvokeAI" by name."
ingredients:
  - invoke-ai/InvokeAI
tags:
  - cli
---

# InvokeAI

CLI tool: InvokeAI

## Overview

InvokeAI provides cli tool: invokeai. Agents benefit from InvokeAI because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add invoke-ai/InvokeAI

# Or clone from GitHub
git clone https://github.com/invoke-ai/InvokeAI.git
```

## Usage

```bash
# Show help and available options
InvokeAI --help

# Check version
InvokeAI --version
```

Refer to the project documentation for detailed usage:
- https://github.com/invoke-ai/InvokeAI

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add invoke-ai/InvokeAI

# 2. Verify installation
agents-cli run InvokeAI -- --version

# 3. Explore capabilities
agents-cli schema InvokeAI --json
```

### Piping with other tools

```bash
# Chain InvokeAI output with jq for structured processing
agents-cli run InvokeAI -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run InvokeAI -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run InvokeAI -- --help --json

# Introspect full command schema
agents-cli schema InvokeAI --json

# Dry-run before executing (safe exploration)
agents-cli run InvokeAI -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe InvokeAI --json
```

## When to Use This Tool

Use `InvokeAI` when:
- Your task involves cli tool: invokeai
- A task requires InvokeAI-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what InvokeAI provides
