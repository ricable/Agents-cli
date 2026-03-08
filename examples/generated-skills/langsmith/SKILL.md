---
name: langsmith-sdk
version: 0.0.0
description: "CLI tool: langsmith-sdk. Use this skill whenever the user works with langsmith-sdk or tasks related to cli tool: langsmith-sdk — even if they don't mention "langsmith-sdk" by name."
ingredients:
  - langchain-ai/langsmith-sdk
tags:
  - cli
---

# langsmith-sdk

CLI tool: langsmith-sdk

## Overview

langsmith-sdk provides cli tool: langsmith-sdk. Agents benefit from langsmith-sdk because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add langchain-ai/langsmith-sdk

# Or clone from GitHub
git clone https://github.com/langchain-ai/langsmith-sdk.git
```

## Usage

```bash
# Show help and available options
langsmith-sdk --help

# Check version
langsmith-sdk --version
```

Refer to the project documentation for detailed usage:
- https://github.com/langchain-ai/langsmith-sdk

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add langchain-ai/langsmith-sdk

# 2. Verify installation
agents-cli run langsmith-sdk -- --version

# 3. Explore capabilities
agents-cli schema langsmith-sdk --json
```

### Piping with other tools

```bash
# Chain langsmith-sdk output with jq for structured processing
agents-cli run langsmith-sdk -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run langsmith-sdk -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run langsmith-sdk -- --help --json

# Introspect full command schema
agents-cli schema langsmith-sdk --json

# Dry-run before executing (safe exploration)
agents-cli run langsmith-sdk -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe langsmith-sdk --json
```

## When to Use This Tool

Use `langsmith-sdk` when:
- Your task involves cli tool: langsmith-sdk
- A task requires langsmith-sdk-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what langsmith-sdk provides
