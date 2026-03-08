---
name: meilisearch
version: 0.0.0
description: "CLI tool: meilisearch. Use this skill whenever the user works with meilisearch or tasks related to cli tool: meilisearch — even if they don't mention "meilisearch" by name."
ingredients:
  - meilisearch/meilisearch
tags:
  - cli
---

# meilisearch

CLI tool: meilisearch

## Overview

meilisearch provides cli tool: meilisearch. Agents benefit from meilisearch because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add meilisearch/meilisearch

# Or clone from GitHub
git clone https://github.com/meilisearch/meilisearch.git
```

## Usage

```bash
# Show help and available options
meilisearch --help

# Check version
meilisearch --version
```

Refer to the project documentation for detailed usage:
- https://github.com/meilisearch/meilisearch

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add meilisearch/meilisearch

# 2. Verify installation
agents-cli run meilisearch -- --version

# 3. Explore capabilities
agents-cli schema meilisearch --json
```

### Piping with other tools

```bash
# Chain meilisearch output with jq for structured processing
agents-cli run meilisearch -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run meilisearch -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run meilisearch -- --help --json

# Introspect full command schema
agents-cli schema meilisearch --json

# Dry-run before executing (safe exploration)
agents-cli run meilisearch -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe meilisearch --json
```

## When to Use This Tool

Use `meilisearch` when:
- Your task involves cli tool: meilisearch
- A task requires meilisearch-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what meilisearch provides
