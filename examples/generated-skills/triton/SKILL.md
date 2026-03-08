---
name: server
version: 0.0.0
description: "CLI tool: server. Use this skill whenever the user works with server or tasks related to cli tool: server — even if they don't mention "server" by name."
ingredients:
  - triton-inference-server/server
tags:
  - cli
---

# server

CLI tool: server

## Overview

server provides cli tool: server. Agents benefit from server because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add triton-inference-server/server

# Or clone from GitHub
git clone https://github.com/triton-inference-server/server.git
```

## Usage

```bash
# Show help and available options
server --help

# Check version
server --version
```

Refer to the project documentation for detailed usage:
- https://github.com/triton-inference-server/server

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add triton-inference-server/server

# 2. Verify installation
agents-cli run server -- --version

# 3. Explore capabilities
agents-cli schema server --json
```

### Piping with other tools

```bash
# Chain server output with jq for structured processing
agents-cli run server -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run server -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run server -- --help --json

# Introspect full command schema
agents-cli schema server --json

# Dry-run before executing (safe exploration)
agents-cli run server -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe server --json
```

## When to Use This Tool

Use `server` when:
- Your task involves cli tool: server
- A task requires server-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what server provides
