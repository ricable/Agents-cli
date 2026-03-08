---
name: detectron2
version: 0.0.0
description: "CLI tool: detectron2. Use this skill whenever the user works with detectron2 or tasks related to cli tool: detectron2 — even if they don't mention "detectron2" by name."
ingredients:
  - facebookresearch/detectron2
tags:
  - cli
---

# detectron2

CLI tool: detectron2

## Overview

detectron2 provides cli tool: detectron2. Agents benefit from detectron2 because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add facebookresearch/detectron2

# Or clone from GitHub
git clone https://github.com/facebookresearch/detectron2.git
```

## Usage

```bash
# Show help and available options
detectron2 --help

# Check version
detectron2 --version
```

Refer to the project documentation for detailed usage:
- https://github.com/facebookresearch/detectron2

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add facebookresearch/detectron2

# 2. Verify installation
agents-cli run detectron2 -- --version

# 3. Explore capabilities
agents-cli schema detectron2 --json
```

### Piping with other tools

```bash
# Chain detectron2 output with jq for structured processing
agents-cli run detectron2 -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run detectron2 -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run detectron2 -- --help --json

# Introspect full command schema
agents-cli schema detectron2 --json

# Dry-run before executing (safe exploration)
agents-cli run detectron2 -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe detectron2 --json
```

## When to Use This Tool

Use `detectron2` when:
- Your task involves cli tool: detectron2
- A task requires detectron2-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what detectron2 provides
