---
name: guardrails
version: 0.0.0
description: "CLI tool: guardrails. Use this skill whenever the user works with guardrails or tasks related to cli tool: guardrails — even if they don't mention "guardrails" by name."
ingredients:
  - guardrails-ai/guardrails
tags:
  - cli
---

# guardrails

CLI tool: guardrails

## Overview

guardrails provides cli tool: guardrails. Agents benefit from guardrails because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add guardrails-ai/guardrails

# Or clone from GitHub
git clone https://github.com/guardrails-ai/guardrails.git
```

## Usage

```bash
# Show help and available options
guardrails --help

# Check version
guardrails --version
```

Refer to the project documentation for detailed usage:
- https://github.com/guardrails-ai/guardrails

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add guardrails-ai/guardrails

# 2. Verify installation
agents-cli run guardrails -- --version

# 3. Explore capabilities
agents-cli schema guardrails --json
```

### Piping with other tools

```bash
# Chain guardrails output with jq for structured processing
agents-cli run guardrails -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run guardrails -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run guardrails -- --help --json

# Introspect full command schema
agents-cli schema guardrails --json

# Dry-run before executing (safe exploration)
agents-cli run guardrails -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe guardrails --json
```

## When to Use This Tool

Use `guardrails` when:
- Your task involves cli tool: guardrails
- A task requires guardrails-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what guardrails provides
