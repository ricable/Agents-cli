---
name: LLaVA
version: 0.0.0
description: "CLI tool: LLaVA. Use this skill whenever the user works with LLaVA or tasks related to cli tool: llava — even if they don't mention "LLaVA" by name."
ingredients:
  - haotian-liu/LLaVA
tags:
  - cli
---

# LLaVA

CLI tool: LLaVA

## Overview

LLaVA provides cli tool: llava. Agents benefit from LLaVA because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add haotian-liu/LLaVA

# Or clone from GitHub
git clone https://github.com/haotian-liu/LLaVA.git
```

## Usage

```bash
# Show help and available options
LLaVA --help

# Check version
LLaVA --version
```

Refer to the project documentation for detailed usage:
- https://github.com/haotian-liu/LLaVA

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add haotian-liu/LLaVA

# 2. Verify installation
agents-cli run LLaVA -- --version

# 3. Explore capabilities
agents-cli schema LLaVA --json
```

### Piping with other tools

```bash
# Chain LLaVA output with jq for structured processing
agents-cli run LLaVA -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run LLaVA -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run LLaVA -- --help --json

# Introspect full command schema
agents-cli schema LLaVA --json

# Dry-run before executing (safe exploration)
agents-cli run LLaVA -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe LLaVA --json
```

## When to Use This Tool

Use `LLaVA` when:
- Your task involves cli tool: llava
- A task requires LLaVA-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what LLaVA provides
