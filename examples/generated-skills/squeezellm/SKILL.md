---
name: SqueezeLLM
version: 0.0.0
description: "CLI tool: SqueezeLLM. Use this skill whenever the user works with SqueezeLLM or tasks related to cli tool: squeezellm — even if they don't mention "SqueezeLLM" by name."
ingredients:
  - SqueezeAILab/SqueezeLLM
tags:
  - cli
---

# SqueezeLLM

CLI tool: SqueezeLLM

## Overview

SqueezeLLM provides cli tool: squeezellm. Agents benefit from SqueezeLLM because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add SqueezeAILab/SqueezeLLM

# Or clone from GitHub
git clone https://github.com/SqueezeAILab/SqueezeLLM.git
```

## Usage

```bash
# Show help and available options
SqueezeLLM --help

# Check version
SqueezeLLM --version
```

Refer to the project documentation for detailed usage:
- https://github.com/SqueezeAILab/SqueezeLLM

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add SqueezeAILab/SqueezeLLM

# 2. Verify installation
agents-cli run SqueezeLLM -- --version

# 3. Explore capabilities
agents-cli schema SqueezeLLM --json
```

### Piping with other tools

```bash
# Chain SqueezeLLM output with jq for structured processing
agents-cli run SqueezeLLM -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run SqueezeLLM -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run SqueezeLLM -- --help --json

# Introspect full command schema
agents-cli schema SqueezeLLM --json

# Dry-run before executing (safe exploration)
agents-cli run SqueezeLLM -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe SqueezeLLM --json
```

## When to Use This Tool

Use `SqueezeLLM` when:
- Your task involves cli tool: squeezellm
- A task requires SqueezeLLM-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what SqueezeLLM provides
