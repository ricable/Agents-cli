---
name: accelerate
version: 0.0.0
description: "🚀 A simple way to launch, train, and use PyTorch models on almost any device and distributed configuration, automatic mixed precision (including fp8), and easy-to-configure FSDP and DeepSpeed support. Use this skill whenever the user works with accelerate or tasks related to 🚀 a simple way to launch, train, and use pytorch models on almost any device and distributed configuration, automatic mixed precision (including fp8), and easy-to-configure fsdp and deepspeed support — even if they don't mention "accelerate" by name."
ingredients:
  - huggingface/accelerate
tags:
  - cli
# homepage: https://huggingface.co/docs/accelerate
# license: Apache-2.0
---

# accelerate

🚀 A simple way to launch, train, and use PyTorch models on almost any device and distributed configuration, automatic mixed precision (including fp8), and easy-to-configure FSDP and DeepSpeed support

**Source**: https://huggingface.co/docs/accelerate

## Overview

accelerate provides 🚀 a simple way to launch, train, and use pytorch models on almost any device and distributed configuration, automatic mixed precision (including fp8), and easy-to-configure fsdp and deepspeed support. Agents benefit from accelerate because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add huggingface/accelerate

# Or clone from GitHub
git clone https://github.com/huggingface/accelerate.git
```

## Usage

```bash
# Show help and available options
accelerate --help

# Check version
accelerate --version
```

Refer to the project documentation for detailed usage:
- https://huggingface.co/docs/accelerate

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add huggingface/accelerate

# 2. Verify installation
agents-cli run accelerate -- --version

# 3. Explore capabilities
agents-cli schema accelerate --json
```

### Piping with other tools

```bash
# Chain accelerate output with jq for structured processing
agents-cli run accelerate -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run accelerate -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run accelerate -- --help --json

# Introspect full command schema
agents-cli schema accelerate --json

# Dry-run before executing (safe exploration)
agents-cli run accelerate -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe accelerate --json
```

## When to Use This Tool

Use `accelerate` when:
- Your task involves 🚀 a simple way to launch, train, and use pytorch models on almost any device and distributed configuration, automatic mixed precision (including fp8), and easy-to-configure fsdp and deepspeed support
- A task requires accelerate-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what accelerate provides
