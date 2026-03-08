---
name: fzf
version: 0.70.0
description: "Interactive fuzzy finder for filtering and selecting from any list. Use this skill whenever the user needs to interactively select files, choose from options, fuzzy-search through lists, or build interactive selection menus — even if they say 'pick from list' or 'select file' or 'interactive search'."
ingredients:
  - junegunn/fzf
tags:
  - fuzzy
  - interactive
  - filter
  - selection
  - cli
---

# fzf — Interactive Fuzzy Finder

fzf reads lines from stdin (or a default command), presents a fuzzy-matching
interface, and writes the selected line(s) to stdout. It turns any list into an
interactive menu.

**Install**: `brew install fzf` / `apt install fzf` / `agents-cli add junegunn/fzf`

---

## 1. Basic Usage

Pipe any newline-delimited list into fzf. The selected item prints to stdout.

```bash
# Pick a file from the current tree
find . -type f | fzf

# Pick a running process
ps aux | fzf

# Pick a branch
git branch --all | fzf

# Use the selection in a command
vim "$(fzf)"
cd "$(find . -type d | fzf)"
```

Without stdin, fzf runs `FZF_DEFAULT_COMMAND` (or `find .` as fallback).

```bash
# Just launch it — searches files in cwd
fzf
```

---

## 2. Preview

`--preview` runs a command for each highlighted line. `{}` is replaced with
the current selection.

```bash
# Preview file contents with bat (syntax highlighting)
fzf --preview 'bat --color=always --style=numbers --line-range=:500 {}'

# Preview with plain cat
fzf --preview 'cat {}'

# Preview git diff for a changed file
git diff --name-only | fzf --preview 'git diff --color=always {}'

# Preview directory tree
find . -type d | fzf --preview 'ls -la {}'
```

### Preview window positioning

```bash
# Right side, 60% width (default)
fzf --preview 'bat {}' --preview-window right:60%

# Bottom, 40% height, with wrapping
fzf --preview 'bat {}' --preview-window down:40%:wrap

# Hidden by default, toggle with ?
fzf --preview 'bat {}' --preview-window hidden --bind '?:toggle-preview'

# Follow mode — useful for logs
tail -f app.log | fzf --preview-window follow
```

---

## 3. Multi-Select

`-m` / `--multi` lets the user select multiple items with Tab/Shift-Tab.

```bash
# Select multiple files, open them all
vim $(fzf -m)

# Select files to delete (careful!)
fzf -m | xargs rm

# Select multiple git branches to delete
git branch | fzf -m | xargs git branch -d
```

Combine with `--bind` for bulk actions:

```bash
# ctrl-a to select all, ctrl-d to deselect all
fzf -m --bind 'ctrl-a:select-all,ctrl-d:deselect-all'

# Toggle all then accept
fzf -m --bind 'ctrl-t:toggle-all'
```

---

## 4. Filtering

### Initial query (`-q`)

Pre-fill the search query — the user can still edit it.

```bash
# Start with "test" typed in
fzf -q "test"

# Jump straight to .ts files
find . -type f | fzf -q ".ts$"
```

### Non-interactive filter (`-f`)

`-f` (filter mode) prints all matches and exits immediately. No TUI. This is
the key mode for agent/scripted usage.

```bash
# Print all lines matching "config" — no interaction
cat files.txt | fzf -f "config"

# Fuzzy-match "svc" across a process list
ps aux | fzf -f "svc"

# Exact substring match in filter mode
cat names.txt | fzf -f "alice" --exact
```

### Exact matching (`--exact` / `-e`)

Disable fuzzy matching entirely — only substring matches count.

```bash
fzf --exact
fzf -e
```

### Selecting when there is only one match

```bash
# --select-1: if exactly one match, auto-select it (skip the UI)
echo -e "foo\nbar" | fzf --select-1 -q "foo"
# prints "foo" immediately

# --exit-0: if zero matches, exit immediately with code 1
echo -e "foo\nbar" | fzf --exit-0 -q "baz"
# exits 1, prints nothing
```

Combine them for fully non-interactive selection:

```bash
# Select the single match or fail gracefully
result=$(echo -e "foo\nbar\nbaz" | fzf --filter "foo" --select-1 --exit-0)
```

---

## 5. Display & Layout

```bash
# Inline mode — don't take over the full terminal
fzf --height 40%
fzf --height ~20    # at most 20 lines, shrink if fewer results

# Reverse layout — prompt at top, results below (feels like a dropdown)
fzf --layout reverse

# Combined — the classic "dropdown" feel
fzf --height 40% --layout reverse

# Border styles
fzf --border           # rounded (default)
fzf --border sharp     # square corners
fzf --border bold      # thick lines
fzf --border none      # no border

# Custom prompt and pointer
fzf --prompt "Select file> " --pointer "▶" --marker "✓"

# Header — static text above the list
fzf --header "Pick a branch to checkout"

# Header from the first N input lines
fzf --header-lines 1   # treat first input line as header

# Combine for a polished UI
git branch --all | fzf \
  --height 50% \
  --layout reverse \
  --border sharp \
  --prompt "branch> " \
  --header "Select a branch to checkout" \
  --preview 'git log --oneline --color=always {}'
```

---

## 6. Key Bindings (`--bind`)

`--bind` maps keys to fzf actions. Multiple bindings are comma-separated.

### Common bindings

```bash
fzf --bind 'ctrl-a:select-all'
fzf --bind 'ctrl-d:deselect-all'
fzf --bind 'ctrl-t:toggle-all'
fzf --bind 'ctrl-y:execute-silent(echo {} | pbcopy)'   # copy to clipboard
fzf --bind 'ctrl-e:execute(vim {})'                     # open in editor
fzf --bind 'ctrl-/:toggle-preview'
fzf --bind 'ctrl-u:preview-up,ctrl-d:preview-down'     # scroll preview
fzf --bind 'enter:become(vim {})'                       # replace fzf process
```

### Chained bindings

```bash
# Reload the list when pressing ctrl-r
fzf --bind 'ctrl-r:reload(find . -type f)'

# Change preview command dynamically
fzf --bind 'ctrl-/:change-preview-window(down|hidden|)'
```

### Full recipe — multi-select with batch actions

```bash
fzf -m \
  --bind 'ctrl-a:select-all' \
  --bind 'ctrl-d:deselect-all' \
  --bind 'ctrl-t:toggle-all' \
  --bind 'ctrl-y:execute-silent(echo {+} | pbcopy)' \
  --bind 'ctrl-e:execute(vim {+})'
```

`{+}` expands to all selected items (space-separated).

---

## 7. Integration Patterns

### fd + fzf (fast file finding with preview)

```bash
# Use fd as the source, bat as the previewer
fd --type f | fzf --preview 'bat --color=always {}'

# Respect .gitignore, include hidden files
fd --type f --hidden --follow --exclude .git | fzf

# Set as default command (put in shell rc)
export FZF_DEFAULT_COMMAND='fd --type f --hidden --follow --exclude .git'
```

### ripgrep + fzf (search contents, pick result)

```bash
# Search code, pick a match, open in vim at the right line
rg --line-number --color=always '' |
  fzf --ansi --delimiter ':' \
      --preview 'bat --color=always --highlight-line {2} {1}' \
      --preview-window '+{2}/2' |
  awk -F: '{print "+"$2, $1}' |
  xargs -r vim

# Interactive ripgrep — re-run rg on every keystroke
fzf --ansi --disabled \
    --bind 'start:reload:rg --line-number --color=always {q} || true' \
    --bind 'change:reload:rg --line-number --color=always {q} || true' \
    --delimiter ':' \
    --preview 'bat --color=always --highlight-line {2} {1}'
```

### git + fzf

```bash
# Interactive branch checkout
git branch --all | fzf --height 40% --layout reverse | xargs git checkout

# Interactive log browser with diff preview
git log --oneline --color=always | fzf --ansi --preview 'git show --color=always {1}'

# Stage files interactively
git diff --name-only | fzf -m --preview 'git diff --color=always {}' | xargs git add

# Interactive stash apply
git stash list | fzf --preview 'git stash show -p {1}' | awk -F: '{print $1}' | xargs git stash apply
```

### Process / Docker

```bash
# Kill processes interactively
ps aux | fzf --header-lines=1 --multi | awk '{print $2}' | xargs kill -9

# Pick a container and tail logs
docker ps --format '{{.Names}}' | fzf | xargs -r docker logs -f
```

---

## 8. Agent Workflows

These patterns let an AI agent use fzf on behalf of the user.

### "Select a file interactively"

```bash
# Let the user pick a file from the project
selected=$(fd --type f | fzf --height 40% --layout reverse --prompt "Select file> ")
echo "User selected: $selected"
```

### "Choose from a list"

```bash
# Present arbitrary options
choice=$(printf '%s\n' "option-a" "option-b" "option-c" | \
  fzf --height ~5 --layout reverse --prompt "Choose> " --header "Available options")
echo "User chose: $choice"
```

### "Fuzzy search through outputs"

```bash
# Let user narrow down grep results interactively
match=$(rg --files-with-matches "TODO" | fzf --preview 'rg --color=always TODO {}')
echo "Editing: $match"
```

### "Multi-select and act"

```bash
# User picks multiple test files to run
files=$(fd --type f --extension test.ts | fzf -m --prompt "Tests to run> ")
echo "$files" | xargs npx vitest run
```

---

## 9. Non-Interactive Use for Agents

When running in scripts or agent pipelines with no TTY, use these flags to
avoid blocking on user input.

```bash
# Filter mode — print matches, never show TUI
echo -e "apple\nbanana\ncherry" | fzf -f "ban"
# Output: banana

# Auto-select if exactly one match
echo -e "config.yaml" | fzf --select-1 --exit-0
# Output: config.yaml (no TUI shown)

# Combine filter + select-1 + exit-0 for fully scripted selection
result=$(fd --type f --extension yaml | fzf -f "docker" --select-1 --exit-0)

# Exit codes:
#   0  — normal exit, item selected
#   1  — no match (with --exit-0)
#   2  — error
#   130 — user interrupted (ctrl-c / ESC)
```

### Scoring trick: get the best match programmatically

```bash
# fzf -f outputs matches sorted by score (best first)
# Take only the top result
best=$(echo -e "Dockerfile\ndocker-compose.yaml\n.dockerignore" | fzf -f "docker" | head -1)
```

---

## 10. Environment Variables

Set these in your shell profile (`~/.bashrc`, `~/.zshrc`) to change defaults
globally.

```bash
# Default command when fzf is launched without stdin
export FZF_DEFAULT_COMMAND='fd --type f --hidden --follow --exclude .git'

# Default options applied to every fzf invocation
export FZF_DEFAULT_OPTS='
  --height 40%
  --layout reverse
  --border
  --bind ctrl-a:select-all,ctrl-d:deselect-all
  --preview-window right:50%:wrap
'

# Ctrl-T file picker (shell integration)
export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
export FZF_CTRL_T_OPTS="--preview 'bat --color=always --line-range=:500 {}'"

# Alt-C directory changer (shell integration)
export FZF_ALT_C_COMMAND='fd --type d --hidden --follow --exclude .git'
export FZF_ALT_C_OPTS="--preview 'ls -la {}'"

# Ctrl-R history search customization
export FZF_CTRL_R_OPTS='--exact --border --height 50%'
```

### Shell integration

```bash
eval "$(fzf --bash)"   # bash — or: eval "$(fzf --zsh)" / fzf --fish | source
```

This gives you **Ctrl-T** (paste file path), **Ctrl-R** (fuzzy history),
**Alt-C** (cd into dir), and `**<Tab>` completion (e.g. `vim **<Tab>`).

---

## Quick Reference

| Flag | Short | Purpose |
|------|-------|---------|
| `--multi` | `-m` | Enable multi-select (Tab to toggle) |
| `--filter` | `-f` | Non-interactive filter mode |
| `--query` | `-q` | Pre-fill the search query |
| `--exact` | `-e` | Exact substring matching only |
| `--select-1` | | Auto-select if single match |
| `--exit-0` | | Exit immediately if no match |
| `--height` | | Limit vertical space (e.g. `40%`, `~20`) |
| `--layout` | | `default`, `reverse`, `reverse-list` |
| `--border` | | Border style: `rounded`, `sharp`, `bold`, `none` |
| `--preview` | | Preview command (`{}` = current item) |
| `--preview-window` | | Position/size: `right:60%`, `down:40%:wrap` |
| `--bind` | | Key bindings (e.g. `ctrl-a:select-all`) |
| `--prompt` | | Custom prompt string |
| `--header` | | Static header text |
| `--header-lines` | | Treat first N input lines as sticky header |
| `--ansi` | | Parse ANSI color codes in input |
| `--delimiter` | `-d` | Field delimiter for `{1}`, `{2}`, etc. |
| `--nth` | | Which fields to search (e.g. `2..`) |
| `--with-nth` | | Which fields to display |
| `--tiebreak` | | Ranking tiebreak: `length`, `begin`, `end`, `index` |
| `--disabled` | | Disable search — useful with `--bind change:reload` |

---

## Recipes

### File picker with bat preview

```bash
fd --type f | fzf \
  --height 80% --layout reverse --border \
  --preview 'bat --color=always --style=numbers {}' \
  --preview-window right:60%:wrap \
  --bind 'ctrl-/:toggle-preview'
```

### Interactive ripgrep (live grep as you type)

```bash
fzf --ansi --disabled --prompt 'rg> ' \
  --bind 'start:reload:rg --line-number --color=always "" || true' \
  --bind 'change:reload:rg --line-number --color=always {q} || true' \
  --delimiter ':' \
  --preview 'bat --color=always --highlight-line {2} {1}' \
  --preview-window '+{2}/2'
```

### Git commit browser

```bash
git log --oneline --decorate --color=always |
  fzf --ansi --no-sort \
      --preview 'git show --stat --color=always {1}' \
      --bind 'enter:execute(git show --color=always {1} | less -R)'
```

### Environment variable inspector

```bash
env | sort | fzf --height 50% --layout reverse --preview 'echo {} | cut -d= -f2-'
```
