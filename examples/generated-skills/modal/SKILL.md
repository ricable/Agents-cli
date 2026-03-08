---
name: modal-client
version: 0.0.0
description: "CLI tool: modal-client. Use this skill whenever the user works with modal-client or tasks related to cli tool: modal-client — even if they don't mention "modal-client" by name."
ingredients:
  - modal-labs/modal-client
tags:
  - cli
---

# modal-client

CLI tool: modal-client

## Overview

modal-client provides cli tool: modal-client. Agents benefit from modal-client because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add modal-labs/modal-client

# Or clone from GitHub
git clone https://github.com/modal-labs/modal-client.git
```

## Usage

```bash
# Show help and available options
modal-client --help

# Check version
modal-client --version
```

Refer to the project documentation for detailed usage:
- https://github.com/modal-labs/modal-client

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add modal-labs/modal-client

# 2. Verify installation
agents-cli run modal-client -- --version

# 3. Explore capabilities
agents-cli schema modal-client --json
```

### Piping with other tools

```bash
# Chain modal-client output with jq for structured processing
agents-cli run modal-client -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run modal-client -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run modal-client -- --help --json

# Introspect full command schema
agents-cli schema modal-client --json

# Dry-run before executing (safe exploration)
agents-cli run modal-client -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe modal-client --json
```

## When to Use This Tool

Use `modal-client` when:
- Your task involves cli tool: modal-client
- A task requires modal-client-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what modal-client provides
