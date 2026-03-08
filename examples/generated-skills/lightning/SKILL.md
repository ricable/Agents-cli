---
name: pytorch-lightning
version: 0.0.0
description: "CLI tool: pytorch-lightning. Use this skill whenever the user works with pytorch-lightning or tasks related to cli tool: pytorch-lightning — even if they don't mention "pytorch-lightning" by name."
ingredients:
  - Lightning-AI/pytorch-lightning
tags:
  - cli
---

# pytorch-lightning

CLI tool: pytorch-lightning

## Overview

pytorch-lightning provides cli tool: pytorch-lightning. Agents benefit from pytorch-lightning because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add Lightning-AI/pytorch-lightning

# Or clone from GitHub
git clone https://github.com/Lightning-AI/pytorch-lightning.git
```

## Usage

```bash
# Show help and available options
pytorch-lightning --help

# Check version
pytorch-lightning --version
```

Refer to the project documentation for detailed usage:
- https://github.com/Lightning-AI/pytorch-lightning

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add Lightning-AI/pytorch-lightning

# 2. Verify installation
agents-cli run pytorch-lightning -- --version

# 3. Explore capabilities
agents-cli schema pytorch-lightning --json
```

### Piping with other tools

```bash
# Chain pytorch-lightning output with jq for structured processing
agents-cli run pytorch-lightning -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run pytorch-lightning -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run pytorch-lightning -- --help --json

# Introspect full command schema
agents-cli schema pytorch-lightning --json

# Dry-run before executing (safe exploration)
agents-cli run pytorch-lightning -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe pytorch-lightning --json
```

## When to Use This Tool

Use `pytorch-lightning` when:
- Your task involves cli tool: pytorch-lightning
- A task requires pytorch-lightning-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what pytorch-lightning provides
