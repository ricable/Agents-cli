---
name: text-generation-webui
version: 0.0.0
description: "The best local UI for large language models, with easy setup and powerful features. 100% offline.. Use this skill when working with text-generation-webui-related tasks."
ingredients:
  - oobabooga/text-generation-webui
tags:
  - cli
# homepage: https://oobabooga.gumroad.com/l/deep_reason
# license: AGPL-3.0
---

# text-generation-webui

The best local UI for large language models, with easy setup and powerful features. 100% offline.

**Source**: https://oobabooga.gumroad.com/l/deep_reason

## Usage

```bash
# Show help
text-generation-webui --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run text-generation-webui -- --help --json

# Introspect command schema
agents-cli schema text-generation-webui --json

# Dry-run before executing
agents-cli run text-generation-webui -- <args> --dry-run
```
