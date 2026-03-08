---
name: @pinecone-database/pinecone
version: 7.1.0
description: "CLI tool: @pinecone-database/pinecone. Use this skill whenever the user works with @pinecone-database/pinecone or tasks related to cli tool: @pinecone-database/pinecone — even if they don't mention "@pinecone-database/pinecone" by name."
ingredients:
  - @pinecone-database/pinecone
tags:
  - cli
---

# @pinecone-database/pinecone

CLI tool: @pinecone-database/pinecone

## Overview

@pinecone-database/pinecone provides cli tool: @pinecone-database/pinecone. Agents benefit from @pinecone-database/pinecone because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @pinecone-database/pinecone

# Or install directly via npm
npm install -g @pinecone-database/pinecone
```

## Usage

```bash
# Show help and available options
@pinecone-database/pinecone --help

# Check version
@pinecone-database/pinecone --version
```

Refer to the project documentation for detailed usage:
- https://github.com/@pinecone-database/pinecone

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @pinecone-database/pinecone

# 2. Verify installation
agents-cli run @pinecone-database/pinecone -- --version

# 3. Explore capabilities
agents-cli schema @pinecone-database/pinecone --json
```

### Piping with other tools

```bash
# Chain @pinecone-database/pinecone output with jq for structured processing
agents-cli run @pinecone-database/pinecone -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @pinecone-database/pinecone -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @pinecone-database/pinecone -- --help --json

# Introspect full command schema
agents-cli schema @pinecone-database/pinecone --json

# Dry-run before executing (safe exploration)
agents-cli run @pinecone-database/pinecone -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @pinecone-database/pinecone --json
```

## When to Use This Tool

Use `@pinecone-database/pinecone` when:
- Your task involves cli tool: @pinecone-database/pinecone
- A task requires @pinecone-database/pinecone-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @pinecone-database/pinecone provides
