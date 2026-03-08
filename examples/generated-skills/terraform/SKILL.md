---
name: terraform
version: 0.0.0
description: "CLI tool: terraform. Use this skill whenever the user works with terraform or tasks related to cli tool: terraform — even if they don't mention "terraform" by name."
ingredients:
  - hashicorp/terraform
tags:
  - cli
---

# terraform

CLI tool: terraform

## Overview

terraform provides cli tool: terraform. Agents benefit from terraform because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add hashicorp/terraform

# Or clone from GitHub
git clone https://github.com/hashicorp/terraform.git
```

## Usage

```bash
# Show help and available options
terraform --help

# Check version
terraform --version
```

Refer to the project documentation for detailed usage:
- https://github.com/hashicorp/terraform

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add hashicorp/terraform

# 2. Verify installation
agents-cli run terraform -- --version

# 3. Explore capabilities
agents-cli schema terraform --json
```

### Piping with other tools

```bash
# Chain terraform output with jq for structured processing
agents-cli run terraform -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run terraform -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run terraform -- --help --json

# Introspect full command schema
agents-cli schema terraform --json

# Dry-run before executing (safe exploration)
agents-cli run terraform -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe terraform --json
```

## When to Use This Tool

Use `terraform` when:
- Your task involves cli tool: terraform
- A task requires terraform-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what terraform provides
