---
name: airflow
version: 0.0.0
description: "CLI tool: airflow. Use this skill whenever the user works with airflow or tasks related to cli tool: airflow — even if they don't mention "airflow" by name."
ingredients:
  - apache/airflow
tags:
  - cli
---

# airflow

CLI tool: airflow

## Overview

airflow provides cli tool: airflow. Agents benefit from airflow because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add apache/airflow

# Or clone from GitHub
git clone https://github.com/apache/airflow.git
```

## Usage

```bash
# Show help and available options
airflow --help

# Check version
airflow --version
```

Refer to the project documentation for detailed usage:
- https://github.com/apache/airflow

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add apache/airflow

# 2. Verify installation
agents-cli run airflow -- --version

# 3. Explore capabilities
agents-cli schema airflow --json
```

### Piping with other tools

```bash
# Chain airflow output with jq for structured processing
agents-cli run airflow -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run airflow -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run airflow -- --help --json

# Introspect full command schema
agents-cli schema airflow --json

# Dry-run before executing (safe exploration)
agents-cli run airflow -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe airflow --json
```

## When to Use This Tool

Use `airflow` when:
- Your task involves cli tool: airflow
- A task requires airflow-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what airflow provides
