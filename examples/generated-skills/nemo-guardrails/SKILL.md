---
name: NeMo-Guardrails
version: 0.0.0
description: "CLI tool: NeMo-Guardrails. Use this skill whenever the user works with NeMo-Guardrails or tasks related to cli tool: nemo-guardrails — even if they don't mention "NeMo-Guardrails" by name."
ingredients:
  - NVIDIA/NeMo-Guardrails
tags:
  - cli
---

# NeMo-Guardrails

CLI tool: NeMo-Guardrails

## Overview

NeMo-Guardrails provides cli tool: nemo-guardrails. Agents benefit from NeMo-Guardrails because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add NVIDIA/NeMo-Guardrails

# Or clone from GitHub
git clone https://github.com/NVIDIA/NeMo-Guardrails.git
```

## Usage

```bash
# Show help and available options
NeMo-Guardrails --help

# Check version
NeMo-Guardrails --version
```

Refer to the project documentation for detailed usage:
- https://github.com/NVIDIA/NeMo-Guardrails

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add NVIDIA/NeMo-Guardrails

# 2. Verify installation
agents-cli run NeMo-Guardrails -- --version

# 3. Explore capabilities
agents-cli schema NeMo-Guardrails --json
```

### Piping with other tools

```bash
# Chain NeMo-Guardrails output with jq for structured processing
agents-cli run NeMo-Guardrails -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run NeMo-Guardrails -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run NeMo-Guardrails -- --help --json

# Introspect full command schema
agents-cli schema NeMo-Guardrails --json

# Dry-run before executing (safe exploration)
agents-cli run NeMo-Guardrails -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe NeMo-Guardrails --json
```

## When to Use This Tool

Use `NeMo-Guardrails` when:
- Your task involves cli tool: nemo-guardrails
- A task requires NeMo-Guardrails-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what NeMo-Guardrails provides
