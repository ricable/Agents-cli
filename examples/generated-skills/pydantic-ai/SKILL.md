---
name: pydantic-ai
version: 0.0.0
description: "CLI tool: pydantic-ai. Use this skill whenever the user works with pydantic-ai or tasks related to cli tool: pydantic-ai — even if they don't mention "pydantic-ai" by name."
ingredients:
  - pydantic/pydantic-ai
tags:
  - cli
---

# pydantic-ai

CLI tool: pydantic-ai

## Overview

pydantic-ai provides cli tool: pydantic-ai. Agents benefit from pydantic-ai because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add pydantic/pydantic-ai

# Or clone from GitHub
git clone https://github.com/pydantic/pydantic-ai.git
```

## Usage

```bash
# Show help and available options
pydantic-ai --help

# Check version
pydantic-ai --version
```

Refer to the project documentation for detailed usage:
- https://github.com/pydantic/pydantic-ai

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add pydantic/pydantic-ai

# 2. Verify installation
agents-cli run pydantic-ai -- --version

# 3. Explore capabilities
agents-cli schema pydantic-ai --json
```

### Piping with other tools

```bash
# Chain pydantic-ai output with jq for structured processing
agents-cli run pydantic-ai -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run pydantic-ai -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run pydantic-ai -- --help --json

# Introspect full command schema
agents-cli schema pydantic-ai --json

# Dry-run before executing (safe exploration)
agents-cli run pydantic-ai -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe pydantic-ai --json
```

## When to Use This Tool

Use `pydantic-ai` when:
- Your task involves cli tool: pydantic-ai
- A task requires pydantic-ai-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what pydantic-ai provides
