---
name: braintrust-sdk
version: 0.0.1
description: "CLI tool: braintrust-sdk. Use this skill when working with braintrust-sdk-related tasks."
ingredients:
  - braintrustdata/braintrust-sdk
tags:
  - cli
---

# braintrust-sdk

CLI tool: braintrust-sdk

## Usage

```bash
# Show help
braintrust-sdk --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run braintrust-sdk -- --help --json

# Introspect command schema
agents-cli schema braintrust-sdk --json

# Dry-run before executing
agents-cli run braintrust-sdk -- <args> --dry-run
```
