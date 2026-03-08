---
name: @langchain/langgraph
version: 1.2.1
description: "CLI tool: @langchain/langgraph. Use this skill whenever the user works with @langchain/langgraph or tasks related to cli tool: @langchain/langgraph — even if they don't mention "@langchain/langgraph" by name."
ingredients:
  - @langchain/langgraph
tags:
  - cli
---

# @langchain/langgraph

CLI tool: @langchain/langgraph

## Overview

@langchain/langgraph provides cli tool: @langchain/langgraph. Agents benefit from @langchain/langgraph because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @langchain/langgraph

# Or install directly via npm
npm install -g @langchain/langgraph
```

## Usage

```bash
# Show help and available options
@langchain/langgraph --help

# Check version
@langchain/langgraph --version
```

Refer to the project documentation for detailed usage:
- https://github.com/@langchain/langgraph

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @langchain/langgraph

# 2. Verify installation
agents-cli run @langchain/langgraph -- --version

# 3. Explore capabilities
agents-cli schema @langchain/langgraph --json
```

### Piping with other tools

```bash
# Chain @langchain/langgraph output with jq for structured processing
agents-cli run @langchain/langgraph -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @langchain/langgraph -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @langchain/langgraph -- --help --json

# Introspect full command schema
agents-cli schema @langchain/langgraph --json

# Dry-run before executing (safe exploration)
agents-cli run @langchain/langgraph -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @langchain/langgraph --json
```

## When to Use This Tool

Use `@langchain/langgraph` when:
- Your task involves cli tool: @langchain/langgraph
- A task requires @langchain/langgraph-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @langchain/langgraph provides
