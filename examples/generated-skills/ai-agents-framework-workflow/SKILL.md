---
name: ai-agents-framework-workflow
version: 1.0.0
description: "Build, orchestrate, and deploy AI agents using Python frameworks. Use this skill whenever the user needs to create an AI agent, set up multi-agent conversations, build tool-calling agents, orchestrate agent crews, implement stateful workflows, or deploy agent APIs — even if they just say 'build an agent' or 'multi-agent system' or 'agent with tools' or 'research agent' or 'code assistant agent'."
ingredients:
  - microsoft/autogen
  - crewAIInc/crewAI
  - langchain-ai/langchain
  - langchain-ai/langgraph
  - huggingface/smolagents
  - phidatahq/phidata
  - openai/swarm
  - microsoft/semantic-kernel
  - agno-agi/agno
  - pydantic/pydantic-ai
tags:
  - workflow
  - ai-ml
  - ai-agents
  - multi-agent
  - orchestration
  - langchain
  - autogen
---

# AI Agents Framework Workflow

Build intelligent agents that reason, use tools, collaborate, and solve complex tasks. This workflow covers single-agent setup, multi-agent orchestration, stateful memory, tool integration, evaluation, and production deployment across the major Python agent frameworks.

## Prerequisites

Set up a project with uv and install the frameworks you need. Pick one or combine several depending on your use case.

```bash
uv init agent-project && cd agent-project
uv add langchain langchain-openai langgraph
uv add crewai crewai-tools
uv add pyautogen
uv add smolagents
uv add phidata
uv add pydantic-ai
uv add agno
uv add semantic-kernel
```

Set your API keys. Most frameworks need at least one LLM provider:

```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export TAVILY_API_KEY="tvly-..."   # for web search tools
```

---

## 1. Single Agent Setup

Start here when you need one agent that can call tools and reason about tasks.

### LangChain tool-calling agent

The most common pattern. Define tools, bind them to a model, run in a loop.

```python
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

@tool
def search_web(query: str) -> str:
    """Search the web for current information."""
    # Replace with real search API (Tavily, SerpAPI, etc.)
    from langchain_community.tools.tavily_search import TavilySearchResults
    search = TavilySearchResults(max_results=3)
    return search.invoke(query)

@tool
def calculate(expression: str) -> str:
    """Evaluate a mathematical expression safely."""
    allowed = set("0123456789+-*/.() ")
    if not all(c in allowed for c in expression):
        return "Error: only arithmetic expressions allowed"
    return str(eval(expression))

llm = ChatOpenAI(model="gpt-4o")
agent = create_react_agent(llm, [search_web, calculate])

result = agent.invoke(
    {"messages": [{"role": "user", "content": "What is the population of France divided by 3?"}]}
)
print(result["messages"][-1].content)
```

### CrewAI single agent

CrewAI agents have roles, goals, and backstories that shape their behavior.

```python
from crewai import Agent, Task, Crew
from crewai_tools import SerperDevTool

researcher = Agent(
    role="Research Analyst",
    goal="Find accurate, up-to-date information on any topic",
    backstory="You are a senior research analyst with expertise in data gathering and synthesis.",
    tools=[SerperDevTool()],
    llm="gpt-4o",
    verbose=True,
)

task = Task(
    description="Research the current state of AI agent frameworks in 2026. Focus on adoption, key features, and trends.",
    expected_output="A structured report with sections on each major framework.",
    agent=researcher,
)

crew = Crew(agents=[researcher], tasks=[task], verbose=True)
result = crew.kickoff()
print(result.raw)
```

### Pydantic AI agent with type safety

Pydantic AI enforces typed inputs and outputs, catching schema errors before they hit the LLM.

```python
from pydantic_ai import Agent
from pydantic import BaseModel

class ResearchResult(BaseModel):
    summary: str
    key_findings: list[str]
    confidence: float

agent = Agent(
    "openai:gpt-4o",
    result_type=ResearchResult,
    system_prompt="You are a research assistant. Return structured findings.",
)

result = agent.run_sync("What are the top 3 trends in AI agents for 2026?")
print(result.data.summary)
print(result.data.key_findings)
print(f"Confidence: {result.data.confidence}")
```

### smolagents lightweight agent

HuggingFace smolagents runs a code-generating agent with minimal boilerplate.

```python
from smolagents import CodeAgent, HfApiModel, DuckDuckGoSearchTool

agent = CodeAgent(
    tools=[DuckDuckGoSearchTool()],
    model=HfApiModel("Qwen/Qwen2.5-Coder-32B-Instruct"),
)

result = agent.run("Find the latest news about LangChain and summarize it in 3 bullet points.")
print(result)
```

---

## 2. Multi-Agent Orchestration

Use multiple agents when tasks are too complex for one agent, or when different perspectives improve output quality.

### CrewAI crew with role-based agents

Define a team where each agent owns a specialty. CrewAI manages the handoff sequence.

```python
from crewai import Agent, Task, Crew, Process

researcher = Agent(
    role="Senior Researcher",
    goal="Gather comprehensive data on the given topic",
    backstory="Expert at finding and validating information from multiple sources.",
    tools=[SerperDevTool()],
    llm="gpt-4o",
)

analyst = Agent(
    role="Data Analyst",
    goal="Analyze research data and extract actionable insights",
    backstory="Statistician who turns raw data into clear conclusions.",
    llm="gpt-4o",
)

writer = Agent(
    role="Technical Writer",
    goal="Produce clear, well-structured reports",
    backstory="Published author skilled at making complex topics accessible.",
    llm="gpt-4o",
)

research_task = Task(
    description="Research {topic} thoroughly. Find statistics, trends, and expert opinions.",
    expected_output="Raw research notes with sources.",
    agent=researcher,
)

analysis_task = Task(
    description="Analyze the research and identify the top 5 insights.",
    expected_output="Numbered list of insights with supporting data.",
    agent=analyst,
    context=[research_task],
)

report_task = Task(
    description="Write a professional report based on the analysis.",
    expected_output="A 500-word report with introduction, findings, and conclusion.",
    agent=writer,
    context=[analysis_task],
)

crew = Crew(
    agents=[researcher, analyst, writer],
    tasks=[research_task, analysis_task, report_task],
    process=Process.sequential,
    verbose=True,
)

result = crew.kickoff(inputs={"topic": "AI agent frameworks adoption in enterprise"})
```

### AutoGen multi-agent conversation

AutoGen agents talk to each other. The conversation terminates when a condition is met.

```python
from autogen import ConversableAgent

engineer = ConversableAgent(
    name="Engineer",
    system_message="You are a software engineer. Write clean Python code to solve problems. Reply TERMINATE when the task is complete.",
    llm_config={"model": "gpt-4o"},
)

reviewer = ConversableAgent(
    name="Reviewer",
    system_message="You are a code reviewer. Review the code for bugs, security issues, and style. Suggest improvements. Reply TERMINATE when the code is acceptable.",
    llm_config={"model": "gpt-4o"},
)

result = reviewer.initiate_chat(
    engineer,
    message="Write a Python function that safely parses and validates email addresses using regex. Include edge case handling.",
    max_turns=6,
)
```

### OpenAI Swarm handoffs

Swarm uses lightweight function-based handoffs between agents. Good for routing and triage.

```python
from swarm import Swarm, Agent

client = Swarm()

def transfer_to_sales():
    """Transfer the conversation to the sales agent."""
    return sales_agent

def transfer_to_support():
    """Transfer the conversation to the technical support agent."""
    return support_agent

triage_agent = Agent(
    name="Triage",
    instructions="Determine if the user needs sales or support. Route accordingly.",
    functions=[transfer_to_sales, transfer_to_support],
)

sales_agent = Agent(
    name="Sales",
    instructions="Help customers with pricing, plans, and purchases. Be persuasive but honest.",
)

support_agent = Agent(
    name="Support",
    instructions="Help customers resolve technical issues. Ask for error messages and logs.",
)

response = client.run(
    agent=triage_agent,
    messages=[{"role": "user", "content": "My API calls are returning 429 errors"}],
)
print(response.agent.name)  # "Support" -- correctly routed
print(response.messages[-1]["content"])
```

---

## 3. Stateful Agents with Memory (LangGraph)

Use LangGraph when your agent needs persistent state, branching logic, or human-in-the-loop approval.

### Basic stateful agent with memory

```python
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

@tool
def lookup_order(order_id: str) -> str:
    """Look up an order by ID and return its status."""
    orders = {"ORD-001": "shipped", "ORD-002": "processing", "ORD-003": "delivered"}
    return orders.get(order_id, "not found")

llm = ChatOpenAI(model="gpt-4o").bind_tools([lookup_order])

def agent_node(state: MessagesState):
    return {"messages": [llm.invoke(state["messages"])]}

def should_continue(state: MessagesState):
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return END

graph = StateGraph(MessagesState)
graph.add_node("agent", agent_node)
graph.add_node("tools", ToolNode([lookup_order]))
graph.add_edge(START, "agent")
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
graph.add_edge("tools", "agent")

memory = MemorySaver()
app = graph.compile(checkpointer=memory)

# Conversation with memory -- same thread_id preserves context
config = {"configurable": {"thread_id": "customer-session-42"}}
result = app.invoke(
    {"messages": [{"role": "user", "content": "What's the status of ORD-001?"}]},
    config=config,
)
print(result["messages"][-1].content)

# Follow-up in same session -- agent remembers previous context
result = app.invoke(
    {"messages": [{"role": "user", "content": "And what about ORD-002?"}]},
    config=config,
)
print(result["messages"][-1].content)
```

### Human-in-the-loop approval gate

Pause the agent before executing sensitive actions and wait for human approval.

```python
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

@tool
def delete_record(record_id: str) -> str:
    """Delete a record from the database. Requires human approval."""
    return f"Record {record_id} deleted."

llm = ChatOpenAI(model="gpt-4o").bind_tools([delete_record])

def agent_node(state: MessagesState):
    return {"messages": [llm.invoke(state["messages"])]}

def should_continue(state: MessagesState):
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return END

graph = StateGraph(MessagesState)
graph.add_node("agent", agent_node)
graph.add_node("tools", ToolNode([delete_record]))
graph.add_edge(START, "agent")
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
graph.add_edge("tools", "agent")

memory = MemorySaver()
app = graph.compile(checkpointer=memory, interrupt_before=["tools"])

config = {"configurable": {"thread_id": "admin-session-1"}}
result = app.invoke(
    {"messages": [{"role": "user", "content": "Delete record REC-999"}]},
    config=config,
)

# Agent is paused before tool execution -- inspect what it wants to do
pending = result["messages"][-1].tool_calls
print(f"Agent wants to call: {pending}")

# Resume after human approves
result = app.invoke(None, config=config)
print(result["messages"][-1].content)
```

---

## 4. Tool Integration Patterns

Agents become powerful when they can interact with external systems. These patterns work across all frameworks.

### Web search tool

```python
# LangChain / LangGraph
from langchain_community.tools.tavily_search import TavilySearchResults
search = TavilySearchResults(max_results=5)

# CrewAI
from crewai_tools import SerperDevTool, ScrapeWebsiteTool
search = SerperDevTool()
scraper = ScrapeWebsiteTool()

# smolagents
from smolagents import DuckDuckGoSearchTool
search = DuckDuckGoSearchTool()
```

### Code execution tool (sandboxed)

```python
from langchain_core.tools import tool
import subprocess

@tool
def run_python(code: str) -> str:
    """Execute Python code in a sandboxed subprocess. Returns stdout and stderr."""
    try:
        result = subprocess.run(
            ["python", "-c", code],
            capture_output=True, text=True, timeout=30,
            env={"PATH": "/usr/bin:/usr/local/bin"},  # restricted env
        )
        output = result.stdout
        if result.stderr:
            output += f"\nSTDERR: {result.stderr}"
        return output[:5000]  # truncate long output
    except subprocess.TimeoutExpired:
        return "Error: code execution timed out after 30 seconds"
```

### File operations tool

```python
from langchain_core.tools import tool
from pathlib import Path

ALLOWED_DIR = Path("/tmp/agent-workspace")
ALLOWED_DIR.mkdir(exist_ok=True)

@tool
def read_file(filename: str) -> str:
    """Read a file from the agent workspace."""
    path = (ALLOWED_DIR / filename).resolve()
    if not str(path).startswith(str(ALLOWED_DIR)):
        return "Error: path traversal not allowed"
    if not path.exists():
        return f"Error: {filename} not found"
    return path.read_text()[:10000]

@tool
def write_file(filename: str, content: str) -> str:
    """Write content to a file in the agent workspace."""
    path = (ALLOWED_DIR / filename).resolve()
    if not str(path).startswith(str(ALLOWED_DIR)):
        return "Error: path traversal not allowed"
    path.write_text(content)
    return f"Written {len(content)} chars to {filename}"

@tool
def list_files() -> str:
    """List all files in the agent workspace."""
    files = [f.name for f in ALLOWED_DIR.iterdir() if f.is_file()]
    return "\n".join(files) if files else "No files in workspace"
```

### Database query tool

```python
from langchain_core.tools import tool
import sqlite3

@tool
def query_database(sql: str) -> str:
    """Run a read-only SQL query against the application database."""
    if not sql.strip().upper().startswith("SELECT"):
        return "Error: only SELECT queries are allowed"
    conn = sqlite3.connect("/path/to/app.db")
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(sql).fetchall()
        return str([dict(r) for r in rows[:50]])
    except sqlite3.Error as e:
        return f"SQL Error: {e}"
    finally:
        conn.close()
```

---

## 5. Agent Evaluation and Debugging

Trace agent execution, replay steps, and measure quality before deploying.

### LangSmith tracing (LangChain/LangGraph)

Enable tracing to see every LLM call, tool invocation, and decision point.

```bash
export LANGCHAIN_TRACING_V2=true
export LANGCHAIN_API_KEY="lsv2_..."
export LANGCHAIN_PROJECT="my-agent-eval"
```

Then run your agent normally. Every run is logged to the LangSmith dashboard with full traces.

### Manual step logging

Add logging to any framework for local debugging without external services.

```python
import logging
import json
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger("agent")

class AgentTracer:
    def __init__(self):
        self.steps = []

    def log_step(self, step_type: str, data: dict):
        entry = {"time": datetime.now().isoformat(), "type": step_type, **data}
        self.steps.append(entry)
        logger.info(json.dumps(entry, default=str))

    def log_llm_call(self, prompt: str, response: str, model: str):
        self.log_step("llm_call", {
            "model": model,
            "prompt_len": len(prompt),
            "response_len": len(response),
            "response_preview": response[:200],
        })

    def log_tool_call(self, tool_name: str, args: dict, result: str):
        self.log_step("tool_call", {
            "tool": tool_name,
            "args": args,
            "result_len": len(result),
            "result_preview": result[:200],
        })

    def save_trace(self, filepath: str):
        with open(filepath, "w") as f:
            json.dump(self.steps, f, indent=2, default=str)

    def replay(self):
        for step in self.steps:
            print(f"[{step['time']}] {step['type']}: {json.dumps({k: v for k, v in step.items() if k not in ('time', 'type')}, default=str)[:120]}")
```

### Evaluation with test cases

Run your agent against a suite of known-good inputs and expected outputs.

```python
import json

test_cases = [
    {"input": "What is 25 * 4?", "expected_contains": "100"},
    {"input": "Search for Python 3.13 release date", "expected_contains": "2024"},
    {"input": "What is the capital of France?", "expected_contains": "Paris"},
]

results = []
for case in test_cases:
    response = agent.invoke({"messages": [{"role": "user", "content": case["input"]}]})
    answer = response["messages"][-1].content
    passed = case["expected_contains"].lower() in answer.lower()
    results.append({"input": case["input"], "passed": passed, "answer": answer[:200]})
    print(f"{'PASS' if passed else 'FAIL'}: {case['input']}")

pass_rate = sum(1 for r in results if r["passed"]) / len(results)
print(f"\nPass rate: {pass_rate:.0%} ({sum(1 for r in results if r['passed'])}/{len(results)})")
```

---

## 6. Production Deployment

Serve agents behind API endpoints with error recovery, timeouts, and async processing.

### FastAPI agent endpoint

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncio

app = FastAPI()

class AgentRequest(BaseModel):
    message: str
    session_id: str = "default"

class AgentResponse(BaseModel):
    reply: str
    steps: int
    session_id: str

@app.post("/agent/chat", response_model=AgentResponse)
async def chat(req: AgentRequest):
    config = {"configurable": {"thread_id": req.session_id}}
    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(
                app_graph.invoke,
                {"messages": [{"role": "user", "content": req.message}]},
                config=config,
            ),
            timeout=120.0,
        )
        return AgentResponse(
            reply=result["messages"][-1].content,
            steps=len(result["messages"]),
            session_id=req.session_id,
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Agent timed out after 120s")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")
```

### Error recovery with retries

Wrap agent execution in retry logic for transient LLM API failures.

```python
import time
from functools import wraps

def retry_agent(max_retries: int = 3, backoff: float = 2.0):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            last_error = None
            for attempt in range(max_retries):
                try:
                    return fn(*args, **kwargs)
                except Exception as e:
                    last_error = e
                    if "rate_limit" in str(e).lower() or "429" in str(e):
                        wait = backoff ** attempt
                        print(f"Rate limited, retrying in {wait}s (attempt {attempt + 1})")
                        time.sleep(wait)
                    else:
                        raise
            raise last_error
        return wrapper
    return decorator

@retry_agent(max_retries=3)
def run_agent(message: str, session_id: str):
    config = {"configurable": {"thread_id": session_id}}
    return app_graph.invoke(
        {"messages": [{"role": "user", "content": message}]},
        config=config,
    )
```

### Background task queue with Redis

For long-running agent tasks, offload to a background worker.

```python
import redis
import json
import uuid

r = redis.Redis()

def enqueue_agent_task(message: str, session_id: str) -> str:
    task_id = str(uuid.uuid4())
    r.lpush("agent:tasks", json.dumps({
        "task_id": task_id,
        "message": message,
        "session_id": session_id,
    }))
    return task_id

def get_task_result(task_id: str) -> dict | None:
    result = r.get(f"agent:result:{task_id}")
    return json.loads(result) if result else None

# Worker process (run separately)
def worker_loop():
    while True:
        _, raw = r.brpop("agent:tasks")
        task = json.loads(raw)
        try:
            result = run_agent(task["message"], task["session_id"])
            r.set(f"agent:result:{task['task_id']}", json.dumps({
                "status": "complete",
                "reply": result["messages"][-1].content,
            }), ex=3600)
        except Exception as e:
            r.set(f"agent:result:{task['task_id']}", json.dumps({
                "status": "error",
                "error": str(e),
            }), ex=3600)
```

---

## 7. Common Agent Patterns

Ready-to-use agent blueprints for frequent use cases.

### Researcher agent

Searches the web, synthesizes findings, and produces structured reports.

```python
from crewai import Agent, Task, Crew

researcher = Agent(
    role="Senior Research Analyst",
    goal="Produce thorough, well-sourced research reports",
    backstory="Experienced analyst with 10 years in market research. You always cite sources and distinguish facts from opinions.",
    tools=[SerperDevTool(), ScrapeWebsiteTool()],
    llm="gpt-4o",
)

task = Task(
    description="Research {topic}. Find at least 5 sources. Include statistics where available. Distinguish confirmed facts from speculation.",
    expected_output="A structured report with: Executive Summary, Key Findings (numbered), Data Points, Sources, and Conclusion.",
    agent=researcher,
)

crew = Crew(agents=[researcher], tasks=[task])
result = crew.kickoff(inputs={"topic": "enterprise adoption of AI agents in 2026"})
```

### Code agent

Writes, tests, and iterates on code based on natural language specs.

```python
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

@tool
def execute_python(code: str) -> str:
    """Execute Python code and return output. Use this to test code you write."""
    import subprocess
    result = subprocess.run(
        ["python", "-c", code], capture_output=True, text=True, timeout=30,
    )
    return (result.stdout + result.stderr)[:5000]

@tool
def write_code_file(filename: str, code: str) -> str:
    """Save code to a file in the workspace."""
    from pathlib import Path
    path = Path("/tmp/agent-workspace") / filename
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(code)
    return f"Saved {filename} ({len(code)} chars)"

llm = ChatOpenAI(model="gpt-4o")
code_agent = create_react_agent(
    llm, [execute_python, write_code_file],
    prompt="You are an expert Python developer. Write clean, tested code. Always execute your code to verify it works before finalizing.",
)

result = code_agent.invoke({
    "messages": [{"role": "user", "content": "Write a Python function that converts a nested JSON structure to a flat dictionary with dot-notation keys. Include tests."}]
})
```

### Data analyst agent

Queries databases, runs computations, and produces visual summaries.

```python
from pydantic_ai import Agent
from pydantic import BaseModel

class AnalysisResult(BaseModel):
    summary: str
    insights: list[str]
    sql_queries_used: list[str]
    recommendations: list[str]

analyst = Agent(
    "openai:gpt-4o",
    result_type=AnalysisResult,
    system_prompt="""You are a data analyst. When given a question about data:
1. Formulate SQL queries to answer it
2. Analyze the results
3. Provide actionable insights and recommendations
Always explain your reasoning.""",
    tools=[query_database],
)

result = analyst.run_sync("What are the top 10 customers by revenue this quarter, and what trends do you see?")
print(result.data.summary)
for insight in result.data.insights:
    print(f"  - {insight}")
```

---

## 8. Comparison Guide: When to Use Which Framework

| Framework | Best For | Complexity | Multi-Agent | Stateful | Typed Output |
|---|---|---|---|---|---|
| **LangChain + LangGraph** | Complex stateful workflows, production apps | Medium-High | Yes (graph) | Yes (checkpoints) | Via Pydantic |
| **CrewAI** | Role-based teams, sequential/parallel pipelines | Low-Medium | Yes (crews) | Limited | Yes |
| **AutoGen** | Conversational multi-agent, code generation | Medium | Yes (chat) | Via memory | No |
| **Pydantic AI** | Type-safe single agents, structured output | Low | No | No | Yes (native) |
| **smolagents** | Quick prototypes, code-generating agents | Low | Limited | No | No |
| **Swarm** | Routing, triage, handoff patterns | Low | Yes (handoffs) | No | No |
| **Phidata/Agno** | Multi-modal agents, rapid prototyping | Low | Yes | Optional | Optional |
| **Semantic Kernel** | Enterprise .NET/Python, Microsoft ecosystem | Medium | Plugins | Yes | Via models |

### Decision tree

- **Need structured, typed output?** Start with Pydantic AI.
- **Need multi-agent conversations?** Use AutoGen or CrewAI.
- **Need stateful workflows with branching?** Use LangGraph.
- **Need agent routing and handoffs?** Use Swarm.
- **Need a quick prototype in <50 lines?** Use smolagents or Phidata.
- **Building for production with observability?** Use LangChain + LangGraph + LangSmith.
- **Enterprise with Microsoft stack?** Use Semantic Kernel.
- **Role-based team with clear task delegation?** Use CrewAI.

### Combining frameworks

Frameworks are not mutually exclusive. Common combinations:

```python
# Use Pydantic AI for structured extraction inside a LangGraph workflow
# Use CrewAI for orchestration with LangChain tools
# Use Swarm for routing, then hand off to specialized LangGraph agents
```

---

## Troubleshooting

**Agent loops forever**: Set `max_iterations` or `recursion_limit`. In LangGraph: `app.invoke(input, config={"recursion_limit": 25})`. In CrewAI: `max_iter=10` on the agent.

**Tool not being called**: Verify the tool's docstring clearly describes when to use it. LLMs decide tool usage based on the description. Be specific: "Search the web for current events" beats "search tool".

**Rate limit errors (429)**: Add retry logic with exponential backoff. Reduce parallelism. Use `max_rpm` in CrewAI or rate limiting middleware in LangChain.

**Memory not persisting**: In LangGraph, ensure you pass a `checkpointer` to `compile()` and use the same `thread_id` across invocations. Without a checkpointer, state is lost between calls.

**Agent hallucinates tool names**: Bind tools explicitly with `llm.bind_tools([...])`. Never rely on the agent knowing tool names from the system prompt alone.

**Import errors after install**: Some packages have different import names. `pip install pyautogen` but `import autogen`. `pip install crewai` and `import crewai`. Check the framework's docs for the correct import path.
