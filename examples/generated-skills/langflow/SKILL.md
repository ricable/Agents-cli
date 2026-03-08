---
name: langflow
version: 0.0.0
description: "Langflow is a powerful tool for building and deploying AI-powered agents and workflows.. Use this skill whenever the user works with langflow or tasks related to langflow is a powerful tool for building and deploying ai-powered agents and workflows — even if they don't mention "langflow" by name."
ingredients:
  - langflow-ai/langflow
tags:
  - agents
  - chatgpt
  - generative-ai
  - large-language-models
  - multiagent
  - react-flow
  - cli
# homepage: http://www.langflow.org
# license: MIT
---

# langflow

Langflow is a powerful tool for building and deploying AI-powered agents and workflows.

**Source**: http://www.langflow.org

## Overview

langflow provides langflow is a powerful tool for building and deploying ai-powered agents and workflows. Agents benefit from langflow because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add langflow-ai/langflow

# Or clone from GitHub
git clone https://github.com/langflow-ai/langflow.git
```

## Usage

```bash
# Show help and available options
langflow --help

# Check version
langflow --version
```

Refer to the project documentation for detailed usage:
- http://www.langflow.org

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add langflow-ai/langflow

# 2. Verify installation
agents-cli run langflow -- --version

# 3. Explore capabilities
agents-cli schema langflow --json
```

### Piping with other tools

```bash
# Chain langflow output with jq for structured processing
agents-cli run langflow -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run langflow -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run langflow -- --help --json

# Introspect full command schema
agents-cli schema langflow --json

# Dry-run before executing (safe exploration)
agents-cli run langflow -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe langflow --json
```

## When to Use This Tool

Use `langflow` when:
- Your task involves langflow is a powerful tool for building and deploying ai-powered agents and workflows
- A task requires langflow-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what langflow provides
