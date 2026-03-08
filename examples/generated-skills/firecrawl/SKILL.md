---
name: firecrawl
version: 0.0.0
description: "CLI tool: firecrawl. Use this skill whenever the user works with firecrawl or tasks related to cli tool: firecrawl — even if they don't mention "firecrawl" by name."
ingredients:
  - mendableai/firecrawl
tags:
  - cli
---

# firecrawl

CLI tool: firecrawl

## Overview

firecrawl provides cli tool: firecrawl. Agents benefit from firecrawl because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add mendableai/firecrawl

# Or clone from GitHub
git clone https://github.com/mendableai/firecrawl.git
```

## Usage

```bash
# Show help and available options
firecrawl --help

# Check version
firecrawl --version
```

Refer to the project documentation for detailed usage:
- https://github.com/mendableai/firecrawl

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add mendableai/firecrawl

# 2. Verify installation
agents-cli run firecrawl -- --version

# 3. Explore capabilities
agents-cli schema firecrawl --json
```

### Piping with other tools

```bash
# Chain firecrawl output with jq for structured processing
agents-cli run firecrawl -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run firecrawl -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run firecrawl -- --help --json

# Introspect full command schema
agents-cli schema firecrawl --json

# Dry-run before executing (safe exploration)
agents-cli run firecrawl -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe firecrawl --json
```

## When to Use This Tool

Use `firecrawl` when:
- Your task involves cli tool: firecrawl
- A task requires firecrawl-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what firecrawl provides
