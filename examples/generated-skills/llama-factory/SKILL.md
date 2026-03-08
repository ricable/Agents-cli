---
name: LLaMA-Factory
version: 0.0.0
description: "CLI tool: LLaMA-Factory. Use this skill whenever the user works with LLaMA-Factory or tasks related to cli tool: llama-factory — even if they don't mention "LLaMA-Factory" by name."
ingredients:
  - hiyouga/LLaMA-Factory
tags:
  - cli
---

# LLaMA-Factory

CLI tool: LLaMA-Factory

## Overview

LLaMA-Factory provides cli tool: llama-factory. Agents benefit from LLaMA-Factory because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add hiyouga/LLaMA-Factory

# Or clone from GitHub
git clone https://github.com/hiyouga/LLaMA-Factory.git
```

## Usage

```bash
# Show help and available options
LLaMA-Factory --help

# Check version
LLaMA-Factory --version
```

Refer to the project documentation for detailed usage:
- https://github.com/hiyouga/LLaMA-Factory

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add hiyouga/LLaMA-Factory

# 2. Verify installation
agents-cli run LLaMA-Factory -- --version

# 3. Explore capabilities
agents-cli schema LLaMA-Factory --json
```

### Piping with other tools

```bash
# Chain LLaMA-Factory output with jq for structured processing
agents-cli run LLaMA-Factory -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run LLaMA-Factory -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run LLaMA-Factory -- --help --json

# Introspect full command schema
agents-cli schema LLaMA-Factory --json

# Dry-run before executing (safe exploration)
agents-cli run LLaMA-Factory -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe LLaMA-Factory --json
```

## When to Use This Tool

Use `LLaMA-Factory` when:
- Your task involves cli tool: llama-factory
- A task requires LLaMA-Factory-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what LLaMA-Factory provides
