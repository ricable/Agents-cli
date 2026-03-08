---
name: pytorch
version: 0.0.0
description: "CLI tool: pytorch. Use this skill whenever the user works with pytorch or tasks related to cli tool: pytorch — even if they don't mention "pytorch" by name."
ingredients:
  - pytorch/pytorch
tags:
  - cli
---

# pytorch

CLI tool: pytorch

## Overview

pytorch provides cli tool: pytorch. Agents benefit from pytorch because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add pytorch/pytorch

# Or clone from GitHub
git clone https://github.com/pytorch/pytorch.git
```

## Usage

```bash
# Show help and available options
pytorch --help

# Check version
pytorch --version
```

Refer to the project documentation for detailed usage:
- https://github.com/pytorch/pytorch

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add pytorch/pytorch

# 2. Verify installation
agents-cli run pytorch -- --version

# 3. Explore capabilities
agents-cli schema pytorch --json
```

### Piping with other tools

```bash
# Chain pytorch output with jq for structured processing
agents-cli run pytorch -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run pytorch -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run pytorch -- --help --json

# Introspect full command schema
agents-cli schema pytorch --json

# Dry-run before executing (safe exploration)
agents-cli run pytorch -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe pytorch --json
```

## When to Use This Tool

Use `pytorch` when:
- Your task involves cli tool: pytorch
- A task requires pytorch-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what pytorch provides
