---
name: llama.cpp
version: 0.0.0
description: "LLM inference in C/C++. Use this skill whenever the user works with llama.cpp or tasks related to llm inference in c/c++ — even if they don't mention "llama.cpp" by name."
ingredients:
  - ggml-org/llama.cpp
tags:
  - ggml
  - cli
# homepage: https://github.com/ggml-org/llama.cpp
# license: MIT
---

# llama.cpp

LLM inference in C/C++

**Source**: https://github.com/ggml-org/llama.cpp

## Overview

llama.cpp provides llm inference in c/c++. Agents benefit from llama.cpp because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add ggml-org/llama.cpp

# Or clone from GitHub
git clone https://github.com/ggml-org/llama.cpp.git
```

## Usage

```bash
# Show help and available options
llama.cpp --help

# Check version
llama.cpp --version
```

Refer to the project documentation for detailed usage:
- https://github.com/ggml-org/llama.cpp

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add ggml-org/llama.cpp

# 2. Verify installation
agents-cli run llama.cpp -- --version

# 3. Explore capabilities
agents-cli schema llama.cpp --json
```

### Piping with other tools

```bash
# Chain llama.cpp output with jq for structured processing
agents-cli run llama.cpp -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run llama.cpp -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run llama.cpp -- --help --json

# Introspect full command schema
agents-cli schema llama.cpp --json

# Dry-run before executing (safe exploration)
agents-cli run llama.cpp -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe llama.cpp --json
```

## When to Use This Tool

Use `llama.cpp` when:
- Your task involves llm inference in c/c++
- A task requires llama.cpp-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what llama.cpp provides
