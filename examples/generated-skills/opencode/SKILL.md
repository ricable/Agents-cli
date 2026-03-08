---
name: opencode
version: 0.0.0
description: "A powerful AI coding agent. Built for the terminal.. Use this skill whenever the user works with opencode or tasks related to a powerful ai coding agent. built for the terminal — even if they don't mention "opencode" by name."
ingredients:
  - opencode-ai/opencode
tags:
  - ai
  - claude
  - code
  - llm
  - openai
  - cli
# homepage: https://github.com/opencode-ai/opencode
# license: MIT
---

# opencode

A powerful AI coding agent. Built for the terminal.

**Source**: https://github.com/opencode-ai/opencode

## Overview

opencode provides a powerful ai coding agent. built for the terminal. Agents benefit from opencode because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add opencode-ai/opencode

# Or clone from GitHub
git clone https://github.com/opencode-ai/opencode.git
```

## Usage

```bash
# Show help and available options
opencode --help

# Check version
opencode --version
```

Refer to the project documentation for detailed usage:
- https://github.com/opencode-ai/opencode

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add opencode-ai/opencode

# 2. Verify installation
agents-cli run opencode -- --version

# 3. Explore capabilities
agents-cli schema opencode --json
```

### Piping with other tools

```bash
# Chain opencode output with jq for structured processing
agents-cli run opencode -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run opencode -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run opencode -- --help --json

# Introspect full command schema
agents-cli schema opencode --json

# Dry-run before executing (safe exploration)
agents-cli run opencode -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe opencode --json
```

## When to Use This Tool

Use `opencode` when:
- Your task involves a powerful ai coding agent. built for the terminal
- A task requires opencode-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what opencode provides
