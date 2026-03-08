---
name: spacy-llm
version: 0.0.0
description: "CLI tool: spacy-llm. Use this skill whenever the user works with spacy-llm or tasks related to cli tool: spacy-llm — even if they don't mention "spacy-llm" by name."
ingredients:
  - explosion/spacy-llm
tags:
  - cli
---

# spacy-llm

CLI tool: spacy-llm

## Overview

spacy-llm provides cli tool: spacy-llm. Agents benefit from spacy-llm because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add explosion/spacy-llm

# Or clone from GitHub
git clone https://github.com/explosion/spacy-llm.git
```

## Usage

```bash
# Show help and available options
spacy-llm --help

# Check version
spacy-llm --version
```

Refer to the project documentation for detailed usage:
- https://github.com/explosion/spacy-llm

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add explosion/spacy-llm

# 2. Verify installation
agents-cli run spacy-llm -- --version

# 3. Explore capabilities
agents-cli schema spacy-llm --json
```

### Piping with other tools

```bash
# Chain spacy-llm output with jq for structured processing
agents-cli run spacy-llm -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run spacy-llm -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run spacy-llm -- --help --json

# Introspect full command schema
agents-cli schema spacy-llm --json

# Dry-run before executing (safe exploration)
agents-cli run spacy-llm -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe spacy-llm --json
```

## When to Use This Tool

Use `spacy-llm` when:
- Your task involves cli tool: spacy-llm
- A task requires spacy-llm-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what spacy-llm provides
