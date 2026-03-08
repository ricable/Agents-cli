---
name: text-generation-webui
version: 0.0.0
description: "The best local UI for large language models, with easy setup and powerful features. 100% offline.. Use this skill whenever the user works with text-generation-webui or tasks related to the best local ui for large language models, with easy setup and powerful features. 100% offline — even if they don't mention "text-generation-webui" by name."
ingredients:
  - oobabooga/text-generation-webui
tags:
  - cli
# homepage: https://oobabooga.gumroad.com/l/deep_reason
# license: AGPL-3.0
---

# text-generation-webui

The best local UI for large language models, with easy setup and powerful features. 100% offline.

**Source**: https://oobabooga.gumroad.com/l/deep_reason

## Overview

text-generation-webui provides the best local ui for large language models, with easy setup and powerful features. 100% offline. Agents benefit from text-generation-webui because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add oobabooga/text-generation-webui

# Or clone from GitHub
git clone https://github.com/oobabooga/text-generation-webui.git
```

## Usage

```bash
# Show help and available options
text-generation-webui --help

# Check version
text-generation-webui --version
```

Refer to the project documentation for detailed usage:
- https://oobabooga.gumroad.com/l/deep_reason

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add oobabooga/text-generation-webui

# 2. Verify installation
agents-cli run text-generation-webui -- --version

# 3. Explore capabilities
agents-cli schema text-generation-webui --json
```

### Piping with other tools

```bash
# Chain text-generation-webui output with jq for structured processing
agents-cli run text-generation-webui -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run text-generation-webui -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run text-generation-webui -- --help --json

# Introspect full command schema
agents-cli schema text-generation-webui --json

# Dry-run before executing (safe exploration)
agents-cli run text-generation-webui -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe text-generation-webui --json
```

## When to Use This Tool

Use `text-generation-webui` when:
- Your task involves the best local ui for large language models, with easy setup and powerful features. 100% offline
- A task requires text-generation-webui-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what text-generation-webui provides
