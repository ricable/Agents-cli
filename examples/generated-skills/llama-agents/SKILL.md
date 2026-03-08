---
name: llama-agents
version: 0.0.0
description: "CLI tool: llama-agents. Use this skill whenever the user works with llama-agents or tasks related to cli tool: llama-agents — even if they don't mention "llama-agents" by name."
ingredients:
  - run-llama/llama-agents
tags:
  - cli
---

# llama-agents

CLI tool: llama-agents

## Overview

llama-agents provides cli tool: llama-agents. Agents benefit from llama-agents because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add run-llama/llama-agents

# Or clone from GitHub
git clone https://github.com/run-llama/llama-agents.git
```

## Usage

```bash
# Show help and available options
llama-agents --help

# Check version
llama-agents --version
```

Refer to the project documentation for detailed usage:
- https://github.com/run-llama/llama-agents

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add run-llama/llama-agents

# 2. Verify installation
agents-cli run llama-agents -- --version

# 3. Explore capabilities
agents-cli schema llama-agents --json
```

### Piping with other tools

```bash
# Chain llama-agents output with jq for structured processing
agents-cli run llama-agents -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run llama-agents -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run llama-agents -- --help --json

# Introspect full command schema
agents-cli schema llama-agents --json

# Dry-run before executing (safe exploration)
agents-cli run llama-agents -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe llama-agents --json
```

## When to Use This Tool

Use `llama-agents` when:
- Your task involves cli tool: llama-agents
- A task requires llama-agents-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what llama-agents provides
