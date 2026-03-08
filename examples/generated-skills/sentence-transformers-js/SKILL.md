---
name: @xenova/transformers
version: 2.17.2
description: "State-of-the-art Machine Learning for the web. Run 🤗 Transformers directly in your browser, with no need for a server!. Use this skill whenever the user works with @xenova/transformers or tasks related to state-of-the-art machine learning for the web. run 🤗 transformers directly in your browser, with no need for a server! — even if they don't mention "@xenova/transformers" by name."
ingredients:
  - @xenova/transformers
tags:
  - transformers
  - transformers.js
  - huggingface
  - hugging face
  - machine learning
  - deep learning
  - artificial intelligence
  - AI
  - ML
  - cli
# homepage: https://github.com/xenova/transformers.js#readme
# license: Apache-2.0
---

# @xenova/transformers

State-of-the-art Machine Learning for the web. Run 🤗 Transformers directly in your browser, with no need for a server!

**Source**: https://github.com/xenova/transformers.js#readme

## Overview

@xenova/transformers provides state-of-the-art machine learning for the web. run 🤗 transformers directly in your browser, with no need for a server!. Agents benefit from @xenova/transformers because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @xenova/transformers

# Or install directly via npm
npm install -g @xenova/transformers
```

## Usage

```bash
# Show help and available options
@xenova/transformers --help

# Check version
@xenova/transformers --version
```

Refer to the project documentation for detailed usage:
- https://github.com/xenova/transformers.js#readme

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @xenova/transformers

# 2. Verify installation
agents-cli run @xenova/transformers -- --version

# 3. Explore capabilities
agents-cli schema @xenova/transformers --json
```

### Piping with other tools

```bash
# Chain @xenova/transformers output with jq for structured processing
agents-cli run @xenova/transformers -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @xenova/transformers -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @xenova/transformers -- --help --json

# Introspect full command schema
agents-cli schema @xenova/transformers --json

# Dry-run before executing (safe exploration)
agents-cli run @xenova/transformers -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @xenova/transformers --json
```

## When to Use This Tool

Use `@xenova/transformers` when:
- Your task involves state-of-the-art machine learning for the web. run 🤗 transformers directly in your browser, with no need for a server!
- A task requires @xenova/transformers-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @xenova/transformers provides
