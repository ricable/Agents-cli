---
name: @google/generative-ai
version: 0.24.1
description: "Google AI JavaScript SDK. Use this skill whenever the user works with @google/generative-ai or tasks related to google ai javascript sdk — even if they don't mention "@google/generative-ai" by name."
ingredients:
  - @google/generative-ai
tags:
  - cli
# homepage: https://github.com/google/generative-ai-js#readme
# license: Apache-2.0
---

# @google/generative-ai

Google AI JavaScript SDK

**Source**: https://github.com/google/generative-ai-js#readme

## Overview

@google/generative-ai provides google ai javascript sdk. Agents benefit from @google/generative-ai because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @google/generative-ai

# Or install directly via npm
npm install -g @google/generative-ai
```

## Usage

```bash
# Show help and available options
@google/generative-ai --help

# Check version
@google/generative-ai --version
```

Refer to the project documentation for detailed usage:
- https://github.com/google/generative-ai-js#readme

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @google/generative-ai

# 2. Verify installation
agents-cli run @google/generative-ai -- --version

# 3. Explore capabilities
agents-cli schema @google/generative-ai --json
```

### Piping with other tools

```bash
# Chain @google/generative-ai output with jq for structured processing
agents-cli run @google/generative-ai -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @google/generative-ai -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @google/generative-ai -- --help --json

# Introspect full command schema
agents-cli schema @google/generative-ai --json

# Dry-run before executing (safe exploration)
agents-cli run @google/generative-ai -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @google/generative-ai --json
```

## When to Use This Tool

Use `@google/generative-ai` when:
- Your task involves google ai javascript sdk
- A task requires @google/generative-ai-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @google/generative-ai provides
