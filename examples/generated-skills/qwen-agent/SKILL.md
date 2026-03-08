---
name: Qwen-Agent
version: 0.0.0
description: "CLI tool: Qwen-Agent. Use this skill whenever the user works with Qwen-Agent or tasks related to cli tool: qwen-agent — even if they don't mention "Qwen-Agent" by name."
ingredients:
  - QwenLM/Qwen-Agent
tags:
  - cli
---

# Qwen-Agent

CLI tool: Qwen-Agent

## Overview

Qwen-Agent provides cli tool: qwen-agent. Agents benefit from Qwen-Agent because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add QwenLM/Qwen-Agent

# Or clone from GitHub
git clone https://github.com/QwenLM/Qwen-Agent.git
```

## Usage

```bash
# Show help and available options
Qwen-Agent --help

# Check version
Qwen-Agent --version
```

Refer to the project documentation for detailed usage:
- https://github.com/QwenLM/Qwen-Agent

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add QwenLM/Qwen-Agent

# 2. Verify installation
agents-cli run Qwen-Agent -- --version

# 3. Explore capabilities
agents-cli schema Qwen-Agent --json
```

### Piping with other tools

```bash
# Chain Qwen-Agent output with jq for structured processing
agents-cli run Qwen-Agent -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run Qwen-Agent -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run Qwen-Agent -- --help --json

# Introspect full command schema
agents-cli schema Qwen-Agent --json

# Dry-run before executing (safe exploration)
agents-cli run Qwen-Agent -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe Qwen-Agent --json
```

## When to Use This Tool

Use `Qwen-Agent` when:
- Your task involves cli tool: qwen-agent
- A task requires Qwen-Agent-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what Qwen-Agent provides
