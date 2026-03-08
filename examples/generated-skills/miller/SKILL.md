---
name: miller
version: 0.0.0
description: "Miller is like awk, sed, cut, join, and sort for name-indexed data such as CSV, TSV, and tabular JSON. Use this skill when working with miller-related tasks."
ingredients:
  - johnkerl/miller
tags:
  - command-line
  - command-line-tools
  - csv
  - csv-format
  - data-cleaning
  - data-processing
  - data-reduction
  - data-regression
  - devops
  - devops-tools
  - json
  - json-data
  - miller
  - statistical-analysis
  - statistics
  - streaming-algorithms
  - streaming-data
  - tabular-data
  - tsv
  - unix-toolkit
  - cli
# homepage: https://miller.readthedocs.io
# license: NOASSERTION
---

# miller

Miller is like awk, sed, cut, join, and sort for name-indexed data such as CSV, TSV, and tabular JSON

**Source**: https://miller.readthedocs.io

## Usage

```bash
# Show help
miller --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run miller -- --help --json

# Introspect command schema
agents-cli schema miller --json

# Dry-run before executing
agents-cli run miller -- <args> --dry-run
```
