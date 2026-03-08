---
name: genkit
version: 0.0.0
description: "CLI tool: genkit. Use this skill when working with genkit-related tasks."
ingredients:
  - firebase/genkit
tags:
  - cli
---

# genkit

CLI tool: genkit

## Usage

```bash
# Show help
genkit --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run genkit -- --help --json

# Introspect command schema
agents-cli schema genkit --json

# Dry-run before executing
agents-cli run genkit -- <args> --dry-run
```
