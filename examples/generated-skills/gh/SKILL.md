---
name: gh
version: 2.54.0
description: "GitHub CLI for managing repos, PRs, issues, releases, and Actions from the terminal. Use this skill whenever the user needs to create pull requests, manage issues, check CI status, interact with GitHub repos, search GitHub, or use the GitHub API — even if they say 'github' or 'pull request' or 'open issue' or 'check CI'."
ingredients:
  - cli/cli
tags:
  - github
  - git
  - pull-request
  - issues
  - cli
  - ci-cd
---

# gh — GitHub CLI

The `gh` CLI replaces the GitHub web UI for nearly every operation. PRs, issues, releases, Actions, API calls, search — all from the terminal with structured JSON output perfect for agent pipelines.

## Authentication

```bash
# Check auth status
gh auth status

# Login interactively
gh auth login

# Login with token (non-interactive, ideal for CI/agents)
echo "$GITHUB_TOKEN" | gh auth login --with-token

# Switch between accounts
gh auth switch
```

---

## 1. Pull Requests

### Create a PR

```bash
# Basic — opens editor for title/body
gh pr create

# Fully non-interactive (agent-friendly)
gh pr create --title "feat: add user avatar upload" \
  --body "Adds S3-backed avatar upload with resize pipeline." \
  --base main --head feature/avatars

# Draft PR
gh pr create --title "wip: refactor auth" --body "Early draft." --draft

# With reviewers and labels
gh pr create --title "fix: race condition in cache" \
  --body "Fixes #412." \
  --reviewer alice,bob \
  --label bug,urgent \
  --milestone v2.5

# Create with body from file
gh pr create --title "docs: API reference update" --body-file CHANGELOG.md

# Create and immediately open in browser
gh pr create --title "feat: dark mode" --body "Implements #200" --web
```

### List PRs

```bash
# Open PRs (default)
gh pr list

# All states
gh pr list --state all --limit 50

# Filter by author, label, base branch
gh pr list --author @me --label bug --base main

# JSON output — essential for agents
gh pr list --json number,title,state,author,createdAt,labels

# JSON + jq filtering
gh pr list --json number,title,state,headRefName \
  --jq '.[] | select(.state == "OPEN") | "\(.number): \(.title) (\(.headRefName))"'

# Find PRs needing review
gh pr list --search "review:required" --json number,title,reviewRequests

# PRs by label with structured output
gh pr list --label "needs-review" --json number,title,author \
  --jq '.[] | {pr: .number, title: .title, by: .author.login}'
```

### View a PR

```bash
# Current branch's PR
gh pr view

# By number
gh pr view 123

# JSON for agent consumption
gh pr view 123 --json title,body,state,mergeable,reviewDecision,statusCheckRollup

# Check if PR is mergeable
gh pr view 123 --json mergeable --jq '.mergeable'

# Get CI status from a PR
gh pr view 123 --json statusCheckRollup \
  --jq '.statusCheckRollup[] | "\(.name): \(.conclusion // .status)"'

# View PR diff
gh pr diff 123

# View diff with stat summary
gh pr diff 123 --stat
```

### Checkout a PR locally

```bash
# Checkout by PR number
gh pr checkout 123

# Checkout and create a custom local branch name
gh pr checkout 123 --branch my-local-branch

# Checkout by URL
gh pr checkout https://github.com/owner/repo/pull/123
```

### Merge a PR

```bash
# Merge (interactive — picks strategy)
gh pr merge 123

# Squash merge (most common for clean history)
gh pr merge 123 --squash --delete-branch

# Merge commit
gh pr merge 123 --merge --delete-branch

# Rebase merge
gh pr merge 123 --rebase

# Auto-merge when checks pass
gh pr merge 123 --auto --squash --delete-branch

# Non-interactive with custom commit subject
gh pr merge 123 --squash --delete-branch \
  --subject "feat: avatar upload (#123)"

# Disable auto-merge
gh pr merge 123 --disable-auto
```

### PR Reviews

```bash
# Leave a review comment
gh pr review 123 --comment --body "Looks good, minor nit on line 42."

# Approve
gh pr review 123 --approve --body "LGTM"

# Request changes
gh pr review 123 --request-changes --body "Need error handling in upload path."
```

### PR Comments

```bash
# Add a comment
gh pr comment 123 --body "CI is green, ready to merge."

# Comment from file
gh pr comment 123 --body-file review-notes.md
```

---

## 2. Issues

### Create an issue

```bash
# Interactive
gh issue create

# Non-interactive
gh issue create --title "Bug: login fails on Safari" \
  --body "Steps to reproduce: ..." \
  --label bug,p1 \
  --assignee @me

# With milestone and project
gh issue create --title "Add dark mode" \
  --body "User request from #feedback" \
  --label enhancement \
  --milestone v3.0 \
  --project "Q2 Roadmap"

# From file
gh issue create --title "Tracking: migration plan" --body-file migration.md
```

### List issues

```bash
# Default (open issues assigned to you or created by you)
gh issue list

# All open issues
gh issue list --limit 100

# Filter by state, label, assignee
gh issue list --state closed --label bug --assignee alice

# JSON output for agents
gh issue list --json number,title,state,labels,assignees,createdAt

# Find unassigned bugs
gh issue list --label bug --json number,title,assignees \
  --jq '.[] | select(.assignees | length == 0) | "\(.number): \(.title)"'

# Issues created this week
gh issue list --json number,title,createdAt \
  --jq '[.[] | select(.createdAt > "2026-03-01")] | length'

# Search within a repo
gh issue list --search "memory leak in:title"
```

### View and close issues

```bash
# View issue details
gh issue view 456

# JSON output
gh issue view 456 --json title,body,state,comments,labels

# Close with comment
gh issue close 456 --comment "Fixed in #123"

# Reopen
gh issue reopen 456

# Pin an issue
gh issue pin 456

# Transfer issue to another repo
gh issue transfer 456 owner/other-repo
```

---

## 3. Repository

### Clone

```bash
# Clone by owner/repo
gh repo clone owner/repo

# Clone into specific directory
gh repo clone owner/repo ./my-dir

# Clone and cd
gh repo clone owner/repo && cd repo
```

### Create a repository

```bash
# Create public repo
gh repo create my-project --public --description "My new project"

# Create private with README and license
gh repo create my-project --private --add-readme --license mit

# Create from template
gh repo create my-app --template owner/template-repo --public

# Create and clone immediately
gh repo create my-tool --public --clone

# Create org repo
gh repo create my-org/service-api --private --team backend
```

### View and fork

```bash
# View current repo info
gh repo view

# View another repo
gh repo view owner/repo

# JSON metadata
gh repo view owner/repo --json name,description,stargazerCount,forkCount,primaryLanguage

# Fork
gh repo fork owner/repo

# Fork into an org
gh repo fork owner/repo --org my-org

# Fork and clone
gh repo fork owner/repo --clone
```

### Repository settings

```bash
# Edit repo description/visibility
gh repo edit --description "Updated description"
gh repo edit --visibility private

# Enable/disable features
gh repo edit --enable-issues --enable-wiki=false

# Set default branch
gh repo edit --default-branch develop

# Archive
gh repo archive owner/repo

# Delete (requires confirmation)
gh repo delete owner/repo --yes
```

---

## 4. Releases

### Create a release

```bash
# Create from a tag
gh release create v1.2.0 --title "v1.2.0" --notes "Bug fixes and improvements."

# Auto-generate release notes from PRs
gh release create v1.3.0 --generate-notes

# Draft release
gh release create v2.0.0-rc1 --draft --prerelease --title "v2.0.0 RC1"

# Upload assets with the release
gh release create v1.2.0 ./dist/app-linux.tar.gz ./dist/app-macos.zip \
  --title "v1.2.0" --notes "See CHANGELOG.md"

# Create from notes file
gh release create v1.4.0 --title "v1.4.0" --notes-file RELEASE_NOTES.md

# Target a specific commit
gh release create v1.2.1 --target hotfix-branch --notes "Hotfix for auth."
```

### List and download

```bash
# List releases
gh release list

# JSON output
gh release list --json tagName,name,publishedAt,isPrerelease

# View specific release
gh release view v1.2.0

# Download all assets from a release
gh release download v1.2.0

# Download specific asset
gh release download v1.2.0 --pattern "*.tar.gz"

# Download to specific directory
gh release download v1.2.0 --dir ./downloads

# Download latest release
gh release download --pattern "*.zip"
```

---

## 5. Workflows and Actions

### List and view runs

```bash
# List recent workflow runs
gh run list

# Filter by workflow, branch, status
gh run list --workflow build.yml --branch main --status failure --limit 10

# JSON output
gh run list --json databaseId,displayTitle,status,conclusion,headBranch,createdAt

# View a specific run
gh run view 123456789

# View with logs
gh run view 123456789 --log

# View failed step logs only
gh run view 123456789 --log-failed

# Watch a run in real-time (blocks until complete)
gh run watch 123456789

# Watch with exit status (great for CI gating)
gh run watch 123456789 --exit-status
```

### List workflows

```bash
# List all workflows
gh workflow list

# View workflow details
gh workflow view build.yml

# Trigger a workflow dispatch
gh workflow run deploy.yml --ref main

# Trigger with inputs
gh workflow run deploy.yml --ref main \
  -f environment=staging \
  -f version=1.2.0

# Enable/disable a workflow
gh workflow enable build.yml
gh workflow disable old-workflow.yml
```

### Check CI status for current branch

```bash
# Quick CI status check
gh pr checks

# JSON for agent parsing
gh pr view --json statusCheckRollup \
  --jq '.statusCheckRollup[] | "\(.name): \(.conclusion // .status)"'

# Wait for all checks to pass
gh pr checks --watch --fail-fast

# Re-run failed jobs
gh run rerun 123456789 --failed
```

---

## 6. API — Raw GitHub API Calls

The `gh api` command is the escape hatch for anything not covered by dedicated commands. It handles auth, pagination, and base URL automatically.

```bash
# GET request (default)
gh api repos/owner/repo

# POST — create a label
gh api repos/owner/repo/labels \
  -f name="priority/critical" \
  -f color="FF0000" \
  -f description="Critical priority"

# PATCH — update an issue
gh api repos/owner/repo/issues/123 -f state=closed

# DELETE
gh api repos/owner/repo/labels/stale -X DELETE

# With jq filtering
gh api repos/owner/repo/contributors --jq '.[].login'

# Paginate all results (handles Link headers)
gh api repos/owner/repo/issues --paginate --jq '.[].title'

# GraphQL query
gh api graphql -f query='
  query {
    repository(owner: "owner", name: "repo") {
      pullRequests(first: 5, states: OPEN) {
        nodes { number title }
      }
    }
  }
'

# Get rate limit status
gh api rate_limit --jq '.rate | "Remaining: \(.remaining)/\(.limit)"'

# List PR review comments
gh api repos/owner/repo/pulls/123/comments \
  --jq '.[] | "\(.user.login): \(.body | split("\n")[0])"'

# Get repo traffic (requires push access)
gh api repos/owner/repo/traffic/views --jq '.views[] | "\(.timestamp): \(.count)"'
```

---

## 7. Search

```bash
# Search repositories
gh search repos "machine learning" --language python --stars ">1000" --limit 10

# Search repos with JSON
gh search repos "cli tool" --json fullName,description,stargazersCount \
  --jq '.[] | "\(.fullName) (\(.stargazersCount) stars)"'

# Search issues across GitHub
gh search issues "memory leak" --repo owner/repo --state open

# Search issues with labels
gh search issues "bug" --label "good first issue" --language go --limit 20

# Search code
gh search code "func handleAuth" --repo owner/repo

# Search code in specific file types
gh search code "TODO" --filename "*.go" --repo owner/repo

# Search PRs
gh search prs "refactor" --state merged --repo owner/repo --merged-at ">2026-01-01"

# Search commits
gh search commits "fix auth" --repo owner/repo --author alice
```

---

## 8. JSON Output Patterns

The `--json` flag with `--jq` is the single most important pattern for agents. It turns any gh command into a structured data source.

### Available JSON fields

```bash
# Discover available fields for any command
gh pr list --json help
gh issue list --json help
gh run list --json help
gh release list --json help
```

### Common agent patterns

```bash
# Get PR numbers as plain list
gh pr list --json number --jq '.[].number'

# PR summary table
gh pr list --json number,title,author,labels \
  --jq '.[] | "\(.number)\t\(.author.login)\t\(.title)\t\(.labels | map(.name) | join(","))"'

# Count open PRs by author
gh pr list --json author \
  --jq 'group_by(.author.login) | map({author: .[0].author.login, count: length}) | sort_by(.count) | reverse'

# Issues needing triage (no labels)
gh issue list --json number,title,labels \
  --jq '.[] | select(.labels | length == 0)'

# Check if a specific PR has been approved
gh pr view 123 --json reviewDecision --jq '.reviewDecision'

# Get failed CI checks
gh pr view 123 --json statusCheckRollup \
  --jq '[.statusCheckRollup[] | select(.conclusion == "FAILURE")] | map(.name)'

# Latest release tag
gh release list --json tagName --jq '.[0].tagName'

# Repo metadata in one shot
gh repo view --json name,owner,defaultBranchRef,stargazerCount,forkCount,description \
  --jq '{name: .name, owner: .owner.login, branch: .defaultBranchRef.name, stars: .stargazerCount}'
```

---

## 9. Gists

```bash
# Create a gist from file
gh gist create script.sh --desc "Deployment helper"

# Create public gist from multiple files
gh gist create file1.py file2.py --public --desc "Utils"

# Create from stdin
echo "SELECT * FROM users;" | gh gist create --filename query.sql

# List your gists
gh gist list --limit 20

# View a gist
gh gist view GIST_ID

# Edit a gist
gh gist edit GIST_ID

# Clone a gist
gh gist clone GIST_ID

# Delete a gist
gh gist delete GIST_ID
```

---

## 10. Agent Workflow Recipes

### Full PR workflow (branch to merge)

```bash
# 1. Create branch and make changes
git checkout -b feat/new-feature
# ... make changes ...
git add -A && git commit -m "feat: implement new feature"
git push -u origin feat/new-feature

# 2. Create PR
PR_URL=$(gh pr create --title "feat: new feature" \
  --body "Implements #100." --fill 2>&1 | tail -1)

# 3. Wait for CI
gh pr checks --watch --fail-fast

# 4. Merge when ready
gh pr merge --squash --delete-branch
```

### Triage open issues

```bash
# Get unassigned, unlabeled issues
gh issue list --json number,title,labels,assignees \
  --jq '.[] | select((.labels | length == 0) and (.assignees | length == 0))'

# Bulk label issues
for num in $(gh issue list --label "" --json number --jq '.[].number'); do
  gh issue edit "$num" --add-label "needs-triage"
done
```

### CI status dashboard

```bash
# Recent failures on main
gh run list --branch main --status failure --json displayTitle,conclusion,createdAt,url \
  --jq '.[] | "\(.displayTitle) — \(.createdAt) — \(.url)"'

# Re-run all failed runs from today
for id in $(gh run list --status failure --json databaseId --jq '.[].databaseId' | head -5); do
  gh run rerun "$id" --failed
done
```

### Release automation

```bash
# Create release with auto-generated notes from merged PRs
VERSION="v$(date +%Y.%m.%d)"
gh release create "$VERSION" --generate-notes --latest

# Upload build artifacts
gh release upload "$VERSION" dist/*.tar.gz dist/*.zip
```

### Cross-repo operations

```bash
# List open PRs across multiple repos
for repo in owner/repo1 owner/repo2 owner/repo3; do
  echo "=== $repo ==="
  gh pr list --repo "$repo" --json number,title --jq '.[] | "  #\(.number) \(.title)"'
done

# Search for a dependency across repos
gh search code "lodash" --owner my-org --filename package.json \
  --json repository,path --jq '.[] | "\(.repository.fullName): \(.path)"'
```

### Notifications and review requests

```bash
# PRs waiting for your review
gh search prs "review-requested:@me" --state open \
  --json repository,number,title \
  --jq '.[] | "\(.repository.fullName)#\(.number): \(.title)"'

# PRs you authored that need attention
gh pr list --author @me --json number,title,reviewDecision \
  --jq '.[] | select(.reviewDecision != "APPROVED") | "#\(.number): \(.title) [\(.reviewDecision // "PENDING")]"'
```

---

## 11. Key Patterns Reference

| Pattern | Command |
|---|---|
| Create PR non-interactively | `gh pr create --title "..." --body "..." --base main` |
| Check if PR is mergeable | `gh pr view N --json mergeable --jq '.mergeable'` |
| Get CI status | `gh pr view N --json statusCheckRollup` |
| List open issues as JSON | `gh issue list --json number,title,state` |
| Filter with jq | `--jq '.[] \| select(.state == "OPEN")'` |
| Paginate API results | `gh api endpoint --paginate` |
| Trigger workflow | `gh workflow run name.yml -f key=value` |
| Search code in org | `gh search code "pattern" --owner org-name` |
| Latest release tag | `gh release list --json tagName --jq '.[0].tagName'` |
| Auto-merge on green CI | `gh pr merge N --auto --squash` |

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `GH_TOKEN` | Auth token (overrides `gh auth login`) |
| `GH_REPO` | Default `owner/repo` for commands |
| `GH_HOST` | GitHub Enterprise hostname |
| `GH_EDITOR` | Editor for interactive prompts |
| `NO_COLOR` | Disable colored output |
| `GH_PAGER` | Pager for long output (default: system pager) |

---

## Tips

- Always prefer `--json` + `--jq` over parsing human-readable output. The text format changes between versions; JSON is stable.
- Use `gh pr create --fill` to auto-fill title and body from commit messages.
- The `gh api` command respects `GH_TOKEN`, so it works in CI without `gh auth login`.
- Combine `gh run watch --exit-status` with `&&` to gate on CI: `gh run watch ID --exit-status && gh pr merge --squash`.
- Use `--repo owner/repo` on any command to operate on a different repository without cloning it.
