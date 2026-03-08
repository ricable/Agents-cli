---
name: codex
version: 0.0.0
description: "Lightweight coding agent that runs in your terminal. Use this skill whenever the user works with codex or tasks related to lightweight coding agent that runs in your terminal — even if they don't mention "codex" by name."
ingredients:
  - openai/codex
tags:
  - cli
# homepage: https://github.com/openai/codex
# license: Apache-2.0
---

# codex

Lightweight coding agent that runs in your terminal

**Source**: https://github.com/openai/codex

## Overview

codex provides lightweight coding agent that runs in your terminal. Agents benefit from codex because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add openai/codex

# Or clone from GitHub
git clone https://github.com/openai/codex.git
```

## Help Reference

The following is the tool's built-in help output for reference:

```
file:///Users/cedric/.agents-cli/tools/codex/package/codex-cli/bin/codex.js:100
    throw new Error(
          ^

Error: Missing optional dependency @openai/codex-darwin-arm64. Reinstall Codex: npm install -g @openai/codex@latest
    at file:///Users/cedric/.agents-cli/tools/codex/package/codex-cli/bin/codex.js:100:11
    at ModuleJob.run (node:internal/modules/esm/module_job:343:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:665:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:5)

Node.js v22.22.1
```

## Usage

```bash
# Show help and available options
codex --help

# Check version
codex --version
```

Refer to the project documentation for detailed usage:
- https://github.com/openai/codex

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add openai/codex

# 2. Verify installation
agents-cli run codex -- --version

# 3. Explore capabilities
agents-cli schema codex --json
```

### Piping with other tools

```bash
# Chain codex output with jq for structured processing
agents-cli run codex -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run codex -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run codex -- --help --json

# Introspect full command schema
agents-cli schema codex --json

# Dry-run before executing (safe exploration)
agents-cli run codex -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe codex --json
```

## When to Use This Tool

Use `codex` when:
- Your task involves lightweight coding agent that runs in your terminal
- A task requires codex-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what codex provides
