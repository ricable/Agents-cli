---
name: semantic-kernel
version: 0.0.0
description: "CLI tool: semantic-kernel. Use this skill whenever the user works with semantic-kernel or tasks related to cli tool: semantic-kernel — even if they don't mention "semantic-kernel" by name."
ingredients:
  - microsoft/semantic-kernel
tags:
  - cli
---

# semantic-kernel

CLI tool: semantic-kernel

## Overview

semantic-kernel provides cli tool: semantic-kernel. Agents benefit from semantic-kernel because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add microsoft/semantic-kernel

# Or clone from GitHub
git clone https://github.com/microsoft/semantic-kernel.git
```

## Usage

```bash
# Show help and available options
semantic-kernel --help

# Check version
semantic-kernel --version
```

Refer to the project documentation for detailed usage:
- https://github.com/microsoft/semantic-kernel

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add microsoft/semantic-kernel

# 2. Verify installation
agents-cli run semantic-kernel -- --version

# 3. Explore capabilities
agents-cli schema semantic-kernel --json
```

### Piping with other tools

```bash
# Chain semantic-kernel output with jq for structured processing
agents-cli run semantic-kernel -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run semantic-kernel -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run semantic-kernel -- --help --json

# Introspect full command schema
agents-cli schema semantic-kernel --json

# Dry-run before executing (safe exploration)
agents-cli run semantic-kernel -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe semantic-kernel --json
```

## When to Use This Tool

Use `semantic-kernel` when:
- Your task involves cli tool: semantic-kernel
- A task requires semantic-kernel-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what semantic-kernel provides
