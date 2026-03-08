---
name: AugLy
version: 0.0.0
description: "CLI tool: AugLy. Use this skill whenever the user works with AugLy or tasks related to cli tool: augly — even if they don't mention "AugLy" by name."
ingredients:
  - facebookresearch/AugLy
tags:
  - cli
---

# AugLy

CLI tool: AugLy

## Overview

AugLy provides cli tool: augly. Agents benefit from AugLy because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add facebookresearch/AugLy

# Or clone from GitHub
git clone https://github.com/facebookresearch/AugLy.git
```

## Usage

```bash
# Show help and available options
AugLy --help

# Check version
AugLy --version
```

Refer to the project documentation for detailed usage:
- https://github.com/facebookresearch/AugLy

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add facebookresearch/AugLy

# 2. Verify installation
agents-cli run AugLy -- --version

# 3. Explore capabilities
agents-cli schema AugLy --json
```

### Piping with other tools

```bash
# Chain AugLy output with jq for structured processing
agents-cli run AugLy -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run AugLy -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run AugLy -- --help --json

# Introspect full command schema
agents-cli schema AugLy --json

# Dry-run before executing (safe exploration)
agents-cli run AugLy -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe AugLy --json
```

## When to Use This Tool

Use `AugLy` when:
- Your task involves cli tool: augly
- A task requires AugLy-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what AugLy provides
