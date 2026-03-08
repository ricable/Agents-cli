---
name: bandwhich
version: 0.0.0
description: "CLI tool: bandwhich. Use this skill whenever the user works with bandwhich or tasks related to cli tool: bandwhich — even if they don't mention "bandwhich" by name."
ingredients:
  - imsnif/bandwhich
tags:
  - cli
---

# bandwhich

CLI tool: bandwhich

## Overview

bandwhich provides cli tool: bandwhich. Agents benefit from bandwhich because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add imsnif/bandwhich

# Or clone from GitHub
git clone https://github.com/imsnif/bandwhich.git
```

## Usage

```bash
# Show help and available options
bandwhich --help

# Check version
bandwhich --version
```

Refer to the project documentation for detailed usage:
- https://github.com/imsnif/bandwhich

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add imsnif/bandwhich

# 2. Verify installation
agents-cli run bandwhich -- --version

# 3. Explore capabilities
agents-cli schema bandwhich --json
```

### Piping with other tools

```bash
# Chain bandwhich output with jq for structured processing
agents-cli run bandwhich -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run bandwhich -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run bandwhich -- --help --json

# Introspect full command schema
agents-cli schema bandwhich --json

# Dry-run before executing (safe exploration)
agents-cli run bandwhich -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe bandwhich --json
```

## When to Use This Tool

Use `bandwhich` when:
- Your task involves cli tool: bandwhich
- A task requires bandwhich-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what bandwhich provides
