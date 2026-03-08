---
name: chainlit
version: 0.0.0
description: "CLI tool: chainlit. Use this skill whenever the user works with chainlit or tasks related to cli tool: chainlit — even if they don't mention "chainlit" by name."
ingredients:
  - Chainlit/chainlit
tags:
  - cli
---

# chainlit

CLI tool: chainlit

## Overview

chainlit provides cli tool: chainlit. Agents benefit from chainlit because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add Chainlit/chainlit

# Or clone from GitHub
git clone https://github.com/Chainlit/chainlit.git
```

## Usage

```bash
# Show help and available options
chainlit --help

# Check version
chainlit --version
```

Refer to the project documentation for detailed usage:
- https://github.com/Chainlit/chainlit

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add Chainlit/chainlit

# 2. Verify installation
agents-cli run chainlit -- --version

# 3. Explore capabilities
agents-cli schema chainlit --json
```

### Piping with other tools

```bash
# Chain chainlit output with jq for structured processing
agents-cli run chainlit -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run chainlit -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run chainlit -- --help --json

# Introspect full command schema
agents-cli schema chainlit --json

# Dry-run before executing (safe exploration)
agents-cli run chainlit -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe chainlit --json
```

## When to Use This Tool

Use `chainlit` when:
- Your task involves cli tool: chainlit
- A task requires chainlit-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what chainlit provides
