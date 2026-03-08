---
name: @mistralai/mistralai
version: 1.14.1
description: "<!-- Start Summary [summary] --> ## Summary. Use this skill whenever the user works with @mistralai/mistralai or tasks related to <!-- start summary [summary] --> ## summary — even if they don't mention "@mistralai/mistralai" by name."
ingredients:
  - @mistralai/mistralai
tags:
  - cli
# homepage: https://github.com/mistralai/client-ts#readme
---

# @mistralai/mistralai

<!-- Start Summary [summary] --> ## Summary

**Source**: https://github.com/mistralai/client-ts#readme

## Overview

@mistralai/mistralai provides <!-- start summary [summary] --> ## summary. Agents benefit from @mistralai/mistralai because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @mistralai/mistralai

# Or install directly via npm
npm install -g @mistralai/mistralai
```

## Usage

```bash
# Show help and available options
@mistralai/mistralai --help

# Check version
@mistralai/mistralai --version
```

Refer to the project documentation for detailed usage:
- https://github.com/mistralai/client-ts#readme

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @mistralai/mistralai

# 2. Verify installation
agents-cli run @mistralai/mistralai -- --version

# 3. Explore capabilities
agents-cli schema @mistralai/mistralai --json
```

### Piping with other tools

```bash
# Chain @mistralai/mistralai output with jq for structured processing
agents-cli run @mistralai/mistralai -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @mistralai/mistralai -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @mistralai/mistralai -- --help --json

# Introspect full command schema
agents-cli schema @mistralai/mistralai --json

# Dry-run before executing (safe exploration)
agents-cli run @mistralai/mistralai -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @mistralai/mistralai --json
```

## When to Use This Tool

Use `@mistralai/mistralai` when:
- Your task involves <!-- start summary [summary] --> ## summary
- A task requires @mistralai/mistralai-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @mistralai/mistralai provides
