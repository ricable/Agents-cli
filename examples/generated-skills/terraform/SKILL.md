---
name: terraform
version: 0.0.0
description: "CLI tool: terraform. Use this skill when working with terraform-related tasks."
ingredients:
  - hashicorp/terraform
tags:
  - cli
---

# terraform

CLI tool: terraform

## Usage

```bash
# Show help
terraform --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run terraform -- --help --json

# Introspect command schema
agents-cli schema terraform --json

# Dry-run before executing
agents-cli run terraform -- <args> --dry-run
```
