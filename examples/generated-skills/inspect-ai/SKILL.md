---
name: inspect_ai
version: 0.0.0
description: "CLI tool: inspect_ai. Use this skill whenever the user works with inspect_ai or tasks related to cli tool: inspect_ai — even if they don't mention "inspect_ai" by name."
ingredients:
  - UKGovernmentBEIS/inspect_ai
tags:
  - cli
---

# inspect_ai

CLI tool: inspect_ai

## Overview

inspect_ai provides cli tool: inspect_ai. Agents benefit from inspect_ai because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add UKGovernmentBEIS/inspect_ai

# Or clone from GitHub
git clone https://github.com/UKGovernmentBEIS/inspect_ai.git
```

## Usage

```bash
# Show help and available options
inspect_ai --help

# Check version
inspect_ai --version
```

Refer to the project documentation for detailed usage:
- https://github.com/UKGovernmentBEIS/inspect_ai

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add UKGovernmentBEIS/inspect_ai

# 2. Verify installation
agents-cli run inspect_ai -- --version

# 3. Explore capabilities
agents-cli schema inspect_ai --json
```

### Piping with other tools

```bash
# Chain inspect_ai output with jq for structured processing
agents-cli run inspect_ai -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run inspect_ai -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run inspect_ai -- --help --json

# Introspect full command schema
agents-cli schema inspect_ai --json

# Dry-run before executing (safe exploration)
agents-cli run inspect_ai -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe inspect_ai --json
```

## When to Use This Tool

Use `inspect_ai` when:
- Your task involves cli tool: inspect_ai
- A task requires inspect_ai-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what inspect_ai provides
