---
name: ollama
version: 0.0.0
description: "CLI tool: ollama. Use this skill whenever the user works with ollama or tasks related to cli tool: ollama — even if they don't mention "ollama" by name."
ingredients:
  - ollama/ollama
tags:
  - cli
---

# ollama

CLI tool: ollama

## Overview

ollama provides cli tool: ollama. Agents benefit from ollama because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add ollama/ollama

# Or clone from GitHub
git clone https://github.com/ollama/ollama.git
```

## Usage

```bash
# Show help and available options
ollama --help

# Check version
ollama --version
```

Refer to the project documentation for detailed usage:
- https://github.com/ollama/ollama

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add ollama/ollama

# 2. Verify installation
agents-cli run ollama -- --version

# 3. Explore capabilities
agents-cli schema ollama --json
```

### Piping with other tools

```bash
# Chain ollama output with jq for structured processing
agents-cli run ollama -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run ollama -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run ollama -- --help --json

# Introspect full command schema
agents-cli schema ollama --json

# Dry-run before executing (safe exploration)
agents-cli run ollama -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe ollama --json
```

## When to Use This Tool

Use `ollama` when:
- Your task involves cli tool: ollama
- A task requires ollama-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what ollama provides
