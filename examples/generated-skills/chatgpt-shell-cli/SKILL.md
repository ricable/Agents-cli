---
name: chatGPT-shell-cli
version: 0.0.0
description: "CLI tool: chatGPT-shell-cli. Use this skill whenever the user works with chatGPT-shell-cli or tasks related to cli tool: chatgpt-shell-cli — even if they don't mention "chatGPT-shell-cli" by name."
ingredients:
  - 0xacx/chatGPT-shell-cli
tags:
  - cli
---

# chatGPT-shell-cli

CLI tool: chatGPT-shell-cli

## Overview

chatGPT-shell-cli provides cli tool: chatgpt-shell-cli. Agents benefit from chatGPT-shell-cli because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add 0xacx/chatGPT-shell-cli

# Or clone from GitHub
git clone https://github.com/0xacx/chatGPT-shell-cli.git
```

## Usage

```bash
# Show help and available options
chatGPT-shell-cli --help

# Check version
chatGPT-shell-cli --version
```

Refer to the project documentation for detailed usage:
- https://github.com/0xacx/chatGPT-shell-cli

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add 0xacx/chatGPT-shell-cli

# 2. Verify installation
agents-cli run chatGPT-shell-cli -- --version

# 3. Explore capabilities
agents-cli schema chatGPT-shell-cli --json
```

### Piping with other tools

```bash
# Chain chatGPT-shell-cli output with jq for structured processing
agents-cli run chatGPT-shell-cli -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run chatGPT-shell-cli -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run chatGPT-shell-cli -- --help --json

# Introspect full command schema
agents-cli schema chatGPT-shell-cli --json

# Dry-run before executing (safe exploration)
agents-cli run chatGPT-shell-cli -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe chatGPT-shell-cli --json
```

## When to Use This Tool

Use `chatGPT-shell-cli` when:
- Your task involves cli tool: chatgpt-shell-cli
- A task requires chatGPT-shell-cli-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what chatGPT-shell-cli provides
