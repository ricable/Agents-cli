---
name: networkx
version: 0.0.0
description: "CLI tool: networkx. Use this skill whenever the user works with networkx or tasks related to cli tool: networkx — even if they don't mention "networkx" by name."
ingredients:
  - networkx/networkx
tags:
  - cli
---

# networkx

CLI tool: networkx

## Overview

networkx provides cli tool: networkx. Agents benefit from networkx because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add networkx/networkx

# Or clone from GitHub
git clone https://github.com/networkx/networkx.git
```

## Usage

```bash
# Show help and available options
networkx --help

# Check version
networkx --version
```

Refer to the project documentation for detailed usage:
- https://github.com/networkx/networkx

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add networkx/networkx

# 2. Verify installation
agents-cli run networkx -- --version

# 3. Explore capabilities
agents-cli schema networkx --json
```

### Piping with other tools

```bash
# Chain networkx output with jq for structured processing
agents-cli run networkx -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run networkx -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run networkx -- --help --json

# Introspect full command schema
agents-cli schema networkx --json

# Dry-run before executing (safe exploration)
agents-cli run networkx -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe networkx --json
```

## When to Use This Tool

Use `networkx` when:
- Your task involves cli tool: networkx
- A task requires networkx-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what networkx provides
