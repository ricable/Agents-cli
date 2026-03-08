---
name: trivy
version: 0.0.0
description: "CLI tool: trivy. Use this skill when working with trivy-related tasks."
ingredients:
  - aquasecurity/trivy
tags:
  - cli
---

# trivy

CLI tool: trivy

## Usage

```bash
# Show help
trivy --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run trivy -- --help --json

# Introspect command schema
agents-cli schema trivy --json

# Dry-run before executing
agents-cli run trivy -- <args> --dry-run
```
