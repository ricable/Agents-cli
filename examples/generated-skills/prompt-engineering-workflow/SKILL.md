---
name: prompt-engineering-workflow
version: 1.0.0
description: "Prompt engineering and LLM evaluation workflow using promptfoo for testing, instructor/guidance for structured output, DSPy for optimization, and langfuse for observability. Use this skill whenever the user needs to write prompts, evaluate LLM outputs, compare models, generate structured responses, validate LLM output, optimize prompts automatically, or debug LLM behavior — even if they just say 'test my prompt' or 'compare GPT vs Claude' or 'get JSON from LLM' or 'why is my prompt slow'."
ingredients:
  - promptfoo/promptfoo
  - simonw/llm
  - guidance-ai/guidance
  - stanfordnlp/dspy
  - jxnl/instructor
  - dottxt-ai/outlines
  - guardrails-ai/guardrails
  - langfuse/langfuse
tags:
  - workflow
  - ai-ml
  - prompt-engineering
  - evaluation
  - structured-output
  - llm-testing
---

# Prompt Engineering & LLM Evaluation Workflow

Orchestrate the full prompt lifecycle: write, test, generate structured output, optimize, validate, and monitor. Each tool handles one concern -- combine them for reliable LLM features.

## Prerequisites

```bash
npm install -g promptfoo
uv tool install llm
uv add instructor guidance dspy guardrails-ai outlines langfuse
```

Verify:

```bash
promptfoo --version && llm --version
uv run python -c "import instructor, guidance, dspy, guardrails, outlines, langfuse; print('OK')"
```

---

## 1. Prompt Testing with Promptfoo

Never ship a prompt without evaluating it. Promptfoo runs prompts against test cases with assertions.

### Set up and configure

```bash
mkdir prompt-eval && cd prompt-eval && promptfoo init
```

Create `prompts/classify.txt`:

```text
Classify the customer message into: billing, technical, account, general.
Respond with ONLY the category name.
Message: {{message}}
```

Configure `promptfooconfig.yaml`:

```yaml
prompts:
  - file://prompts/classify.txt
providers:
  - openai:gpt-4o-mini
tests:
  - vars: {message: "I can't log into my account"}
    assert: [{type: equals, value: "account"}]
  - vars: {message: "My credit card was charged twice"}
    assert: [{type: equals, value: "billing"}]
  - vars: {message: "The API returns a 500 error"}
    assert: [{type: equals, value: "technical"}]
  - vars: {message: "What are your business hours?"}
    assert: [{type: equals, value: "general"}]
```

### Run and view results

```bash
promptfoo eval --table
promptfoo view              # browser UI
promptfoo eval -o results.json
```

### Assertion types

```yaml
assert:
  - type: equals
    value: "billing"
  - type: contains
    value: "billing"
  - type: regex
    value: "^(billing|technical|account|general)$"
  - type: llm-rubric
    value: "Correctly identifies the topic category"
  - type: is-json
    value: {type: object, required: [category]}
  - type: max-tokens
    value: 10
  - type: javascript
    value: "output.trim().length < 20"
```

---

## 2. Structured Output with Instructor

Get typed, validated data from LLMs instead of free-form text. Instructor patches the client to return Pydantic models.

```python
import instructor
from openai import OpenAI
from pydantic import BaseModel, Field

client = instructor.from_openai(OpenAI())

class ContactInfo(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    company: str | None = None

contact = client.chat.completions.create(
    model="gpt-4o-mini",
    response_model=ContactInfo,
    max_retries=3,
    messages=[{"role": "user", "content": "John Smith from Acme Corp, john@acme.com, 555-0123"}],
)
print(contact.model_dump_json(indent=2))
```

### Use with Anthropic

```python
import instructor
from anthropic import Anthropic

client = instructor.from_anthropic(Anthropic())
result = client.messages.create(
    model="claude-sonnet-4-20250514", response_model=ContactInfo,
    max_tokens=1024, messages=[{"role": "user", "content": text}],
)
```

---

## 3. Templated Generation with Guidance

Use guidance for fine-grained control -- constrained choices, interleaved generation, and multi-step flows.

```python
import guidance

gpt = guidance.models.OpenAI("gpt-4o-mini")

program = gpt + """\
Analyze this code review comment.
Severity: {{select "severity" options=["critical", "major", "minor", "nitpick"]}}
Category: {{select "category" options=["bug", "style", "performance", "security"]}}
Explanation: {{gen "explanation" max_tokens=100 stop="\\n"}}
"""

result = program(comment="This function doesn't handle null inputs")
print(result["severity"], result["category"])
```

### Multi-step reasoning

```python
@guidance
def chain_of_thought(lm, question):
    lm += f"Question: {question}\n"
    lm += "Step 1: {{gen 'step1' max_tokens=150 stop='Step'}}\n"
    lm += "Step 2: {{gen 'step2' max_tokens=150 stop='Therefore'}}\n"
    lm += "Therefore: {{gen 'answer' max_tokens=50}}"
    return lm
```

---

## 4. Automated Prompt Optimization with DSPy

DSPy treats prompts as programs with learnable parameters and optimizes them against a metric.

```python
import dspy
from dspy.teleprompt import BootstrapFewShot

lm = dspy.LM("openai/gpt-4o-mini")
dspy.configure(lm=lm)

class Classify(dspy.Signature):
    """Classify a customer support message into a category."""
    message: str = dspy.InputField()
    category: str = dspy.OutputField(desc="One of: billing, technical, account, general")

classify = dspy.Predict(Classify)

# Training data
trainset = [
    dspy.Example(message="Charged twice on my card", category="billing").with_inputs("message"),
    dspy.Example(message="API returns 500", category="technical").with_inputs("message"),
    dspy.Example(message="Reset my password", category="account").with_inputs("message"),
    dspy.Example(message="What are your hours", category="general").with_inputs("message"),
]

def accuracy(example, prediction, trace=None):
    return example.category.lower() == prediction.category.lower()

optimizer = BootstrapFewShot(metric=accuracy, max_bootstrapped_demos=4)
optimized = optimizer.compile(classify, trainset=trainset)

# Save/load optimized prompts
optimized.save("optimized_classifier.json")
```

Use `dspy.ChainOfThought(Classify)` instead of `dspy.Predict(Classify)` for reasoning-heavy tasks.

---

## 5. Output Validation with Guardrails

Validate LLM output against content safety, format compliance, and business rules. Re-asks on failure.

```python
from guardrails import Guard
from guardrails.hub import ValidLength, ToxicLanguage, RestrictToTopic

guard = Guard().use_many(
    ValidLength(min=10, max=500, on_fail="reask"),
    ToxicLanguage(on_fail="exception"),
    RestrictToTopic(
        valid_topics=["technology", "science"], invalid_topics=["politics"],
        on_fail="reask"
    ),
)

result = guard(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Explain cloud computing simply"}],
)
```

### Pydantic schema validation

```python
from pydantic import BaseModel, Field

class ProductReview(BaseModel):
    sentiment: str = Field(description="positive, negative, or neutral")
    score: float = Field(ge=0.0, le=1.0)
    summary: str = Field(min_length=10, max_length=200)

guard = Guard.from_pydantic(ProductReview)
result = guard(
    model="gpt-4o-mini", num_reasks=2,
    messages=[{"role": "user", "content": f"Analyze this review: {review_text}"}],
)
```

---

## 6. A/B Testing Across Models

Compare prompt variants and models side by side with promptfoo.

```yaml
prompts:
  - file://prompts/v1_direct.txt
  - file://prompts/v2_cot.txt
  - file://prompts/v3_few_shot.txt

providers:
  - id: openai:gpt-4o-mini
    config: {temperature: 0}
  - id: openai:gpt-4o
    config: {temperature: 0}
  - id: anthropic:messages:claude-sonnet-4-20250514
    config: {temperature: 0}

tests:
  - vars: {input: "The server crashed after the deploy"}
    assert:
      - type: llm-rubric
        value: "Correctly identifies technical issue"
      - type: cost
        threshold: 0.01
      - type: latency
        threshold: 3000
```

```bash
promptfoo eval --table
# Inspect cost/timing
promptfoo eval -o results.json
cat results.json | jq '.results.results[] | {provider, latencyMs, cost}'
```

### Quick CLI comparison

```bash
echo "Explain DNS in one sentence" | llm -m gpt-4o-mini
echo "Explain DNS in one sentence" | llm -m claude-sonnet-4-20250514
```

---

## 7. Observability with Langfuse

Trace LLM calls to track token usage, latency, cost, and quality.

```python
from langfuse.decorators import observe
from openai import OpenAI

client = OpenAI()

@observe()
def classify_message(message: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Classify into: billing, technical, account, general"},
            {"role": "user", "content": message},
        ],
    )
    return response.choices[0].message.content

@observe()
def process_ticket(ticket_text: str) -> dict:
    category = classify_message(ticket_text)
    priority = assess_priority(ticket_text, category)
    return {"category": category, "priority": priority}
```

### Score and query traces

```python
from langfuse.decorators import langfuse_context
from langfuse import Langfuse

@observe()
def classify_with_scoring(message: str, expected: str) -> str:
    result = classify_message(message)
    langfuse_context.score_current_trace(
        name="accuracy",
        value=1.0 if result.strip().lower() == expected.lower() else 0.0,
    )
    return result

# Query recent traces
langfuse = Langfuse()
for t in langfuse.fetch_traces(limit=10).data:
    print(f"{t.id}: {t.name} | {t.latency}ms | ${t.total_cost:.4f}")
```

---

## 8. Template Management

Version, parameterize, and organize prompts as your collection grows.

### Directory structure

```
prompts/
  classify/
    v1_direct.txt
    v2_cot.txt
    eval.yaml
  extract/
    v1.txt
    schema.json
    eval.yaml
```

### Parameterized templates with promptfoo variables

```yaml
defaultTest:
  vars:
    role: "customer support"
    domain: "SaaS billing"
    format: "JSON"
tests:
  - vars: {input: "I was double-charged"}
    assert: [{type: is-json}, {type: llm-rubric, value: "Identifies billing issue"}]
```

### Version in git

```bash
git add prompts/classify/v3.txt prompts/classify/eval.yaml
git commit -m "feat(prompts): add few-shot classifier — 95% to 98% accuracy"
git tag prompts/classify/v3.1
```

---

## Agent Workflows

### End-to-end prompt optimization

```bash
# 1. Draft prompt
cat > prompts/task/v1.txt << 'EOF'
Extract entities from this text. Return JSON: {persons, organizations, locations}.
Text: {{text}}
EOF

# 2. Write test cases
cat > prompts/task/eval.yaml << 'EOF'
prompts: [file://v1.txt]
providers: [openai:gpt-4o-mini]
tests:
  - vars: {text: "Tim Cook announced Apple's new office in Austin, Texas"}
    assert:
      - type: is-json
      - type: javascript
        value: |
          const p = JSON.parse(output);
          p.persons?.includes("Tim Cook") && p.organizations?.includes("Apple")
EOF

# 3. Evaluate, iterate, compare
promptfoo eval -c prompts/task/eval.yaml --table
```

### Build a reliable extraction chain

Combine instructor + guardrails + langfuse:

```python
import instructor
from openai import OpenAI
from pydantic import BaseModel, Field
from guardrails import Guard
from langfuse.decorators import observe

client = instructor.from_openai(OpenAI())

class Entity(BaseModel):
    name: str = Field(min_length=1)
    entity_type: str = Field(description="person, org, or location")
    confidence: float = Field(ge=0.0, le=1.0)

class Extraction(BaseModel):
    entities: list[Entity]
    summary: str = Field(min_length=10, max_length=500)

guard = Guard.from_pydantic(Extraction)

@observe()
def extract_entities(text: str) -> Extraction:
    result = client.chat.completions.create(
        model="gpt-4o-mini", response_model=Extraction, max_retries=2,
        messages=[
            {"role": "system", "content": "Extract named entities from the text."},
            {"role": "user", "content": text},
        ],
    )
    guard.validate(result.model_dump_json())
    return result
```

---

## Quick Reference

| Task | Tool | Command / Pattern |
|---|---|---|
| Test a prompt | promptfoo | `promptfoo eval --table` |
| Compare models | promptfoo | Multiple providers in config |
| Structured JSON | instructor | `create(response_model=Model)` |
| Constrained gen | guidance | `select` and `gen` blocks |
| Optimize prompt | DSPy | `BootstrapFewShot.compile()` |
| Validate output | guardrails | `Guard.from_pydantic(Model)` |
| Trace LLM calls | langfuse | `@observe()` decorator |
| Quick LLM query | llm | `echo "prompt" \| llm -m model` |

## Troubleshooting

**promptfoo eval returns all failures**: Check API keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`). Run `promptfoo eval --verbose`.

**Instructor retries exhausted**: Simplify the Pydantic model, add `Field(description=...)` hints, or use a stronger model.

**DSPy optimization worse**: Need more training examples (10-20 minimum). Ensure metric function is deterministic.

**Langfuse traces missing**: Call `langfuse.flush()` before exit. Check `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY`.

**Guardrails re-ask loop fails**: Validator too strict for the model. Loosen constraints or check `guard.history`.

**High eval costs**: Use `gpt-4o-mini` for iterations. Set `temperature: 0` to enable caching.
