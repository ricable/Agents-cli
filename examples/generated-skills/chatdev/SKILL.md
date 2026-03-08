---
name: ChatDev
version: 0.0.0
description: "CLI tool: ChatDev. Use this skill whenever the user works with ChatDev or tasks related to cli tool: chatdev — even if they don't mention "ChatDev" by name."
ingredients:
  - OpenBMB/ChatDev
tags:
  - cli
---

# ChatDev

CLI tool: ChatDev

## Overview

ChatDev provides cli tool: chatdev. Agents benefit from ChatDev because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add OpenBMB/ChatDev

# Or clone from GitHub
git clone https://github.com/OpenBMB/ChatDev.git
```

## Usage

```bash
# Show help and available options
ChatDev --help

# Check version
ChatDev --version
```

Refer to the project documentation for detailed usage:
- https://github.com/OpenBMB/ChatDev

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add OpenBMB/ChatDev

# 2. Verify installation
agents-cli run ChatDev -- --version

# 3. Explore capabilities
agents-cli schema ChatDev --json
```

### Piping with other tools

```bash
# Chain ChatDev output with jq for structured processing
agents-cli run ChatDev -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run ChatDev -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run ChatDev -- --help --json

# Introspect full command schema
agents-cli schema ChatDev --json

# Dry-run before executing (safe exploration)
agents-cli run ChatDev -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe ChatDev --json
```

## When to Use This Tool

Use `ChatDev` when:
- Your task involves cli tool: chatdev
- A task requires ChatDev-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what ChatDev provides
