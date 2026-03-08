---
name: ControlNet
version: 0.0.0
description: "CLI tool: ControlNet. Use this skill whenever the user works with ControlNet or tasks related to cli tool: controlnet — even if they don't mention "ControlNet" by name."
ingredients:
  - lllyasviel/ControlNet
tags:
  - cli
---

# ControlNet

CLI tool: ControlNet

## Overview

ControlNet provides cli tool: controlnet. Agents benefit from ControlNet because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add lllyasviel/ControlNet

# Or clone from GitHub
git clone https://github.com/lllyasviel/ControlNet.git
```

## Usage

```bash
# Show help and available options
ControlNet --help

# Check version
ControlNet --version
```

Refer to the project documentation for detailed usage:
- https://github.com/lllyasviel/ControlNet

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add lllyasviel/ControlNet

# 2. Verify installation
agents-cli run ControlNet -- --version

# 3. Explore capabilities
agents-cli schema ControlNet --json
```

### Piping with other tools

```bash
# Chain ControlNet output with jq for structured processing
agents-cli run ControlNet -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run ControlNet -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run ControlNet -- --help --json

# Introspect full command schema
agents-cli schema ControlNet --json

# Dry-run before executing (safe exploration)
agents-cli run ControlNet -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe ControlNet --json
```

## When to Use This Tool

Use `ControlNet` when:
- Your task involves cli tool: controlnet
- A task requires ControlNet-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what ControlNet provides
