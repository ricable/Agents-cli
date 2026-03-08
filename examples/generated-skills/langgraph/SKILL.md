---
name: langgraph
version: 0.0.0
description: "CLI tool: langgraph. Use this skill whenever the user works with langgraph or tasks related to cli tool: langgraph — even if they don't mention "langgraph" by name."
ingredients:
  - langchain-ai/langgraph
tags:
  - cli
---

# langgraph

CLI tool: langgraph

## Overview

langgraph provides cli tool: langgraph. Agents benefit from langgraph because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add langchain-ai/langgraph

# Or clone from GitHub
git clone https://github.com/langchain-ai/langgraph.git
```

## Usage

```bash
# Show help and available options
langgraph --help

# Check version
langgraph --version
```

Refer to the project documentation for detailed usage:
- https://github.com/langchain-ai/langgraph

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add langchain-ai/langgraph

# 2. Verify installation
agents-cli run langgraph -- --version

# 3. Explore capabilities
agents-cli schema langgraph --json
```

### Piping with other tools

```bash
# Chain langgraph output with jq for structured processing
agents-cli run langgraph -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run langgraph -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run langgraph -- --help --json

# Introspect full command schema
agents-cli schema langgraph --json

# Dry-run before executing (safe exploration)
agents-cli run langgraph -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe langgraph --json
```

## When to Use This Tool

Use `langgraph` when:
- Your task involves cli tool: langgraph
- A task requires langgraph-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what langgraph provides
