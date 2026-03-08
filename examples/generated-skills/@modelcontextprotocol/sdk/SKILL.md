---
name: @modelcontextprotocol/sdk
version: 1.27.1
description: "Model Context Protocol implementation for TypeScript. Use this skill whenever the user works with @modelcontextprotocol/sdk or tasks related to model context protocol implementation for typescript — even if they don't mention "@modelcontextprotocol/sdk" by name."
ingredients:
  - @modelcontextprotocol/sdk
tags:
  - modelcontextprotocol
  - mcp
  - cli
# homepage: https://modelcontextprotocol.io
# license: MIT
---

# @modelcontextprotocol/sdk

Model Context Protocol implementation for TypeScript

**Source**: https://modelcontextprotocol.io

## Overview

@modelcontextprotocol/sdk provides model context protocol implementation for typescript. Agents benefit from @modelcontextprotocol/sdk because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @modelcontextprotocol/sdk

# Or install directly via npm
npm install -g @modelcontextprotocol/sdk
```

## Usage

```bash
# Show help and available options
@modelcontextprotocol/sdk --help

# Check version
@modelcontextprotocol/sdk --version
```

Refer to the project documentation for detailed usage:
- https://modelcontextprotocol.io

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @modelcontextprotocol/sdk

# 2. Verify installation
agents-cli run @modelcontextprotocol/sdk -- --version

# 3. Explore capabilities
agents-cli schema @modelcontextprotocol/sdk --json
```

### Piping with other tools

```bash
# Chain @modelcontextprotocol/sdk output with jq for structured processing
agents-cli run @modelcontextprotocol/sdk -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @modelcontextprotocol/sdk -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @modelcontextprotocol/sdk -- --help --json

# Introspect full command schema
agents-cli schema @modelcontextprotocol/sdk --json

# Dry-run before executing (safe exploration)
agents-cli run @modelcontextprotocol/sdk -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @modelcontextprotocol/sdk --json
```

## When to Use This Tool

Use `@modelcontextprotocol/sdk` when:
- Your task involves model context protocol implementation for typescript
- A task requires @modelcontextprotocol/sdk-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @modelcontextprotocol/sdk provides
