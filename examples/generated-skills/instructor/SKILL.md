---
name: instructor
version: 0.0.0
description: "CLI tool: instructor. Use this skill whenever the user works with instructor or tasks related to cli tool: instructor — even if they don't mention "instructor" by name."
ingredients:
  - instructor-ai/instructor
tags:
  - cli
---

# instructor

CLI tool: instructor

## Overview

instructor provides cli tool: instructor. Agents benefit from instructor because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add instructor-ai/instructor

# Or clone from GitHub
git clone https://github.com/instructor-ai/instructor.git
```

## Usage

```bash
# Show help and available options
instructor --help

# Check version
instructor --version
```

Refer to the project documentation for detailed usage:
- https://github.com/instructor-ai/instructor

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add instructor-ai/instructor

# 2. Verify installation
agents-cli run instructor -- --version

# 3. Explore capabilities
agents-cli schema instructor --json
```

### Piping with other tools

```bash
# Chain instructor output with jq for structured processing
agents-cli run instructor -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run instructor -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run instructor -- --help --json

# Introspect full command schema
agents-cli schema instructor --json

# Dry-run before executing (safe exploration)
agents-cli run instructor -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe instructor --json
```

## When to Use This Tool

Use `instructor` when:
- Your task involves cli tool: instructor
- A task requires instructor-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what instructor provides
