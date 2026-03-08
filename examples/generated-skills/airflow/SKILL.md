---
name: airflow
version: 0.0.0
description: "CLI tool: airflow. Use this skill when working with airflow-related tasks."
ingredients:
  - apache/airflow
tags:
  - cli
---

# airflow

CLI tool: airflow

## Usage

```bash
# Show help
airflow --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run airflow -- --help --json

# Introspect command schema
agents-cli schema airflow --json

# Dry-run before executing
agents-cli run airflow -- <args> --dry-run
```
