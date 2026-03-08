---
name: dask
version: 0.0.0
description: "CLI tool: dask. Use this skill when working with dask-related tasks."
ingredients:
  - dask/dask
tags:
  - cli
---

# dask

CLI tool: dask

## Usage

```bash
# Show help
dask --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run dask -- --help --json

# Introspect command schema
agents-cli schema dask --json

# Dry-run before executing
agents-cli run dask -- <args> --dry-run
```
