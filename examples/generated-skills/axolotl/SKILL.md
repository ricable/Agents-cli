---
name: axolotl
version: 0.0.0
description: "CLI tool: axolotl. Use this skill when working with axolotl-related tasks."
ingredients:
  - axolotl-ai-cloud/axolotl
tags:
  - cli
---

# axolotl

CLI tool: axolotl

## Usage

```bash
# Show help
axolotl --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run axolotl -- --help --json

# Introspect command schema
agents-cli schema axolotl --json

# Dry-run before executing
agents-cli run axolotl -- <args> --dry-run
```
