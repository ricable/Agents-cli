---
name: @langchain/community
version: 1.1.22
description: "CLI tool: @langchain/community. Use this skill whenever the user works with @langchain/community or tasks related to cli tool: @langchain/community — even if they don't mention "@langchain/community" by name."
ingredients:
  - @langchain/community
tags:
  - cli
---

# @langchain/community

CLI tool: @langchain/community

## Overview

@langchain/community provides cli tool: @langchain/community. Agents benefit from @langchain/community because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @langchain/community

# Or install directly via npm
npm install -g @langchain/community
```

## Usage

```bash
# Show help and available options
@langchain/community --help

# Check version
@langchain/community --version
```

Refer to the project documentation for detailed usage:
- https://github.com/@langchain/community

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @langchain/community

# 2. Verify installation
agents-cli run @langchain/community -- --version

# 3. Explore capabilities
agents-cli schema @langchain/community --json
```

### Piping with other tools

```bash
# Chain @langchain/community output with jq for structured processing
agents-cli run @langchain/community -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @langchain/community -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @langchain/community -- --help --json

# Introspect full command schema
agents-cli schema @langchain/community --json

# Dry-run before executing (safe exploration)
agents-cli run @langchain/community -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @langchain/community --json
```

## When to Use This Tool

Use `@langchain/community` when:
- Your task involves cli tool: @langchain/community
- A task requires @langchain/community-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @langchain/community provides
