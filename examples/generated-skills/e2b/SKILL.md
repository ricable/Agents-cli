---
name: @e2b/code-interpreter
version: 2.3.3
description: "E2B Code Interpreter - Stateful code execution. Use this skill whenever the user works with @e2b/code-interpreter or tasks related to e2b code interpreter - stateful code execution — even if they don't mention "@e2b/code-interpreter" by name."
ingredients:
  - @e2b/code-interpreter
tags:
  - e2b
  - ai-agents
  - agents
  - ai
  - code-interpreter
  - stateful-sandbox
  - stateful-serverrless
  - sandbox
  - code
  - runtime
  - vm
  - cli
# homepage: https://e2b.dev
# license: MIT
---

# @e2b/code-interpreter

E2B Code Interpreter - Stateful code execution

**Source**: https://e2b.dev

## Overview

@e2b/code-interpreter provides e2b code interpreter - stateful code execution. Agents benefit from @e2b/code-interpreter because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @e2b/code-interpreter

# Or install directly via npm
npm install -g @e2b/code-interpreter
```

## Usage

```bash
# Show help and available options
@e2b/code-interpreter --help

# Check version
@e2b/code-interpreter --version
```

Refer to the project documentation for detailed usage:
- https://e2b.dev

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @e2b/code-interpreter

# 2. Verify installation
agents-cli run @e2b/code-interpreter -- --version

# 3. Explore capabilities
agents-cli schema @e2b/code-interpreter --json
```

### Piping with other tools

```bash
# Chain @e2b/code-interpreter output with jq for structured processing
agents-cli run @e2b/code-interpreter -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @e2b/code-interpreter -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @e2b/code-interpreter -- --help --json

# Introspect full command schema
agents-cli schema @e2b/code-interpreter --json

# Dry-run before executing (safe exploration)
agents-cli run @e2b/code-interpreter -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @e2b/code-interpreter --json
```

## When to Use This Tool

Use `@e2b/code-interpreter` when:
- Your task involves e2b code interpreter - stateful code execution
- A task requires @e2b/code-interpreter-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @e2b/code-interpreter provides
