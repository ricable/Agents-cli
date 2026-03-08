---
name: gpt-engineer
version: 0.0.0
description: "CLI platform to experiment with codegen. Precursor to: https://lovable.dev. Use this skill whenever the user works with gpt-engineer or tasks related to cli platform to experiment with codegen. precursor to: https://lovable.dev — even if they don't mention "gpt-engineer" by name."
ingredients:
  - gpt-engineer-org/gpt-engineer
tags:
  - ai
  - autonomous-agent
  - code-generation
  - codebase-generation
  - codegen
  - coding-assistant
  - gpt-4
  - gpt-engineer
  - openai
  - python
  - cli
# homepage: https://github.com/AntonOsika/gpt-engineer
# license: MIT
---

# gpt-engineer

CLI platform to experiment with codegen. Precursor to: https://lovable.dev

**Source**: https://github.com/AntonOsika/gpt-engineer

## Overview

gpt-engineer provides cli platform to experiment with codegen. precursor to: https://lovable.dev. Agents benefit from gpt-engineer because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add gpt-engineer-org/gpt-engineer

# Or clone from GitHub
git clone https://github.com/gpt-engineer-org/gpt-engineer.git
```

## Usage

```bash
# Show help and available options
gpt-engineer --help

# Check version
gpt-engineer --version
```

Refer to the project documentation for detailed usage:
- https://github.com/AntonOsika/gpt-engineer

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add gpt-engineer-org/gpt-engineer

# 2. Verify installation
agents-cli run gpt-engineer -- --version

# 3. Explore capabilities
agents-cli schema gpt-engineer --json
```

### Piping with other tools

```bash
# Chain gpt-engineer output with jq for structured processing
agents-cli run gpt-engineer -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run gpt-engineer -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run gpt-engineer -- --help --json

# Introspect full command schema
agents-cli schema gpt-engineer --json

# Dry-run before executing (safe exploration)
agents-cli run gpt-engineer -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe gpt-engineer --json
```

## When to Use This Tool

Use `gpt-engineer` when:
- Your task involves cli platform to experiment with codegen. precursor to: https://lovable.dev
- A task requires gpt-engineer-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what gpt-engineer provides
