---
name: code-search-workflow
version: 1.0.0
description: "Workflow for searching, exploring, and understanding codebases using rg, fd, fzf, bat, and jq. Use this skill whenever the user needs to search code, find definitions, explore a codebase, understand code structure, locate imports, find TODO/FIXME comments, trace function calls, or audit code patterns — even if they just say 'find where X is used' or 'search the codebase' or 'how does this work'."
ingredients:
  - BurntSushi/ripgrep
  - sharkdp/fd
  - junegunn/fzf
  - sharkdp/bat
  - jqlang/jq
tags:
  - workflow
  - code-search
  - codebase-exploration
  - refactoring
  - code-review
---

# Code Search & Exploration Workflow

This is a recipe skill. It combines `rg`, `fd`, `fzf`, `bat`, and `jq` into step-by-step workflows for searching and understanding codebases. Each section solves a specific problem an agent or developer encounters when navigating unfamiliar or large code.

---

## 1. Find Where Something Is Defined

Use this workflow when the user asks "where is X defined?", "find the definition of X", or "where does X come from?".

The key is word boundaries (`-w`) combined with language-aware type filters to eliminate noise from call sites.

### Step 1 — Narrow by language and definition pattern

Each language has distinct definition syntax. Target it directly:

```bash
# React component definition
rg -w "function UserProfile" -t tsx -t jsx -n
rg "export (default )?(function|const) UserProfile" -t tsx -n

# Python class or function
rg "^(class|def) UserProfile" -t py -n

# Go struct or function
rg "^(type UserProfile struct|func UserProfile)" -t go -n

# Rust struct, enum, or function
rg "^(pub )?(struct|enum|fn) UserProfile" -t rust -n

# TypeScript interface or type alias
rg "^export (interface|type) UserProfile" -t ts -n
```

### Step 2 — If the definition pattern is unclear, do a broad search and filter

```bash
rg -w "UserProfile" -n -C 2 | head -60
```

The `-C 2` context lines reveal whether a match is a definition (preceded by `class`, `function`, `struct`) or a usage.

### Step 3 — Preview the definition in context with bat

```bash
# Once you know the file and line, view the surrounding code
bat --highlight-line 42 --line-range 35:65 src/components/UserProfile.tsx
```

**Why bat:** Syntax highlighting and line ranges let you read the definition without opening an editor or printing the entire file.

---

## 2. Trace Usage of a Function or Variable

Use this when the user asks "where is X used?", "who calls X?", or "what depends on X?".

### Step 1 — Find all references

```bash
rg -w "processOrder" -n -t ts -t tsx
```

### Step 2 — Exclude the definition itself

Pipe through a second `rg -v` to remove lines that look like definitions:

```bash
rg -w "processOrder" -n -t ts -t tsx | rg -v "(function|const|let|var|def|type|interface)\s+processOrder"
```

### Step 3 — Show context at each call site

```bash
rg -w "processOrder" -A 3 -t ts -t tsx | rg -v "(function|const|let|var)\s+processOrder" -A 3
```

### Step 4 — Count usage to gauge impact

```bash
rg -w "processOrder" -c -t ts -t tsx
```

This outputs `file:count` pairs. High counts indicate hot paths; single-count files may be safe to refactor.

### Complete example — trace a function across a monorepo

```bash
# 1. Find the definition
rg "export (async )?function processOrder" -n -t ts
# => src/services/orders.ts:47

# 2. Find all call sites, excluding the definition file
rg -w "processOrder" -n -t ts -t tsx --glob '!src/services/orders.ts'

# 3. Get structured output for programmatic use
rg -w "processOrder" --json -t ts | jq -r '
  select(.type == "match") |
  "\(.data.path.text):\(.data.line_number): \(.data.lines.text | rtrimstr("\n"))"
'
```

---

## 3. Understand Project Structure

Use this when the user says "what does this project look like?", "give me an overview", or when you land in an unfamiliar repo.

### Step 1 — Map the directory layout

```bash
# Top-level directories
fd -t d -d 1

# Two levels deep for a clearer picture
fd -t d -d 2
```

### Step 2 — Find entry points

Every project has entry points. Find them:

```bash
# JavaScript/TypeScript entry points
fd -g '{main,index,app,server}.{ts,tsx,js,jsx,mjs}' -d 3

# Python entry points
fd -g '{main,app,wsgi,asgi,manage}.py' -d 3

# Go entry points
rg "^func main\(\)" -t go -l

# Rust entry points
fd -g 'main.rs' -d 3
```

### Step 3 — Identify the package manager and dependencies

```bash
# Find all manifest/lock files
fd -d 2 -g '{package.json,Cargo.toml,go.mod,pyproject.toml,requirements*.txt,Gemfile,pom.xml,build.gradle}'
```

### Complete example — 30-second repo orientation

```bash
# Run this sequence to orient yourself in any project
fd -t d -d 1                                                     # directory layout
fd -d 2 -g '{package.json,Cargo.toml,go.mod,pyproject.toml}'    # what language/tooling
fd -g '{main,index,app,server}.*' -d 3 -E node_modules          # entry points
rg -c "TODO|FIXME|HACK" --sort path | tail -20                  # tech debt hotspots
```

---

## 4. Find and Fix Patterns (Refactoring Prep)

Use this when the user wants to rename something, migrate an API, or audit before refactoring.

### Step 1 — Get structured match data

```bash
rg --json "oldFunctionName" -t ts | jq -r '
  select(.type == "match") |
  {
    file: .data.path.text,
    line: .data.line_number,
    text: (.data.lines.text | rtrimstr("\n"))
  }
'
```

### Step 2 — Count occurrences per file

```bash
rg -c "oldFunctionName" -t ts --sort path
```

This tells you which files have the most changes, so you can plan the refactor.

### Step 3 — Find files that need changes (filenames only)

```bash
rg -l "oldFunctionName" -t ts
```

### Step 4 — Preview replacements without modifying files

```bash
rg "oldFunctionName" -r "newFunctionName" -t ts -n
```

**Why rg for preview:** `rg -r` shows what the replacement would look like but never modifies files. This is safe for agents to run.

### Step 5 — Apply the replacement

```bash
# macOS (note the '' after -i)
rg -l "oldFunctionName" -t ts | xargs sed -i '' 's/oldFunctionName/newFunctionName/g'
# Linux: drop the '' after -i
```

### Complete example — rename an API endpoint

```bash
# 1. Audit: how many files reference the old endpoint?
rg -c "/api/v1/users" | sort -t: -k2 -rn

# 2. Preview the replacement
rg "/api/v1/users" -r "/api/v2/users" -n

# 3. Apply it
rg -l "/api/v1/users" | xargs sed -i '' 's|/api/v1/users|/api/v2/users|g'

# 4. Verify no references remain
rg "/api/v1/users" && echo "STILL FOUND" || echo "All replaced"
```

---

## 5. Search for Security Issues

Use this when the user asks for a security audit, pre-commit check, or when reviewing code for vulnerabilities.

### Hardcoded secrets and credentials

```bash
# API keys, tokens, passwords in source code
rg -i "(api[_-]?key|api[_-]?secret|access[_-]?token|auth[_-]?token|password|secret[_-]?key)\s*[:=]\s*[\"'][^\"']{8,}" \
  -t ts -t py -t go -t rust -t js --glob '!*.test.*' --glob '!*.spec.*' -n

# AWS keys (AKIA pattern)
rg "AKIA[0-9A-Z]{16}" -n

# Private keys
rg "BEGIN (RSA |EC |DSA )?PRIVATE KEY" -n

# Connection strings with passwords
rg -i "(mysql|postgres|mongodb|redis)://[^:]+:[^@]+@" -n
```

### Dangerous function calls

```bash
# JS/TS: eval, innerHTML, dangerouslySetInnerHTML
rg "(eval|Function)\s*\(" -t ts -t js -n
rg "innerHTML\s*=|dangerouslySetInnerHTML" -t tsx -t jsx -n

# Python: eval, exec, shell injection, pickle
rg "(eval|exec|compile)\s*\(" -t py -n
rg "subprocess\.(call|run|Popen).*shell\s*=\s*True" -t py -n

# SQL injection risks
rg -i "execute\s*\(\s*f[\"']" -t py -n
rg "query\s*\(\s*[\"']\s*SELECT.*\+\s*" -t ts -t js -n
```

### Sensitive files and complete pre-PR scan

```bash
# Find files that should not be committed
fd -H -g '.env*' -E '.env.example' -E '.env.template'
fd -e pem -e key -e p12 -e pfx -e jks

# All-in-one pre-PR security scan
rg -i "(api[_-]?key|password|secret)\s*[:=]\s*[\"'][^\"']{8,}" -n --glob '!*.test.*' | head -20
rg "(eval|exec|innerHTML|dangerouslySetInnerHTML)\s*[=(]" -n -t ts -t js -t py | head -20
rg -i "todo.*secur|fixme.*secur|hack.*auth" -n | head -20
```

---

## 6. Code Review Checklist

Use this when reviewing a PR, auditing code quality, or cleaning up before a release.

### Debug artifacts

```bash
# Console.log / print statements
rg "console\.(log|debug|info|warn|error)" -t ts -t js -n --glob '!*.test.*'
rg "^(\s*)print\(" -t py -n --glob '!test_*'

# Debugger statements
rg "debugger" -t ts -t js -n
rg "breakpoint\(\)" -t py -n
rg "binding\.pry" -t ruby -n

# Debug flags left on
rg -i "debug\s*[:=]\s*true" -n
```

### TODO/FIXME/HACK comments

```bash
# All annotation comments, sorted by file
rg "(TODO|FIXME|HACK|XXX|WARN|BUG)[\s:](.*)" -n --sort path

# Count per category
echo "TODO:  $(rg -c 'TODO' | paste -sd+ | bc)"
echo "FIXME: $(rg -c 'FIXME' | paste -sd+ | bc)"
echo "HACK:  $(rg -c 'HACK' | paste -sd+ | bc)"
```

### Complete example — pre-merge quality check

```bash
rg "console\.(log|debug)" -t ts -t js -c --glob '!*.test.*' --sort path
rg "debugger" -t ts -t js -l
rg "(TODO|FIXME|HACK)" -c --sort path | tail -10
fd -e ts -e tsx -x wc -l {} | awk '$1 > 500' | sort -rn | head -10
```

---

## 7. Search Across File Types

Use this when the user wants to search specific kinds of files or combine file-finding with content-searching.

### Target specific languages with rg

```bash
# Search React components only
rg "useState" -t tsx -t jsx -n

# Search config files only
rg "port" -g '*.{yaml,yml,toml,json,ini,conf}' -n

# Search everything EXCEPT tests
rg "fetchData" -t ts --glob '!*.test.*' --glob '!*.spec.*' --glob '!__tests__/**'
```

### Combine fd file-finding with rg content-searching

```bash
# Find config files, then search their contents
fd -g '*.config.*' -0 | xargs -0 rg "outputDir" -n

# Search only in recently modified files
fd -e ts --changed-within 1d -0 | xargs -0 rg "TODO" -n

# Search only in files larger than 1KB (skip stubs)
fd -e py -S +1k -0 | xargs -0 rg "class " -n

# Search test files for skipped tests
fd -g '*.test.*' -0 | xargs -0 rg "\.(skip|only)\(" -n
```

---

## 8. Interactive Exploration

Use this for hands-on browsing when the user wants to explore a codebase visually or doesn't know exactly what they are looking for.

### Browse files with fd + fzf + bat preview

```bash
# Interactive file browser with syntax-highlighted preview
fd -t f -e ts -e tsx | fzf --preview 'bat --color=always --style=numbers --line-range :100 {}'

# Open the selected file in your editor
fd -t f | fzf --preview 'bat --color=always {}' | xargs code
```

### Search interactively with rg + fzf

```bash
# Live grep: type a query, see results update in real time
FZF_DEFAULT_COMMAND='fd -t f' fzf --bind 'change:reload:rg --line-number --color=always {q} || true' \
  --ansi --disabled --preview 'bat --color=always --highlight-line {2} {1}' \
  --delimiter ':' --preview-window '+{2}/3'
```

### Browse search results with context

```bash
# Search, then pick a result to view in bat with highlight
rg -n "handleSubmit" -t tsx | fzf --delimiter ':' \
  --preview 'bat --color=always --highlight-line {2} --line-range {2}: {1}' \
  --preview-window 'right:60%'
```

---

## 9. Structured Output for Agents

Use this when building pipelines, generating reports, or feeding search results into other tools programmatically.

### Extract file, line, and match text from rg JSON

```bash
# Basic extraction: file:line: matched_text
rg --json "pattern" src/ | jq -r '
  select(.type == "match") |
  "\(.data.path.text):\(.data.line_number): \(.data.lines.text | rtrimstr("\n"))"
'
```

### Get just file paths and line numbers

```bash
rg --json "TODO" | jq -r '
  select(.type == "match") |
  "\(.data.path.text):\(.data.line_number)"
'
```

### Group matches by file with counts

```bash
rg --json "TODO" src/ | jq -s '
  [.[] | select(.type == "match")] |
  group_by(.data.path.text) |
  map({
    file: .[0].data.path.text,
    count: length,
    lines: [.[].data.line_number]
  }) |
  sort_by(-.count)
'
```

### Extract the matched substring only

```bash
rg --json "v\d+\.\d+\.\d+" CHANGELOG.md | jq -r '
  select(.type == "match") |
  .data.submatches[].match.text
'
```

### Build a JSON report of search results

```bash
rg --json "(TODO|FIXME|HACK)" src/ | jq -s '
  [.[] | select(.type == "match") |
  {
    file: .data.path.text,
    line: .data.line_number,
    category: (.data.submatches[0].match.text),
    text: (.data.lines.text | rtrimstr("\n") | ltrimstr(" \t"))
  }] |
  group_by(.category) |
  map({
    category: .[0].category,
    count: length,
    items: [.[] | {file, line, text}]
  })
'
```

### Pipe structured results to downstream tools

```bash
# Generate a list of files to lint, as a JSON array
rg -l "console\.log" -t ts --glob '!*.test.*' | jq -R -s 'split("\n") | map(select(. != ""))'

# Generate patch instructions for an agent
rg --json "oldFunction" -t ts | jq -r '
  select(.type == "match") |
  "In \(.data.path.text) at line \(.data.line_number), replace oldFunction with newFunction"
'
```

---

## Quick Reference: Which Tool When

| Task | Tool | Example |
|------|------|---------|
| Search file **contents** | `rg` | `rg "pattern" -t ts` |
| Find files by **name** | `fd` | `fd -g '*.config.*'` |
| **Interactive** selection | `fzf` | `fd -t f \| fzf` |
| **Pretty-print** a file | `bat` | `bat src/main.ts` |
| **Parse** structured output | `jq` | `rg --json \| jq ...` |
| Combine file-find + content-search | `fd` + `rg` | `fd -e ts -0 \| xargs -0 rg "pattern"` |
| Browse results interactively | `rg` + `fzf` + `bat` | See workflow 8 |
| Machine-readable results | `rg --json` + `jq` | See workflow 9 |
