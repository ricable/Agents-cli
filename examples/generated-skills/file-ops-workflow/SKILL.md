---
name: file-ops-workflow
version: 1.0.0
description: "File operations workflow using fd, eza, bat, fzf, and rg for finding, viewing, organizing, and managing files. Use this skill whenever the user needs to find files, browse directories, view file contents, organize files, clean up disk space, find duplicates, manage large files, or do any file system operation — even if they just say 'find large files' or 'show me the project structure' or 'clean up temp files' or 'what files changed recently'."
ingredients:
  - sharkdp/fd
  - eza-community/eza
  - sharkdp/bat
  - junegunn/fzf
  - BurntSushi/ripgrep
  - jqlang/jq
tags:
  - workflow
  - files
  - filesystem
  - cleanup
  - organization
---

# File Operations Workflow

A step-by-step recipe for file discovery, viewing, organization, and cleanup. Each workflow combines multiple tools — fd, eza, bat, fzf, rg, jq — into a pipeline that solves a real task. Follow the numbered steps in order.

---

## 1. Explore Project Structure

**When to use:** The user asks to "show the project", "what's in this repo", "give me an overview", or you need orientation in an unfamiliar codebase.

**Why this order:** Start broad (tree view), then drill into specifics. A tree-first approach prevents wasting time on files that don't matter.

### Step 1 — Get the high-level tree

```bash
eza --tree --level 3 --git-ignore --icons --group-directories-first
```

This shows 3 levels deep, skips gitignored noise (node_modules, dist, .next), and groups directories at the top so the structure reads naturally.

### Step 2 — Identify key file types

```bash
fd -t f | awk -F. '{print $NF}' | sort | uniq -c | sort -rn | head -20
```

This tells you what languages and formats dominate the project. A project with 200 `.ts` files and 5 `.py` files is a TypeScript project.

### Step 3 — Find entry points and configs

```bash
fd -d 2 -g '{main,index,app,server}.{ts,js,py,go,rs}'
fd -d 1 -g '*.config.*' -g '.*rc' -g '.*rc.{js,ts,json,yaml,yml}' -H
fd -d 1 -g '{Makefile,Dockerfile,docker-compose.*,Cargo.toml,go.mod,package.json,pyproject.toml}'
```

### Step 4 — View a key file with syntax highlighting

```bash
bat --style=header,grid,numbers package.json
```

Use `bat` instead of `cat` because syntax highlighting makes config files readable at a glance.

### Full pipeline example

```bash
# One-shot project overview: tree + file stats
eza -T -L 2 --git-ignore --icons && echo "---" && \
fd -t f | awk -F. '{print $NF}' | sort | uniq -c | sort -rn | head -10
```

---

## 2. Find and View Files Interactively

**When to use:** The user says "find that config file", "where's the auth module", "I need to look at something but I'm not sure of the exact name."

**Why fzf:** When the exact filename is uncertain, interactive fuzzy search beats guessing with regexes. The preview pane lets you confirm you found the right file without opening it.

### Step 1 — Launch interactive finder with preview

```bash
fd -t f | fzf --preview 'bat --color=always --style=numbers --line-range=:100 {}'
```

This lists all files, lets you type to fuzzy-filter, and shows a syntax-highlighted preview of the selected file.

### Step 2 — Narrow or act on the result

```bash
# Filter by extension
fd -t f -e ts -e tsx | fzf --preview 'bat --color=always {}'

# Open selected file in editor
fd -t f | fzf --preview 'bat --color=always {}' | xargs -r $EDITOR

# Multi-select mode (Tab to mark multiple files)
fd -t f | fzf -m --preview 'bat --color=always {}'

# Search only in a specific directory
fd -t f . src/ | fzf --preview 'bat --color=always {}'
```

---

## 3. Find Large Files and Clean Up

**When to use:** "Disk is full", "what's taking up space", "clean up this project", "find large files".

**Why this workflow:** Large files hide in unexpected places — .git/objects, forgotten build artifacts, vendored binaries. A systematic sweep catches them all.

### Step 1 — Find files over 10MB

```bash
fd -t f -S +10m -X ls -lhS
```

The `-X ls -lhS` runs `ls` once with all results, sorting by size (largest first) with human-readable units.

### Step 2 — Check by category

```bash
# Large media files
fd -t f -S +5m -e mp4 -e avi -e mov -e png -e jpg -e gif

# Large data files
fd -t f -S +5m -e csv -e json -e sql -e parquet

# Large log files
fd -t f -S +1m -e log

# Build artifacts that shouldn't be committed
fd -t f -S +1m -I . dist/ build/ .next/ target/ out/ 2>/dev/null
```

```bash
# Check .git size
du -sh .git/

# Preview what would be deleted (ALWAYS preview first)
fd -t f -e log --changed-before 30d
echo "--- The above files would be deleted ---"

# Delete old logs after confirming
fd -t f -e log --changed-before 30d -x rm {}

# Clean common caches
fd -t d -g '{node_modules,.next,dist,build,__pycache__,.mypy_cache}' -d 2

# Git garbage collection
git gc --prune=now --aggressive
```

---

## 4. Find Recently Modified Files

**When to use:** "What changed recently", "what was I working on", "show recent files", "what files did I touch today".

**Why combine tools:** `fd` filters by modification time, `eza` sorts and formats the output beautifully. Together they answer "what changed" at a glance.

### Step 1 — Files changed in the last hour

```bash
fd -t f --changed-within 1h
```

### Step 2 — Files changed today with pretty output

```bash
fd -t f --changed-within 1d -E node_modules -E .git -0 | \
  xargs -0 eza -l -s modified --time-style=relative --icons
```

### Step 3 — Files changed this week, grouped by type

```bash
fd -t f --changed-within 7d -E node_modules -E .git | \
  awk -F. '{print $NF}' | sort | uniq -c | sort -rn
```

### Git-aware alternative

```bash
git diff --name-only                                          # Uncommitted changes
git diff --name-only HEAD~5                                   # Last 5 commits
eza -l --git -s modified --time-style=relative --icons        # Pretty git status
```

---

## 5. Bulk Rename Files

**When to use:** "Rename all these files", "change extensions", "fix naming convention", "convert filenames to lowercase".

**Why fd here:** `fd -x` runs a command per file in parallel with powerful placeholders (`{/}` for filename, `{.}` for path-without-extension, `{//}` for parent dir). This replaces fragile `for` loops.

### Step 1 — Preview what would change (ALWAYS do this first)

```bash
# Show files that match before renaming
fd -e jpeg
```

### Step 2 — Rename with fd placeholders

```bash
# Change .jpeg to .jpg
fd -e jpeg -x mv {} {.}.jpg

# Explanation of placeholders:
#   {}   = full path:  photos/vacation/beach.jpeg
#   {.}  = without ext: photos/vacation/beach
#   {/}  = filename:   beach.jpeg
#   {//} = parent dir: photos/vacation
#   {/.} = filename without ext: beach
```

### Step 3 — More rename patterns

```bash
# Batch rename with 'rename' utility (Perl-based)
fd -e .JPG -X rename 's/\.JPG$/.jpg/'

# Add a prefix to all matching files
fd -g 'test_*' -x mv {} {//}/unit_{/}

# Lowercase all filenames in a directory
fd -t f -d 1 -x bash -c 'mv "$0" "$(echo "$0" | tr "[:upper:]" "[:lower:]")"' {}
```

---

## 6. Find Files by Content

**When to use:** "Find where this function is defined", "which files use this API key", "search for TODO comments", "find all imports of X".

**Why rg + bat:** `rg` finds matches fast (respects .gitignore, multi-threaded), `bat` shows context with syntax highlighting. Together they replace "grep + open file + scroll around".

### Step 1 — Find files containing a pattern

```bash
# List files containing the pattern (just filenames)
rg -l 'TODO|FIXME|HACK'

# Show matches with context
rg -n -C 2 'TODO|FIXME|HACK'
```

### Step 2 — View matches with syntax highlighting

```bash
# Find and display each matching file beautifully
rg -l 'fetchUser' | xargs bat --style=numbers --highlight-line
```

Or use rg's built-in color and paging:

```bash
rg --color=always -n -C 3 'fetchUser' | bat --style=plain
```

### Step 3 — Interactive content search with fzf

```bash
# Search content interactively: type pattern, see matches, preview file
rg --color=always --line-number --no-heading '' | \
  fzf --ansi --delimiter ':' \
      --preview 'bat --color=always --highlight-line {2} {1}' \
      --preview-window '+{2}-5'
```

### Common search patterns

```bash
# Find function definitions (TypeScript)
rg 'function\s+\w+|const\s+\w+\s*=' -t ts

# Find all imports of a module
rg "from ['\"].*module-name['\"]" -t ts

# Find all environment variable usage
rg 'process\.env\.\w+' -t ts -o | sort -u

# Search and count matches per file
rg -c 'console\.log' -t ts | sort -t: -k2 -rn
```

---

## 7. Find Unused or Orphaned Files

**When to use:** "Find dead code", "what files aren't used", "clean up unused components", "find orphaned modules".

**Why this approach:** An unused file is one that no other file references. By checking each filename against the entire codebase, you surface files nobody imports or requires.

### Step 1 — Find files not referenced anywhere

```bash
fd -e ts -e tsx -E '*.test.*' -E '*.spec.*' -E 'node_modules' | while read f; do
  base=$(basename "$f" | sed 's/\.[^.]*$//')
  # Skip index files (they're entry points)
  [ "$base" = "index" ] && continue
  # Check if any other file references this module
  count=$(rg -l --fixed-strings "$base" --type ts --type tsx 2>/dev/null | grep -v "$f" | wc -l)
  if [ "$count" -eq 0 ]; then
    echo "UNUSED: $f"
  fi
done
```

### Step 2 — Check for unreferenced assets

```bash
fd -e png -e jpg -e svg -e gif | while read f; do
  name=$(basename "$f")
  refs=$(rg -l --fixed-strings "$name" -t ts -t html -t css 2>/dev/null | wc -l)
  [ "$refs" -eq 0 ] && echo "UNREFERENCED ASSET: $f"
done
```

### Caveats

Dynamic imports and config-referenced files won't be caught. Always review results before deleting — this identifies candidates, not certainties.

---

## 8. Disk Usage Analysis

**When to use:** "How big is this project", "what's using disk space", "directory sizes", "show me the heaviest folders".

**Why combine eza + du:** `eza` gives pretty per-file sizes, `du` gives directory totals. Neither alone answers "where is the space going" — together they do.

### Step 1 — Per-file sizes in the current directory

```bash
eza -la --sort size --reverse --icons --colour-scale
```

The `--colour-scale` flag color-codes sizes: small files are green, large files are red. Instantly spot the heavy hitters.

### Step 2 — Directory sizes (top-level)

```bash
du -sh */ 2>/dev/null | sort -rh | head -20
```

### Step 3 — Deep directory analysis

```bash
# macOS
du -hd 2 . 2>/dev/null | sort -rh | head -20
# Linux
du -h --max-depth=2 . 2>/dev/null | sort -rh | head -20
```

### Step 4 — Targeted analysis with fd

```bash
# Total size of all TypeScript files
fd -e ts -0 | xargs -0 du -ch | tail -1

# Total size of all image files
fd -e png -e jpg -e gif -e svg -0 | xargs -0 du -ch | tail -1
```

---

## 9. File Type Statistics

**When to use:** "What languages are in this project", "file type breakdown", "how many files of each type".

**Why:** Understanding the file composition tells you what tools, linters, and workflows apply. A project with 500 `.go` files needs different handling than one with 500 `.py` files.

### Step 1 — Count files by extension

```bash
fd -t f | awk -F. '{print $NF}' | sort | uniq -c | sort -rn
```

### Step 2 — Visual breakdown with bar chart

```bash
fd -t f | awk -F. '{print $NF}' | sort | uniq -c | sort -rn | head -15 | \
  awk '{printf "%-10s %6d ", $2, $1; for(i=0;i<$1/10;i++) printf "#"; print ""}'
```

### Step 3 — Compare source vs generated

```bash
echo "=== Source files ==="
fd -t f --git-ignore -E '*.min.*' -E '*.d.ts' -E '*.map' | \
  awk -F. '{print $NF}' | sort | uniq -c | sort -rn

echo "=== Generated/build files ==="
fd -t f -I -g '*.min.*' -g '*.d.ts' -g '*.map' | \
  awk -F. '{print $NF}' | sort | uniq -c | sort -rn
```

---

## 10. Batch File Operations with Safety

**When to use:** Any destructive file operation — deleting, moving, or modifying files in bulk.

**Why safety first:** Bulk operations are irreversible. Always preview, confirm, then execute. A deleted file is gone. A moved file in the wrong place wastes hours.

### Rule 1 — Always preview before acting

```bash
# BAD: deletes immediately with no preview
fd -e tmp -x rm {}

# GOOD: preview first, then delete
fd -e tmp
echo "--- Found the above files. Delete them? ---"
# Only after confirming:
fd -e tmp -x rm {}
```

### Rule 2 — Use echo to dry-run commands

```bash
# Dry-run: see what WOULD happen
fd -e bak -x echo rm {}
fd -e jpg -x echo mv {} /backup/photos/{/}

# When satisfied, remove 'echo':
fd -e bak -x rm {}
```

### Rule 3 — Move to trash instead of deleting

```bash
# macOS: move to Trash instead of permanent delete
fd -e log --changed-before 30d -x mv {} ~/.Trash/
# Linux: use trash-cli if available
fd -e log --changed-before 30d -x trash-put {}
```

### Rule 4 — In a git repo, use git as your safety net

```bash
git status --short        # Check before
fd -e ts -x prettier --write {}
git diff --stat           # Review what changed
# git checkout -- .       # Undo if something went wrong
```

### Safe cleanup recipes

```bash
# Remove empty directories (safe — they're empty)
fd -t d -t e -x rmdir {} 2>/dev/null

# Remove macOS metadata files
fd -H -g '.DS_Store' -x rm {}
fd -H -g '._*' -x rm {}

# Remove editor swap/backup files
fd -H -g '*.swp' -g '*~' -g '*.swo' -x rm {}

# Clean Python caches
fd -t d -g '__pycache__' -x rm -rf {}
fd -e pyc -x rm {}

# Clean Node.js project for fresh install
fd -t d -g 'node_modules' -d 2 -x rm -rf {}
fd -g 'package-lock.json' -g 'yarn.lock' -d 2
```

---

## Quick Reference — Tool Selection

Pick the right tool for the job:

| Task | Primary Tool | Why |
|------|-------------|-----|
| Find files by name/pattern | `fd` | Fast, respects .gitignore, regex + glob |
| List directory contents | `eza` | Pretty output, git integration, tree view |
| View file contents | `bat` | Syntax highlighting, line numbers, paging |
| Interactive selection | `fzf` | Fuzzy search, preview pane, multi-select |
| Search file contents | `rg` | Fastest grep, respects .gitignore, regex |
| Process JSON | `jq` | Filter, transform, format JSON data |

### Combining tools — common pipes

```bash
fd -t f | fzf --preview 'bat --color=always {}'    # Find -> Preview -> Select
fd -e ts -0 | xargs -0 rg 'pattern'                # Find -> Search contents
rg -l 'pattern' | xargs bat                         # Search -> View with context
eza -l -s size --reverse | head -20                 # List -> Sort -> Analyze
fd -t f | awk -F. '{print $NF}' | sort | uniq -c | sort -rn  # Find -> Summarize
```
