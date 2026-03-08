---
name: guardrails-js
version: 0.1.1
description: "CLI tool: guardrails-js. Use this skill whenever the user works with guardrails-js or tasks related to cli tool: guardrails-js — even if they don't mention "guardrails-js" by name."
ingredients:
  - guardrails-ai/guardrails-js
tags:
  - cli
---

# guardrails-js

CLI tool: guardrails-js

## Overview

guardrails-js provides cli tool: guardrails-js. Agents benefit from guardrails-js because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add guardrails-ai/guardrails-js

# Or clone from GitHub
git clone https://github.com/guardrails-ai/guardrails-js.git
```

## Usage

```bash
# Show help and available options
guardrails-js --help

# Check version
guardrails-js --version
```

Refer to the project documentation for detailed usage:
- https://github.com/guardrails-ai/guardrails-js

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add guardrails-ai/guardrails-js

# 2. Verify installation
agents-cli run guardrails-js -- --version

# 3. Explore capabilities
agents-cli schema guardrails-js --json
```

### Piping with other tools

```bash
# Chain guardrails-js output with jq for structured processing
agents-cli run guardrails-js -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run guardrails-js -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run guardrails-js -- --help --json

# Introspect full command schema
agents-cli schema guardrails-js --json

# Dry-run before executing (safe exploration)
agents-cli run guardrails-js -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe guardrails-js --json
```

## When to Use This Tool

Use `guardrails-js` when:
- Your task involves cli tool: guardrails-js
- A task requires guardrails-js-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what guardrails-js provides
