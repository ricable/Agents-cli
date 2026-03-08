---
name: ai-coding-workflow
version: 1.0.0
description: "Workflow for orchestrating multiple AI coding agents — aider, claude-code, codex, continue, goose, sweep, fabric, and shell-gpt — into unified development workflows. Use this skill whenever the user needs AI-assisted code review, bug fixing, feature implementation, refactoring, automated PR creation, multi-model strategy, agent orchestration, or CI/CD integration with AI agents — even if they just say 'review this code with AI', 'fix this bug', 'create a PR from this issue', 'refactor with aider', or 'set up AI coding agents'."
ingredients:
  - paul-gauthier/aider
  - npm:@anthropic-ai/claude-code
  - openai/codex
  - continuedev/continue
  - block/goose
  - sweepai/sweep
  - danielmiessler/fabric
  - TheR1D/shell_gpt
tags:
  - workflow
  - ai-ml
  - ai-coding
  - code-review
  - pair-programming
  - automation
---

# AI Coding Agent Workflow

This skill orchestrates multiple AI coding agents into repeatable development workflows. Each agent has distinct strengths: aider excels at multi-file refactors with git integration, claude-code handles architecture and complex reasoning, codex provides sandboxed autonomous execution, goose manages multi-step development tasks, sweep converts issues to PRs, fabric augments shell pipelines with AI, and shell-gpt delivers quick inline fixes.

---

## 1. Setting Up Multiple AI Coding Agents

### Install all agents

```bash
# aider — AI pair programming with git integration
pip install aider-chat

# claude-code — Anthropic's coding agent
npm install -g @anthropic-ai/claude-code

# codex — OpenAI's coding agent (requires Node 22+)
npm install -g @openai/codex

# goose — Block's AI developer agent
brew install block/goose/goose

# shell-gpt — quick AI command-line productivity
pip install shell-gpt

# fabric — AI augmentation framework
go install github.com/danielmiessler/fabric@latest

# sweep — automated PR creation (GitHub App install)
# Install from https://github.com/apps/sweep-ai on your repo
```

### Configure API keys and verify

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."

aider --model claude-sonnet-4-20250514 --check
claude --version
codex --version
sgpt --version
fabric --listmodels | head -5
```

### Configure aider for your project

```bash
cat > .aider.conf.yml << 'CONF'
model: claude-sonnet-4-20250514
auto-commits: true
gitignore: true
pretty: true
stream: true
CONF
echo ".aider*" >> .gitignore
```

---

## 2. Code Review Workflows

### Local AI code review with fabric

```bash
# Review staged diff
git diff --staged | fabric --pattern review_code

# Review a specific file for security issues
cat src/auth/login.ts | fabric --pattern analyze_code_for_security

# Review entire PR diff
gh pr diff 42 | fabric --pattern review_code
```

### PR review with claude-code

```bash
# Review and post as PR comment
gh pr diff 42 | claude -p "Review this diff for bugs, security issues, and style. Output markdown with: Summary, Issues, Suggestions." > /tmp/review.md
gh pr comment 42 --body "$(cat /tmp/review.md)"
```

### Multi-agent review — compare perspectives

```bash
DIFF=$(git diff --staged)

# Claude: architecture and correctness
echo "$DIFF" | claude -p "Review for correctness, edge cases, and architectural concerns." > /tmp/review-claude.md

# GPT: implementation and style
echo "$DIFF" | sgpt "Review this diff for implementation quality, naming, and style issues." > /tmp/review-gpt.md

# Compare
echo "=== Claude ===" && cat /tmp/review-claude.md
echo "=== GPT ===" && cat /tmp/review-gpt.md
```

### Pre-commit AI review hook

```bash
cat > .git/hooks/pre-commit << 'HOOK'
#!/bin/bash
DIFF=$(git diff --staged)
if [ -z "$DIFF" ]; then exit 0; fi

ISSUES=$(echo "$DIFF" | sgpt "Output ONLY critical bugs or security issues, one per line. If none, output NONE.")
if [ "$ISSUES" != "NONE" ]; then
  echo "AI Review found issues:"
  echo "$ISSUES"
  read -p "Continue? (y/N) " -n 1 -r
  echo
  [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
fi
HOOK
chmod +x .git/hooks/pre-commit
```

---

## 3. Bug Fixing Workflows

### Reproduce, diagnose, fix, verify — with aider

```bash
# Step 1: Reproduce
pytest tests/test_orders.py::test_checkout_total -x 2>&1 | tee /tmp/failure.log

# Step 2: Diagnose
aider --message "Analyze this test failure. Do not fix it yet, just explain what is wrong." \
  --read /tmp/failure.log src/orders.py tests/test_orders.py

# Step 3: Fix
aider --message "Fix the bug causing test_checkout_total to fail." src/orders.py

# Step 4: Verify
pytest tests/test_orders.py::test_checkout_total -x
```

### Quick bug fix with shell-gpt

```bash
cat src/utils/format.ts | sgpt --code "Fix the off-by-one error in the pagination function."
```

### Autonomous bug fixing with codex

```bash
codex "The login form crashes when email is empty. Find and fix the bug in src/components/LoginForm.tsx. Run the tests to verify."
```

### Multi-step investigation with goose

```bash
goose run --text "There is a memory leak in the WebSocket handler. Investigate src/ws/, find the leak, fix it, and verify with the existing tests."
```

---

## 4. Feature Implementation

### Spec, plan, implement, test with claude-code + aider

```bash
# Step 1: Generate a technical spec
claude -p "Write a technical spec for adding rate limiting to our Express API. Include: data structures, middleware design, Redis integration, and error responses." > docs/specs/rate-limiting.md

# Step 2: Plan the implementation
claude -p "List the exact files to create or modify, in order, with one-line descriptions." < docs/specs/rate-limiting.md > /tmp/plan.md

# Step 3: Implement with aider
aider --message "Implement rate limiting per this plan:
$(cat /tmp/plan.md)" src/middleware/ src/config/ src/routes/api.ts

# Step 4: Generate tests
aider --message "Write tests for rate limiting: basic limiting, sliding window, Redis failure fallback, custom limits per route." \
  tests/middleware/rate-limit.test.ts
```

### Full autonomy with codex

```bash
codex "Add a CSV export feature to the reports module. Users export via a download button. Frontend is React, backend is Express. Add tests."
```

### Iterative building with goose sessions

```bash
goose session start --name feature-auth
# "Add JWT auth middleware to src/middleware/"
# "Add login and register routes in src/routes/auth.ts"
# "Write tests for the auth routes"
```

---

## 5. Refactoring Workflows

### Large-scale refactor with aider

```bash
# Rename a module across the codebase
aider --message "Rename 'utils' to 'helpers' throughout. Update all imports and paths." src/ tests/

# Extract a class into its own file
aider --message "Extract PaymentProcessor from src/checkout.ts into src/services/payment-processor.ts. Update imports." \
  src/checkout.ts src/services/

# Migrate callbacks to async/await
aider --message "Convert all callback-based functions in src/db/ to async/await." src/db/
```

### Quick refactors with shell-gpt

```bash
# Optimize a slow function
cat src/search.ts | sgpt --code "Optimize: replace O(n^2) comparisons with a Set for O(n) lookup."

# Add error handling
cat src/api/client.ts | sgpt --code "Add typed errors, retry logic, and timeout support."
```

### Architecture-level refactoring with claude-code

```bash
# Analyze and plan
claude -p "Analyze src/ for circular dependencies, god objects, and modules with too many responsibilities. Suggest a refactoring plan." \
  --allowedTools Read,Glob,Grep,Bash

# Execute decomposition
claude -p "Decompose src/services/monolith.ts into OrderService, PaymentService, NotificationService, InventoryService with dependency injection."
```

---

## 6. Automated PR Creation

### Sweep — issue to PR automation

```bash
# Create an issue that Sweep picks up automatically
gh issue create --title "Sweep: Add input validation to POST /api/users" \
  --body "Add zod validation: email format, password strength (8+ chars, uppercase, number), username (alphanumeric, 3-20 chars). Return 400 with field errors."
# Sweep reads the issue, implements the code, creates a PR, runs CI
```

### AI-assisted PR creation with aider + git

```bash
aider --message "Add request validation middleware using zod for all API routes." src/routes/ src/middleware/

git push -u origin feature/request-validation
gh pr create --title "Add zod request validation" \
  --body "$(git log main..HEAD --pretty=format:'- %s' | head -20)"
```

### Generate PR description from changes

```bash
DIFF=$(git diff main...HEAD)
PR_BODY=$(echo "$DIFF" | claude -p "Write a PR description: Summary, Changes Made (bullets), Testing Done, Breaking Changes. Markdown format.")
gh pr create --title "Add request validation" --body "$PR_BODY"
```

---

## 7. Multi-Model Strategy

### Claude for architecture, GPT for implementation, local for iteration

```bash
# Claude: architecture and complex reasoning
claude -p "Design a caching layer for our API. Consider invalidation, Redis vs in-memory, TTL policies. 10k req/s, 80% reads."

# GPT via shell-gpt: boilerplate and CRUD
sgpt --code "Generate an Express CRUD router for 'products' with validation and pagination."

# Local models via Ollama: fast iteration without API costs
aider --model ollama_chat/deepseek-coder-v2 --message "Add input validation." src/forms/signup.ts
aider --model ollama_chat/qwen2.5-coder --message "Write unit tests for all public methods." src/utils/date.ts
```

### Model routing script

```bash
cat > ai-route.sh << 'SCRIPT'
#!/bin/bash
case $1 in
  architect|design|review) shift; claude -p "$*" ;;
  implement|generate)      shift; sgpt --code "$*" ;;
  refactor|multi-file)     shift; aider --message "$*" "${@:2}" ;;
  quick|fix|explain)       shift; sgpt "$*" ;;
  *) echo "Usage: ai-route.sh {architect|implement|refactor|quick} <prompt>" ;;
esac
SCRIPT
chmod +x ai-route.sh
```

---

## 8. Agent Orchestration Patterns

### Chain agents — plan, implement, review

```bash
# Claude plans
PLAN=$(claude -p "Plan implementing retry with exponential backoff for our HTTP client. List files and changes.")

# Aider implements
aider --message "Implement: $PLAN" src/http/client.ts src/http/retry.ts

# Claude reviews
git diff main...HEAD | claude -p "Review for: correct backoff, jitter, max retries, error propagation, test coverage."

# Aider fixes findings
aider --message "Fix these review findings: $(cat /tmp/findings.md)" src/http/retry.ts tests/
```

### Agent feedback loop — iterate until tests pass

```bash
MAX=5; ATTEMPT=0
while [ $ATTEMPT -lt $MAX ]; do
  ATTEMPT=$((ATTEMPT + 1))
  echo "=== Attempt $ATTEMPT ==="
  OUTPUT=$(pytest tests/ 2>&1)
  [ $? -eq 0 ] && echo "All tests pass." && break
  echo "$OUTPUT" | tail -20
  aider --message "Fix these test failures: $OUTPUT" src/ tests/
done
```

### Compare agent outputs for critical decisions

```bash
Q="How should we handle DB connection pooling in Node.js with PostgreSQL for 50 concurrent users?"
echo "$Q" | claude -p "$(cat)" > /tmp/claude.md
echo "$Q" | sgpt > /tmp/gpt.md
cat /tmp/claude.md /tmp/gpt.md | claude -p "Synthesize these two answers into one recommendation. Note agreements and disagreements."
```

---

## 9. CI/CD Integration

### GitHub Actions — AI PR review

```yaml
# .github/workflows/ai-review.yml
name: AI Code Review
on: [pull_request]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - name: AI Review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          npm install -g @anthropic-ai/claude-code
          git diff origin/main...HEAD | claude -p "Review for bugs and security. Concise markdown." > review.md
      - uses: actions/github-script@v7
        with:
          script: |
            const review = require('fs').readFileSync('review.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner, repo: context.repo.repo,
              body: `## AI Review\n\n${review}`
            });
```

### Automated commit message hook

```bash
cat > .git/hooks/prepare-commit-msg << 'HOOK'
#!/bin/bash
[ "$2" = "message" ] && exit 0
DIFF=$(git diff --staged)
[ -z "$DIFF" ] && exit 0
echo "$DIFF" | sgpt "Conventional commit message for this diff. type(scope): desc. One line, max 72 chars. No markdown." > "$1"
HOOK
chmod +x .git/hooks/prepare-commit-msg
```

### Pre-push AI review gate

```bash
cat > .git/hooks/pre-push << 'HOOK'
#!/bin/bash
DIFF=$(git diff origin/main...HEAD)
[ -z "$DIFF" ] && exit 0
REVIEW=$(echo "$DIFF" | sgpt "Output JSON array: [{file, line, severity, message}]. Critical bugs only. [] if none.")
if [ "$REVIEW" != "[]" ]; then
  echo "AI found issues:" && echo "$REVIEW" | jq -r '.[] | "[\(.severity)] \(.file):\(.line) — \(.message)"'
  read -p "Push anyway? (y/N) " -n 1 -r; echo
  [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
fi
HOOK
chmod +x .git/hooks/pre-push
```

---

## Quick Reference: Which Agent When

| Task | Best Agent | Why |
|------|-----------|-----|
| Multi-file refactor | `aider` | Git-aware, atomic commits, repo-map |
| Architecture design | `claude-code` | Strong reasoning, handles ambiguity |
| Autonomous bug fix | `codex` | Sandboxed execution, runs tests |
| Quick inline fix | `shell-gpt` | Fast, pipe-friendly |
| Multi-step dev task | `goose` | Tool use, session persistence |
| Issue to PR | `sweep` | Fully automated, CI-integrated |
| Shell pipeline AI | `fabric` | Pattern library, unix composable |
| PR review | `claude-code` / `fabric` | Deep analysis or quick patterns |
| Test generation | `aider` / `codex` | Generate and run tests in context |
| Commit messages | `shell-gpt` | Fast, hook-friendly |

---

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run aider -- --help --json
agents-cli run claude-code -- --version --json
agents-cli run sgpt -- --version --json

# Introspect command schema
agents-cli schema aider --json
agents-cli schema claude-code --json

# Dry-run before executing
agents-cli run aider -- --message "test" --dry-run
```
