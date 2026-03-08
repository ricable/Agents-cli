---
name: continue
version: 0.0.0
description: "⏩ Source-controlled AI checks, enforceable in CI. Powered by the open-source Continue CLI. Use this skill whenever the user works with continue or tasks related to ⏩ source-controlled ai checks, enforceable in ci. powered by the open-source continue cli — even if they don't mention "continue" by name."
ingredients:
  - continuedev/continue
tags:
  - agent
  - ai
  - claude
  - cli
  - cloud-agents
  - continuous-ai
  - developer-tools
  - gemini
  - gpt
  - llm
  - open-source
  - workflows
# homepage: https://docs.continue.dev
# license: Apache-2.0
---

# continue

⏩ Source-controlled AI checks, enforceable in CI. Powered by the open-source Continue CLI

**Source**: https://docs.continue.dev

## Overview

continue provides ⏩ source-controlled ai checks, enforceable in ci. powered by the open-source continue cli. Agents benefit from continue because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add continuedev/continue

# Or clone from GitHub
git clone https://github.com/continuedev/continue.git
```

## Usage

```bash
# Show help and available options
continue --help

# Check version
continue --version
```

Refer to the project documentation for detailed usage:
- https://docs.continue.dev

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add continuedev/continue

# 2. Verify installation
agents-cli run continue -- --version

# 3. Explore capabilities
agents-cli schema continue --json
```

### Piping with other tools

```bash
# Chain continue output with jq for structured processing
agents-cli run continue -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run continue -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run continue -- --help --json

# Introspect full command schema
agents-cli schema continue --json

# Dry-run before executing (safe exploration)
agents-cli run continue -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe continue --json
```

## When to Use This Tool

Use `continue` when:
- Your task involves ⏩ source-controlled ai checks, enforceable in ci. powered by the open-source continue cli
- A task requires continue-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what continue provides
