---
name: IP-Adapter
version: 0.0.0
description: "CLI tool: IP-Adapter. Use this skill whenever the user works with IP-Adapter or tasks related to cli tool: ip-adapter — even if they don't mention "IP-Adapter" by name."
ingredients:
  - tencent-ailab/IP-Adapter
tags:
  - cli
---

# IP-Adapter

CLI tool: IP-Adapter

## Overview

IP-Adapter provides cli tool: ip-adapter. Agents benefit from IP-Adapter because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add tencent-ailab/IP-Adapter

# Or clone from GitHub
git clone https://github.com/tencent-ailab/IP-Adapter.git
```

## Usage

```bash
# Show help and available options
IP-Adapter --help

# Check version
IP-Adapter --version
```

Refer to the project documentation for detailed usage:
- https://github.com/tencent-ailab/IP-Adapter

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add tencent-ailab/IP-Adapter

# 2. Verify installation
agents-cli run IP-Adapter -- --version

# 3. Explore capabilities
agents-cli schema IP-Adapter --json
```

### Piping with other tools

```bash
# Chain IP-Adapter output with jq for structured processing
agents-cli run IP-Adapter -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run IP-Adapter -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run IP-Adapter -- --help --json

# Introspect full command schema
agents-cli schema IP-Adapter --json

# Dry-run before executing (safe exploration)
agents-cli run IP-Adapter -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe IP-Adapter --json
```

## When to Use This Tool

Use `IP-Adapter` when:
- Your task involves cli tool: ip-adapter
- A task requires IP-Adapter-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what IP-Adapter provides
