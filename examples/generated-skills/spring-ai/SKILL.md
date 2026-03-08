---
name: spring-ai
version: 0.0.0
description: "CLI tool: spring-ai. Use this skill whenever the user works with spring-ai or tasks related to cli tool: spring-ai — even if they don't mention "spring-ai" by name."
ingredients:
  - spring-projects/spring-ai
tags:
  - cli
---

# spring-ai

CLI tool: spring-ai

## Overview

spring-ai provides cli tool: spring-ai. Agents benefit from spring-ai because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add spring-projects/spring-ai

# Or clone from GitHub
git clone https://github.com/spring-projects/spring-ai.git
```

## Usage

```bash
# Show help and available options
spring-ai --help

# Check version
spring-ai --version
```

Refer to the project documentation for detailed usage:
- https://github.com/spring-projects/spring-ai

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add spring-projects/spring-ai

# 2. Verify installation
agents-cli run spring-ai -- --version

# 3. Explore capabilities
agents-cli schema spring-ai --json
```

### Piping with other tools

```bash
# Chain spring-ai output with jq for structured processing
agents-cli run spring-ai -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run spring-ai -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run spring-ai -- --help --json

# Introspect full command schema
agents-cli schema spring-ai --json

# Dry-run before executing (safe exploration)
agents-cli run spring-ai -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe spring-ai --json
```

## When to Use This Tool

Use `spring-ai` when:
- Your task involves cli tool: spring-ai
- A task requires spring-ai-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what spring-ai provides
