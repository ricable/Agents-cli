---
name: llm-inference-workflow
version: 1.0.0
description: "Local LLM inference and model serving workflow using ollama, llama.cpp, llm, vllm, litellm, and localai. Use this skill whenever the user needs to run a language model locally, serve a model as an API, compare model performance, convert model formats, set up an LLM gateway, do batch inference, extract structured data with a local LLM, or do code review with a local model — even if they just say 'run llama locally' or 'serve a model' or 'benchmark models' or 'set up litellm' or 'use ollama' or 'local AI' or 'private inference'."
ingredients:
  - ollama/ollama
  - ggml-org/llama.cpp
  - simonw/llm
  - vllm-project/vllm
  - BerriAI/litellm
  - mudler/LocalAI
tags:
  - workflow
  - ai-ml
  - llm
  - inference
  - local-ai
  - model-serving
---

# Local LLM Inference Workflow

Run language models on your own hardware with zero cloud dependency. This workflow combines six tools: ollama for quick model management, llama.cpp for raw performance, llm for unified CLI interaction, vllm for high-throughput serving, litellm for multi-provider API routing, and localai for OpenAI-compatible local endpoints.

Use this instead of cloud APIs when you need privacy, offline access, cost control, or low-latency inference without rate limits.

---

## 1. Model Discovery and Download

### Pull models with ollama (fastest path)

```bash
ollama pull llama3.2
ollama pull mistral
ollama pull codellama:13b
ollama pull deepseek-coder-v2:16b

# Pull a specific quantization (smaller = faster, larger = smarter)
ollama pull llama3.2:8b-q4_K_M
```

WHY: ollama auto-downloads GGUF models and manages storage. The `q4_K_M` quantization is the best quality-per-byte tradeoff for most tasks.

### List and inspect models

```bash
ollama list                          # installed models with sizes
ollama search llama                  # search the library
ollama show llama3.2 --modelfile     # parameters, template, license
```

### Download GGUF from HuggingFace (for llama.cpp)

```bash
pip install huggingface-hub
huggingface-cli download TheBloke/Llama-2-7B-Chat-GGUF \
  llama-2-7b-chat.Q4_K_M.gguf --local-dir ./models
```

### Register models with the llm CLI

```bash
llm install llm-ollama       # bridge ollama models into llm
llm install llm-gguf         # direct GGUF file support
llm models list && llm models default llama3.2
```

---

## 2. Local Inference Workflows

### Interactive and single-shot prompts

```bash
# Chat session (keeps context across turns)
ollama run llama3.2

# Single-shot
echo "Explain the CAP theorem in 3 sentences." | ollama run llama3.2

# With system prompt
ollama run llama3.2 --system "You are a senior Python developer. Be concise."

# llm CLI — same patterns, provider-agnostic
llm "Explain dependency injection" -m llama3.2
llm -s "You are a bash expert. Only output commands." "Find files over 100MB"
llm "What is a monad?" -c   # continue conversation
```

### Batch inference

```bash
# Process prompts from a file
cat prompts.txt | while IFS= read -r prompt; do
  llm "$prompt" -m llama3.2; echo "---"
done > outputs.txt

# Parallel batch (faster on multi-core)
cat prompts.txt | xargs -P 4 -I{} sh -c \
  'echo "{}" | ollama run llama3.2' > outputs.txt
```

### Piped inference (compose with Unix tools)

```bash
cat README.md | llm -s "Summarize this document in 5 bullet points"
cargo build 2>&1 | llm -s "Explain these compiler errors and suggest fixes"
git diff --cached | llm -s "Write a conventional commit message. Output only the message."
cat data.json | jq '.[] | .description' -r | \
  llm -s "Categorize each line as: bug, feature, or chore. Output JSON array."
```

### Direct llama.cpp inference (maximum control)

```bash
llama-cli \
  -m models/llama-2-7b-chat.Q4_K_M.gguf \
  -p "Explain quicksort:" \
  -n 256 --temp 0.7 --top-p 0.9 --repeat-penalty 1.1 \
  -ngl 99  # offload all layers to GPU
```

WHY: llama.cpp exposes sampling parameters and hardware offloading directly. Use when ollama defaults are insufficient.

---

## 3. Model Serving

### ollama (simplest path)

```bash
ollama serve  # port 11434

curl -s http://localhost:11434/api/chat -d '{
  "model": "llama3.2",
  "messages": [{"role": "user", "content": "What is 2+2?"}],
  "stream": false
}' | jq '.message.content'
```

### llama.cpp server (OpenAI-compatible)

```bash
llama-server \
  -m models/llama-2-7b-chat.Q4_K_M.gguf \
  --host 0.0.0.0 --port 8080 \
  -ngl 99 --ctx-size 4096 --parallel 4

curl -s http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" -d '{
  "model": "llama-2-7b-chat",
  "messages": [{"role": "user", "content": "Hello!"}]
}' | jq '.choices[0].message.content'
```

### vllm (high throughput, requires GPU)

```bash
pip install vllm
vllm serve meta-llama/Llama-3.2-8B-Instruct \
  --host 0.0.0.0 --port 8000 --max-model-len 4096

# Batch inference (much faster than sequential)
curl -s http://localhost:8000/v1/completions -H "Content-Type: application/json" \
  -d '{"model":"meta-llama/Llama-3.2-8B-Instruct","prompt":["What is Python?","What is Rust?"],"max_tokens":100}' | jq '.choices[].text'
```

WHY: vllm uses PagedAttention for 2-4x higher throughput. Use for concurrent requests or large batch jobs.

### LocalAI (OpenAI drop-in via Docker)

```bash
docker run -p 8080:8080 -v $PWD/models:/models -e MODELS_PATH=/models localai/localai:latest-cpu
# GPU: localai/localai:latest-gpu-nvidia-cuda-12 with --gpus all
curl http://localhost:8080/v1/models | jq '.data[].id'
```

---

## 4. API Gateway Setup with LiteLLM

Route to multiple backends through a single OpenAI-compatible endpoint.

### Configure and start the proxy

```yaml
# litellm_config.yaml
model_list:
  - model_name: "fast"
    litellm_params:
      model: "ollama/llama3.2"
      api_base: "http://localhost:11434"
  - model_name: "code"
    litellm_params:
      model: "ollama/deepseek-coder-v2:16b"
      api_base: "http://localhost:11434"
  - model_name: "large"
    litellm_params:
      model: "openai/meta-llama/Llama-3.2-8B-Instruct"
      api_base: "http://localhost:8000"
      api_key: "dummy"

router_settings:
  routing_strategy: "simple-shuffle"
  fallbacks: [{"fast": ["code"]}]

general_settings:
  master_key: "sk-local-dev-key"
```

```bash
pip install litellm[proxy]
litellm --config litellm_config.yaml --host 0.0.0.0 --port 4000

curl -s http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-local-dev-key" \
  -H "Content-Type: application/json" \
  -d '{"model": "fast", "messages": [{"role": "user", "content": "Hello"}]}' \
  | jq '.choices[0].message.content'

# Point any OpenAI client at litellm
export OPENAI_API_KEY="sk-local-dev-key"
export OPENAI_API_BASE="http://localhost:4000"
```

WHY: litellm decouples your application from any specific provider. Swap models, add fallbacks, and load-balance without changing code.

---

## 5. Performance Comparison and Benchmarking

### Quick model comparison

```bash
for model in llama3.2 mistral phi3:medium gemma2:9b; do
  echo "=== $model ==="
  time echo "Explain the CAP theorem in 3 sentences." | ollama run "$model" > /dev/null
done
```

### llama.cpp benchmark (detailed metrics)

```bash
llama-bench -m models/llama-2-7b-chat.Q4_K_M.gguf -p 512 -n 128 -ngl 99

# Compare quantizations
for q in Q4_K_M Q5_K_M Q8_0; do
  echo "=== $q ===" && llama-bench -m "models/model.${q}.gguf" -p 512 -n 128 -ngl 99
done
```

### HTTP latency and throughput

```bash
# Average latency over 10 requests
for i in $(seq 1 10); do
  curl -s -o /dev/null -w "%{time_total}\n" \
    http://localhost:11434/api/generate -d \
    '{"model":"llama3.2","prompt":"Say hello.","stream":false}'
done | awk '{s+=$1;c++} END {print "Avg:", s/c, "s"}'

# Concurrent throughput (10 parallel requests)
seq 20 | xargs -P 10 -I{} curl -s -o /dev/null -w "req {}: %{time_total}s\n" \
  http://localhost:11434/api/generate -d \
  '{"model":"llama3.2","prompt":"What is 2+2?","stream":false}'
```

### Memory monitoring

```bash
nvidia-smi --query-gpu=memory.used,memory.total --format=csv
```

---

## 6. Agent Integration Patterns

### Structured JSON output

```bash
# ollama native JSON mode
curl -s http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "List 3 programming languages with year and creator. JSON array.",
  "format": "json", "stream": false
}' | jq '.response | fromjson'

# llm CLI
llm -s "Always respond with valid JSON only." \
  "Top 5 HTTP status codes with meanings" | jq '.'

# llama.cpp grammar-constrained output
curl -s http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" -d '{
  "messages": [{"role": "user", "content": "JSON object: city, country, population for Tokyo."}],
  "response_format": {"type": "json_object"}
}' | jq '.choices[0].message.content | fromjson'
```

### Streaming and tool calling

```bash
curl -s http://localhost:11434/api/chat -d '{
  "model": "llama3.2",
  "messages": [{"role": "user", "content": "What is the weather in Paris?"}],
  "tools": [{"type": "function", "function": {
    "name": "get_weather", "description": "Get weather for a city",
    "parameters": {"type": "object",
      "properties": {"city": {"type": "string"}}, "required": ["city"]}
  }}], "stream": false
}' | jq '.message.tool_calls'

# Stream tokens from ollama
curl -sN http://localhost:11434/api/generate -d '{
  "model": "llama3.2", "prompt": "Explain recursion."
}' | while IFS= read -r line; do
  echo "$line" | jq -r '.response // empty' 2>/dev/null
done
```

### Embeddings for RAG

```bash
ollama pull nomic-embed-text
curl -s http://localhost:11434/api/embed -d '{
  "model": "nomic-embed-text",
  "input": ["First doc about Python.", "Second doc about Rust."]
}' | jq '.embeddings | length'
```

---

## 7. Model Format Conversion

### HuggingFace to GGUF (for llama.cpp / ollama)

```bash
git clone https://github.com/ggml-org/llama.cpp.git && cd llama.cpp
pip install -r requirements/requirements-convert_hf_to_gguf.txt

python convert_hf_to_gguf.py /path/to/hf-model \
  --outfile models/my-model-f16.gguf --outtype f16

# Quantize (reduce size, slight quality loss)
./llama-quantize models/my-model-f16.gguf models/my-model-q4_K_M.gguf Q4_K_M
```

### Quantization reference

| Format | Bits | Size (7B) | Quality | Use Case |
|--------|------|-----------|---------|----------|
| Q3_K_M | 3.9  | ~3.3 GB   | Decent  | Memory-constrained systems |
| Q4_K_M | 4.8  | ~4.1 GB   | Good    | Best quality/size tradeoff |
| Q5_K_M | 5.7  | ~4.8 GB   | Better  | When you have spare RAM |
| Q8_0   | 8.5  | ~7.2 GB   | Near-FP16 | Quality-critical tasks |
| F16    | 16   | ~13 GB    | Original | Baseline / source for quantization |

### Import GGUF into ollama

```bash
cat > Modelfile <<'EOF'
FROM ./models/my-model-q4_K_M.gguf
TEMPLATE """{{ if .System }}<|system|>
{{ .System }}<|end|>
{{ end }}<|user|>
{{ .Prompt }}<|end|>
<|assistant|>
{{ .Response }}<|end|>"""
PARAMETER temperature 0.7
PARAMETER stop "<|end|>"
PARAMETER num_ctx 4096
EOF

ollama create my-model -f Modelfile
echo "Hello!" | ollama run my-model
```

### GPTQ and AWQ (GPU quantization for vllm)

```bash
# GPTQ — good for vllm GPU serving
pip install auto-gptq
python -c "
from auto_gptq import AutoGPTQForCausalLM; from transformers import AutoTokenizer
model = AutoGPTQForCausalLM.from_pretrained('meta-llama/Llama-3.2-8B-Instruct',
  quantize_config={'bits': 4, 'group_size': 128})
model.quantize(calibration_data)
model.save_quantized('models/llama3-8b-gptq-4bit')
"

# AWQ — faster than GPTQ, similar quality
pip install autoawq
python -c "
from awq import AutoAWQForCausalLM; from transformers import AutoTokenizer
model = AutoAWQForCausalLM.from_pretrained('meta-llama/Llama-3.2-8B-Instruct')
tokenizer = AutoTokenizer.from_pretrained('meta-llama/Llama-3.2-8B-Instruct')
model.quantize(tokenizer, quant_config={'w_bit': 4, 'q_group_size': 128})
model.save_quantized('models/llama3-8b-awq-4bit')
"
```

WHY: GGUF is for CPU and llama.cpp/ollama. GPTQ/AWQ are for GPU serving with vllm. Pick based on hardware.

---

## 8. Common Agent Workflows

### Code review via local LLM

```bash
git diff --cached | llm -s "Review this diff for bugs, security issues, performance, and readability. Be specific with line numbers."

gh pr diff 42 | llm -s "Review this PR. Focus on breaking changes and missing error handling."

# Structured review output
git diff --cached | llm -s 'Review this diff. Respond as JSON:
{"issues": [{"file":"...","line":0,"severity":"high|medium|low","description":"...","suggestion":"..."}], "summary":"...", "approve": true}' | jq '.'
```

### Document summarization

```bash
cat docs/architecture.md | llm -s "Summarize in 5 bullet points. Focus on key decisions."

fd -e md -d 1 docs/ -x sh -c '
  echo "=== {} ===" && cat {} | llm -s "One-sentence summary."
'

tail -1000 app.log | llm -s "Summarize key events. List errors, warnings, and patterns."
```

### Data extraction

```bash
cat emails.txt | llm -s 'Extract named entities. Return JSON:
{"people":[],"companies":[],"dates":[],"locations":[],"amounts":[]}' | jq '.'

cat receipt.txt | llm -s 'Extract: vendor, date, line items, subtotal, tax, total. Return JSON.' | jq '.'

cat api_docs.md | llm -s 'Extract API endpoints as JSON:
[{"method":"GET","path":"/api/...","description":"..."}]' | jq '.'
```

### Test generation

```bash
cat src/utils.py | llm -s "Write pytest tests for every function. Cover edge cases and errors."

rg -A 20 "^def calculate_discount" src/pricing.py | \
  llm -s "Write comprehensive pytest tests. Include boundary values and invalid inputs."

llm -s 'Generate 20 test records as JSON array. Fields: id, name, email, age, country, plan (free|pro|enterprise)' | jq '.' > test_data.json
```

### Multi-model routing (classify then dispatch)

```bash
classify() { echo "$1" | llm -m llama3.2 -s "Classify as: code, text, data. Output only the word."; }
process() {
  case "$(classify "$1")" in
    code*) echo "$1" | llm -m deepseek-coder-v2 ;;
    data*) echo "$1" | llm -m llama3.2 -s "Extract structured data. Return JSON." ;;
    *) echo "$1" | llm -m mistral ;;
  esac
}
process "Write a Python function to validate emails"
```

---

## Troubleshooting

**ollama: model not found**: Run `ollama pull model-name` first. Names are case-sensitive.

**CUDA out of memory**: Reduce GPU layers with `-ngl 20` instead of `-ngl 99`, or use smaller quantization.

**vllm: model too large**: Set `--max-model-len 2048` to reduce KV cache, or use `--quantization awq`.

**litellm proxy 500**: Verify the backend is running. Test with curl directly before routing through litellm.

**Slow first response**: First inference loads the model. Keep loaded: `OLLAMA_KEEP_ALIVE=-1 ollama serve`.

**Invalid JSON output**: Use `"format": "json"` with ollama or grammar-constrained generation with llama.cpp. Models under 7B struggle with complex JSON.

---

## Quick Reference

| Task | Command |
|---|---|
| Pull a model | `ollama pull llama3.2` |
| Chat interactively | `ollama run llama3.2` |
| Single prompt | `echo "question" \| ollama run llama3.2` |
| LLM CLI prompt | `llm "question" -m llama3.2` |
| Serve via ollama | `ollama serve` |
| Serve via llama.cpp | `llama-server -m model.gguf --port 8080` |
| Serve via vllm | `vllm serve model-name --port 8000` |
| API gateway | `litellm --config config.yaml --port 4000` |
| JSON output | `curl ... -d '{"format":"json"}'` |
| Embeddings | `curl .../api/embed -d '{"model":"nomic-embed-text"}'` |
| Convert to GGUF | `python convert_hf_to_gguf.py model --outfile out.gguf` |
| Quantize | `llama-quantize in.gguf out.gguf Q4_K_M` |
| Import to ollama | `ollama create name -f Modelfile` |
| Code review | `git diff \| llm -s "Review this diff"` |
| Summarize | `cat file \| llm -s "Summarize in 5 points"` |
| Extract data | `cat text \| llm -s "Extract as JSON"` |
| Benchmark | `llama-bench -m model.gguf -p 512 -n 128` |
