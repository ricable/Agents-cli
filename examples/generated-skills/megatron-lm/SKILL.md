---
name: Megatron-LM
version: 0.0.0
description: "CLI tool: Megatron-LM. Use this skill whenever the user works with Megatron-LM or tasks related to cli tool: megatron-lm — even if they don't mention "Megatron-LM" by name."
ingredients:
  - NVIDIA/Megatron-LM
tags:
  - cli
---

# Megatron-LM

CLI tool: Megatron-LM

## Overview

Megatron-LM provides cli tool: megatron-lm. Agents benefit from Megatron-LM because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add NVIDIA/Megatron-LM

# Or clone from GitHub
git clone https://github.com/NVIDIA/Megatron-LM.git
```

## Usage

```bash
# Show help and available options
Megatron-LM --help

# Check version
Megatron-LM --version
```

Refer to the project documentation for detailed usage:
- https://github.com/NVIDIA/Megatron-LM

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add NVIDIA/Megatron-LM

# 2. Verify installation
agents-cli run Megatron-LM -- --version

# 3. Explore capabilities
agents-cli schema Megatron-LM --json
```

### Piping with other tools

```bash
# Chain Megatron-LM output with jq for structured processing
agents-cli run Megatron-LM -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run Megatron-LM -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run Megatron-LM -- --help --json

# Introspect full command schema
agents-cli schema Megatron-LM --json

# Dry-run before executing (safe exploration)
agents-cli run Megatron-LM -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe Megatron-LM --json
```

## When to Use This Tool

Use `Megatron-LM` when:
- Your task involves cli tool: megatron-lm
- A task requires Megatron-LM-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what Megatron-LM provides
