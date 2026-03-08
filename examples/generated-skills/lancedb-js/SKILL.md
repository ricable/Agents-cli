---
name: @lancedb/lancedb
version: 0.26.2
description: "LanceDB: A serverless, low-latency vector database for AI applications. Use this skill whenever the user works with @lancedb/lancedb or tasks related to lancedb: a serverless, low-latency vector database for ai applications — even if they don't mention "@lancedb/lancedb" by name."
ingredients:
  - @lancedb/lancedb
tags:
  - database
  - lance
  - lancedb
  - search
  - vector
  - vector database
  - ann
  - cli
# homepage: https://github.com/lancedb/lancedb#readme
# license: Apache-2.0
---

# @lancedb/lancedb

LanceDB: A serverless, low-latency vector database for AI applications

**Source**: https://github.com/lancedb/lancedb#readme

## Overview

@lancedb/lancedb provides lancedb: a serverless, low-latency vector database for ai applications. Agents benefit from @lancedb/lancedb because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @lancedb/lancedb

# Or install directly via npm
npm install -g @lancedb/lancedb
```

## Usage

```bash
# Show help and available options
@lancedb/lancedb --help

# Check version
@lancedb/lancedb --version
```

Refer to the project documentation for detailed usage:
- https://github.com/lancedb/lancedb#readme

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @lancedb/lancedb

# 2. Verify installation
agents-cli run @lancedb/lancedb -- --version

# 3. Explore capabilities
agents-cli schema @lancedb/lancedb --json
```

### Piping with other tools

```bash
# Chain @lancedb/lancedb output with jq for structured processing
agents-cli run @lancedb/lancedb -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @lancedb/lancedb -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @lancedb/lancedb -- --help --json

# Introspect full command schema
agents-cli schema @lancedb/lancedb --json

# Dry-run before executing (safe exploration)
agents-cli run @lancedb/lancedb -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @lancedb/lancedb --json
```

## When to Use This Tool

Use `@lancedb/lancedb` when:
- Your task involves lancedb: a serverless, low-latency vector database for ai applications
- A task requires @lancedb/lancedb-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @lancedb/lancedb provides
