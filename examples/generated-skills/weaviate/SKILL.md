---
name: weaviate
version: 0.0.0
description: "CLI tool: weaviate. Use this skill whenever the user works with weaviate or tasks related to cli tool: weaviate — even if they don't mention "weaviate" by name."
ingredients:
  - weaviate/weaviate
tags:
  - cli
---

# weaviate

CLI tool: weaviate

## Overview

weaviate provides cli tool: weaviate. Agents benefit from weaviate because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add weaviate/weaviate

# Or clone from GitHub
git clone https://github.com/weaviate/weaviate.git
```

## Usage

```bash
# Show help and available options
weaviate --help

# Check version
weaviate --version
```

Refer to the project documentation for detailed usage:
- https://github.com/weaviate/weaviate

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add weaviate/weaviate

# 2. Verify installation
agents-cli run weaviate -- --version

# 3. Explore capabilities
agents-cli schema weaviate --json
```

### Piping with other tools

```bash
# Chain weaviate output with jq for structured processing
agents-cli run weaviate -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run weaviate -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run weaviate -- --help --json

# Introspect full command schema
agents-cli schema weaviate --json

# Dry-run before executing (safe exploration)
agents-cli run weaviate -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe weaviate --json
```

## When to Use This Tool

Use `weaviate` when:
- Your task involves cli tool: weaviate
- A task requires weaviate-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what weaviate provides
