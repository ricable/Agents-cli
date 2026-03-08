---
name: MetaGPT
version: 0.0.0
description: "CLI tool: MetaGPT. Use this skill whenever the user works with MetaGPT or tasks related to cli tool: metagpt — even if they don't mention "MetaGPT" by name."
ingredients:
  - geekan/MetaGPT
tags:
  - cli
---

# MetaGPT

CLI tool: MetaGPT

## Overview

MetaGPT provides cli tool: metagpt. Agents benefit from MetaGPT because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add geekan/MetaGPT

# Or clone from GitHub
git clone https://github.com/geekan/MetaGPT.git
```

## Usage

```bash
# Show help and available options
MetaGPT --help

# Check version
MetaGPT --version
```

Refer to the project documentation for detailed usage:
- https://github.com/geekan/MetaGPT

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add geekan/MetaGPT

# 2. Verify installation
agents-cli run MetaGPT -- --version

# 3. Explore capabilities
agents-cli schema MetaGPT --json
```

### Piping with other tools

```bash
# Chain MetaGPT output with jq for structured processing
agents-cli run MetaGPT -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run MetaGPT -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run MetaGPT -- --help --json

# Introspect full command schema
agents-cli schema MetaGPT --json

# Dry-run before executing (safe exploration)
agents-cli run MetaGPT -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe MetaGPT --json
```

## When to Use This Tool

Use `MetaGPT` when:
- Your task involves cli tool: metagpt
- A task requires MetaGPT-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what MetaGPT provides
