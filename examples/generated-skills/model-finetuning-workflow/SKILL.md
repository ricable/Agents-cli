---
name: model-finetuning-workflow
version: 1.0.0
description: "Complete LLM fine-tuning and training workflow using axolotl, unsloth, llama-factory, torchtune, trl, peft, mergekit, and openrlhf. Use this skill whenever the user needs to fine-tune a language model, prepare training data, run LoRA/QLoRA training, do RLHF or DPO alignment, merge models, convert to GGUF, quantize weights, or evaluate fine-tuned models — even if they just say 'fine-tune llama' or 'train on my data' or 'merge two models' or 'convert to ollama format'."
ingredients:
  - axolotl-ai-cloud/axolotl
  - unslothai/unsloth
  - hiyouga/LLaMA-Factory
  - pytorch/torchtune
  - huggingface/trl
  - huggingface/peft
  - arcee-ai/mergekit
  - OpenRLHF/OpenRLHF
tags:
  - workflow
  - ai-ml
  - fine-tuning
  - lora
  - rlhf
  - training
  - model-merging
---

# LLM Fine-Tuning & Training Workflow

End-to-end workflow for fine-tuning large language models. Each section is a self-contained recipe agents can execute directly.

**Prerequisites:** Python 3.10+, CUDA GPU (16GB+ VRAM for LoRA, 80GB+ for full fine-tuning), `uv` for package management.

---

## 1. Data Preparation

Bad data is the #1 cause of failed fine-tunes. Always clean and validate before training.

### Convert to ShareGPT format, clean, deduplicate, and split

```python
import json, hashlib
from datasets import load_dataset, Dataset

# Convert instruction/response pairs to ShareGPT format
raw = [{"instruction": "Explain quantum computing", "response": "Quantum computing uses..."}]
sharegpt = [{"conversations": [
    {"from": "human", "value": r["instruction"]},
    {"from": "gpt", "value": r["response"]}
]} for r in raw]
with open("train_sharegpt.json", "w") as f:
    json.dump(sharegpt, f, indent=2)

# Load, deduplicate, filter, split
ds = load_dataset("json", data_files="train_sharegpt.json", split="train")
seen, unique = set(), []
for row in ds:
    h = hashlib.sha256(json.dumps(row["conversations"], sort_keys=True).encode()).hexdigest()
    if h not in seen:
        seen.add(h)
        unique.append(row)
ds_clean = Dataset.from_list([r for r in unique if all(
    len(t["value"].strip()) > 20 for t in r["conversations"] if t["from"] == "gpt")])
split = ds_clean.train_test_split(test_size=0.05, seed=42)
split["train"].to_json("data/train.json")
split["test"].to_json("data/val.json")
print(f"Train: {len(split['train'])}, Val: {len(split['test'])}")
```

### Validate token lengths

```python
from transformers import AutoTokenizer
import statistics

tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-3.1-8B-Instruct")
lengths = [len(tokenizer.encode(tokenizer.apply_chat_template(
    [{"role": "user" if c["from"] == "human" else "assistant", "content": c["value"]}
     for c in row["conversations"]], tokenize=False
))) for row in split["train"]]

print(f"Tokens — min: {min(lengths)}, max: {max(lengths)}, mean: {statistics.mean(lengths):.0f}")
print(f"Samples > 2048 tokens: {sum(1 for l in lengths if l > 2048)}")
```

WHY: Samples exceeding `max_seq_length` get truncated, corrupting examples. Know your distribution before choosing sequence length.

---

## 2. LoRA/QLoRA Fine-Tuning with Unsloth

Use unsloth for 2x faster LoRA/QLoRA with 60% less memory. Recommended for most tasks on consumer GPUs (24GB VRAM).

```bash
uv pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
uv pip install --no-deps trl peft accelerate bitsandbytes xformers
```

### QLoRA training (4-bit quantized)

```python
from unsloth import FastLanguageModel
from trl import SFTTrainer
from transformers import TrainingArguments
from datasets import load_dataset

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/Meta-Llama-3.1-8B-Instruct-bnb-4bit",
    max_seq_length=2048, dtype=None, load_in_4bit=True,
)
model = FastLanguageModel.get_peft_model(model,
    r=16, target_modules=["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"],
    lora_alpha=16, lora_dropout=0, bias="none",
    use_gradient_checkpointing="unsloth",  # 30% less VRAM
)

dataset = load_dataset("json", data_files="data/train.json", split="train")
def format_chat(ex):
    ex["text"] = tokenizer.apply_chat_template(
        [{"role": "user" if c["from"]=="human" else "assistant", "content": c["value"]}
         for c in ex["conversations"]], tokenize=False)
    return ex
dataset = dataset.map(format_chat)

trainer = SFTTrainer(model=model, tokenizer=tokenizer, train_dataset=dataset,
    dataset_text_field="text", max_seq_length=2048,
    args=TrainingArguments(
        per_device_train_batch_size=4, gradient_accumulation_steps=4,
        warmup_steps=10, num_train_epochs=3, learning_rate=2e-4,
        fp16=True, logging_steps=10, output_dir="outputs/llama-lora",
        save_strategy="epoch", optim="adamw_8bit", seed=42,
))
trainer.train()
model.save_pretrained("outputs/llama-lora/final")
tokenizer.save_pretrained("outputs/llama-lora/final")
```

For 16-bit LoRA (better quality, ~2x VRAM), set `load_in_4bit=False` and increase `r=32`.

### Merge LoRA back into base model

```python
model, tokenizer = FastLanguageModel.from_pretrained(
    "outputs/llama-lora/final", max_seq_length=2048, dtype=None, load_in_4bit=False)
model.save_pretrained_merged("outputs/llama-merged", tokenizer)
```

---

## 3. Full Fine-Tuning

### Axolotl (config-driven, multi-GPU)

```bash
git clone https://github.com/axolotl-ai-cloud/axolotl.git && cd axolotl
uv pip install packaging ninja && uv pip install --no-build-isolation -e ".[flash-attn,deepspeed]"
```

Create `config.yml`:

```yaml
base_model: meta-llama/Llama-3.1-8B-Instruct
model_type: LlamaForCausalLM
load_in_8bit: false
load_in_4bit: false
datasets:
  - path: data/train.json
    type: sharegpt
    conversation: chatml
val_set_size: 0.05
sequence_len: 2048
sample_packing: true
pad_to_sequence_len: true
adapter:
output_dir: outputs/llama-full
gradient_accumulation_steps: 8
micro_batch_size: 2
num_epochs: 3
learning_rate: 2e-5
optimizer: adamw_torch
lr_scheduler: cosine
warmup_ratio: 0.05
bf16: auto
tf32: true
flash_attention: true
deepspeed: deepspeed_configs/zero3_bf16.json
save_strategy: epoch
wandb_project: llama-finetune
```

```bash
accelerate launch -m axolotl.cli.train config.yml                              # single GPU
accelerate launch --multi_gpu --num_processes 4 -m axolotl.cli.train config.yml # multi-GPU
```

For LoRA via axolotl, add `adapter: lora`, `lora_r: 32`, `lora_alpha: 32`, `lora_dropout: 0.05` and list `lora_target_modules`.

### Torchtune (PyTorch-native)

```bash
uv pip install torchtune
tune download meta-llama/Llama-3.1-8B-Instruct --output-dir models/llama-3.1-8b/
tune run full_finetune_single_device --config llama3_1/8B_full_single_device \
    dataset.source=data/train.json output_dir=outputs/llama-torchtune epochs=3 batch_size=2
```

### LLaMA-Factory (unified CLI + web UI)

```bash
git clone https://github.com/hiyouga/LLaMA-Factory.git && cd LLaMA-Factory
uv pip install -e ".[torch,metrics]"
llamafactory-cli webui  # interactive web UI
llamafactory-cli train --model_name_or_path meta-llama/Llama-3.1-8B-Instruct \
    --dataset alpaca_en --template llama3 --finetuning_type lora --lora_rank 16 \
    --output_dir outputs/llama-factory --learning_rate 2e-4 --num_train_epochs 3 --bf16 true
```

---

## 4. RLHF/DPO Alignment

### DPO with TRL (recommended — no reward model needed)

Prepare preference pairs:

```python
import json
prefs = [{"prompt": "How to learn Python?",
          "chosen": "Start with the official tutorial...",
          "rejected": "Just Google it"}]
with open("data/dpo_train.json", "w") as f:
    for p in prefs: f.write(json.dumps(p) + "\n")
```

Train:

```python
from trl import DPOConfig, DPOTrainer
from transformers import AutoModelForCausalLM, AutoTokenizer
from datasets import load_dataset
from peft import LoraConfig

model = AutoModelForCausalLM.from_pretrained("outputs/llama-merged", torch_dtype="auto", device_map="auto")
tokenizer = AutoTokenizer.from_pretrained("outputs/llama-merged")
tokenizer.pad_token = tokenizer.eos_token
dataset = load_dataset("json", data_files="data/dpo_train.json", split="train")

trainer = DPOTrainer(
    model=model, processing_class=tokenizer, train_dataset=dataset,
    peft_config=LoraConfig(r=16, lora_alpha=16, lora_dropout=0.05,
        target_modules=["q_proj","k_proj","v_proj","o_proj"], task_type="CAUSAL_LM"),
    args=DPOConfig(output_dir="outputs/llama-dpo", per_device_train_batch_size=2,
        gradient_accumulation_steps=8, learning_rate=5e-7, num_train_epochs=1,
        beta=0.1, bf16=True, max_length=2048, max_prompt_length=512),
)
trainer.train()
trainer.save_model("outputs/llama-dpo/final")
```

WHY: DPO skips the reward model entirely. Use beta=0.1 for moderate alignment; increase to 0.3-0.5 if the model diverges from the reference.

### Full RLHF with OpenRLHF (reward model + PPO)

```bash
uv pip install openrlhf[vllm]

# Train reward model
openrlhf.cli.train_rm --pretrain meta-llama/Llama-3.1-8B-Instruct \
    --dataset data/preference_pairs.json --save_path outputs/reward-model \
    --max_len 2048 --train_batch_size 64 --learning_rate 9e-6 --bf16

# PPO training
openrlhf.cli.train_ppo --pretrain outputs/llama-merged \
    --reward_pretrain outputs/reward-model --save_path outputs/llama-rlhf \
    --prompt_data data/prompts.json --train_batch_size 64 --rollout_batch_size 64 \
    --kl_coef 0.02 --learning_rate 5e-7 --bf16 --vllm_num_engines 2
```

---

## 5. Evaluation

### Benchmark with lm-eval-harness

```bash
lm_eval --model hf --model_args pretrained=outputs/llama-merged,dtype=float16 \
    --tasks mmlu,hellaswag,arc_easy,truthfulqa_mc2 --batch_size 8 \
    --output_path eval/finetuned.json
```

### Compare base vs fine-tuned

```bash
lm_eval --model hf --model_args pretrained=meta-llama/Llama-3.1-8B-Instruct,dtype=float16 \
    --tasks mmlu,hellaswag --batch_size 8 --output_path eval/base.json
jq -s '[{model:"base",results:.[0].results},{model:"finetuned",results:.[1].results}]' \
    eval/base.json eval/finetuned.json
```

### Quick generation sanity check

```python
from unsloth import FastLanguageModel
model, tokenizer = FastLanguageModel.from_pretrained("outputs/llama-lora/final",
    max_seq_length=2048, load_in_4bit=True)
FastLanguageModel.for_inference(model)
for prompt in ["Explain LoRA vs QLoRA.", "Reverse a linked list in Python."]:
    inputs = tokenizer.apply_chat_template([{"role":"user","content":prompt}], return_tensors="pt").to("cuda")
    out = model.generate(inputs, max_new_tokens=256, temperature=0.7)
    print(f"\n--- {prompt} ---\n{tokenizer.decode(out[0][inputs.shape[1]:], skip_special_tokens=True)}")
```

WHY: Always compare against the base model. Fine-tuning can cause catastrophic forgetting.

---

## 6. Model Merging with Mergekit

Combine specialized fine-tuned models without additional training.

```bash
uv pip install mergekit
```

### SLERP merge (two models)

```yaml
# merge_slerp.yml
slices:
  - sources:
      - model: outputs/llama-code
        layer_range: [0, 32]
      - model: outputs/llama-writing
        layer_range: [0, 32]
merge_method: slerp
base_model: meta-llama/Llama-3.1-8B-Instruct
parameters:
  t:
    - filter: self_attn
      value: [0, 0.5, 0.3, 0.7, 1]
    - filter: mlp
      value: [1, 0.5, 0.7, 0.3, 0]
    - value: 0.5
dtype: bfloat16
```

### TIES merge (three+ models)

```yaml
# merge_ties.yml
models:
  - model: meta-llama/Llama-3.1-8B-Instruct
    parameters: {density: 1.0, weight: 1.0}
  - model: outputs/llama-code
    parameters: {density: 0.5, weight: 0.5}
  - model: outputs/llama-writing
    parameters: {density: 0.5, weight: 0.3}
merge_method: ties  # or dare_ties for better base preservation
base_model: meta-llama/Llama-3.1-8B-Instruct
parameters: {normalize: true}
dtype: bfloat16
```

```bash
mergekit-yaml merge_slerp.yml outputs/merged-slerp --cuda
mergekit-yaml merge_ties.yml outputs/merged-ties --cuda
```

WHY: Merging is free (no GPU training). SLERP for two models, TIES/DARE-TIES for three+.

---

## 7. Export & Serving

### Convert to GGUF and quantize

```bash
git clone https://github.com/ggerganov/llama.cpp.git && cd llama.cpp
uv pip install -r requirements/requirements-convert_hf_to_gguf.txt

python convert_hf_to_gguf.py outputs/llama-merged --outfile outputs/llama.gguf
./llama-quantize outputs/llama.gguf outputs/llama-Q5_K_M.gguf Q5_K_M
```

Quantization tiers: **Q8_0** (~8.5GB, best quality) > **Q5_K_M** (~5.7GB, recommended) > **Q4_K_M** (~4.9GB, good) > **Q3_K_M** (~3.9GB, noticeable loss).

### Import into Ollama

```
# Modelfile
FROM ./outputs/llama-Q5_K_M.gguf
TEMPLATE """<|begin_of_text|><|start_header_id|>system<|end_header_id|>
{{ .System }}<|eot_id|><|start_header_id|>user<|end_header_id|>
{{ .Prompt }}<|eot_id|><|start_header_id|>assistant<|end_header_id|>
"""
PARAMETER temperature 0.7
PARAMETER stop "<|eot_id|>"
```

```bash
ollama create my-model -f Modelfile && ollama run my-model "Test the model"
```

### Serve with vLLM

```bash
uv pip install vllm
python -m vllm.entrypoints.openai.api_server --model outputs/llama-merged --dtype auto --port 8000
curl http://localhost:8000/v1/chat/completions -H "Content-Type: application/json" \
    -d '{"model":"outputs/llama-merged","messages":[{"role":"user","content":"Hello"}]}'
```

### Push to Hugging Face Hub

```bash
huggingface-cli login
huggingface-cli upload username/llama-finetuned outputs/llama-merged --private
```

---

## 8. Agent Workflows

### Hyperparameter sweep

```bash
#!/usr/bin/env bash
set -euo pipefail
for lr in 1e-4 2e-4 5e-4; do
  for rank in 8 16 32; do
    RUN="lr${lr}_r${rank}"
    sed "s/learning_rate:.*/learning_rate: $lr/;s/lora_r:.*/lora_r: $rank/;s/lora_alpha:.*/lora_alpha: $rank/" \
        config.yml | sed "s|output_dir:.*|output_dir: outputs/sweep/$RUN|" > "configs/$RUN.yml"
    accelerate launch -m axolotl.cli.train "configs/$RUN.yml"
    lm_eval --model hf --model_args "pretrained=outputs/sweep/$RUN,dtype=float16" \
        --tasks mmlu,hellaswag --batch_size 8 --output_path "eval/$RUN.json"
  done
done
for f in eval/*.json; do
    name=$(basename "$f" .json)
    echo "$name | MMLU: $(jq -r '.results.mmlu["acc,none"] // "N/A"' "$f") | HellaSwag: $(jq -r '.results.hellaswag["acc_norm,none"] // "N/A"' "$f")"
done
```

### A/B model comparison

```bash
#!/usr/bin/env bash
set -euo pipefail
python scripts/generate_responses.py --model outputs/model-a --prompts data/eval.jsonl --output eval/a.jsonl
python scripts/generate_responses.py --model outputs/model-b --prompts data/eval.jsonl --output eval/b.jsonl
python scripts/llm_judge.py --responses-a eval/a.jsonl --responses-b eval/b.jsonl \
    --judge-model gpt-4o --output eval/ab.json
jq '{a_wins: [.comparisons[]|select(.winner=="a")]|length,
     b_wins: [.comparisons[]|select(.winner=="b")]|length,
     ties: [.comparisons[]|select(.winner=="tie")]|length}' eval/ab.json
```

### Full pipeline: data to deployment

```bash
#!/usr/bin/env bash
set -euo pipefail
MODEL="my-finetuned-llama"
python scripts/prepare_data.py --output data/
accelerate launch -m axolotl.cli.train config.yml
python scripts/merge_lora.py --base meta-llama/Llama-3.1-8B-Instruct \
    --adapter outputs/lora/final --output outputs/merged
lm_eval --model hf --model_args "pretrained=outputs/merged,dtype=float16" \
    --tasks mmlu,hellaswag --batch_size 8 --output_path eval/final.json
python llama.cpp/convert_hf_to_gguf.py outputs/merged --outfile "outputs/${MODEL}.gguf"
./llama.cpp/llama-quantize "outputs/${MODEL}.gguf" "outputs/${MODEL}-Q5.gguf" Q5_K_M
ollama create "$MODEL" -f Modelfile && ollama run "$MODEL" "Verify it works."
```

---

## Quick Reference

| Task | Tool | Command |
|---|---|---|
| QLoRA fine-tune | unsloth | `FastLanguageModel.from_pretrained(..., load_in_4bit=True)` |
| Full fine-tune | axolotl | `accelerate launch -m axolotl.cli.train config.yml` |
| Full fine-tune | torchtune | `tune run full_finetune_single_device --config ...` |
| DPO alignment | trl | `DPOTrainer(model, args, train_dataset)` |
| Full RLHF | openrlhf | `openrlhf.cli.train_ppo --pretrain ... --reward_pretrain ...` |
| Unified GUI | llama-factory | `llamafactory-cli webui` |
| Merge models | mergekit | `mergekit-yaml merge.yml output/ --cuda` |
| Convert GGUF | llama.cpp | `python convert_hf_to_gguf.py model/ --outfile m.gguf` |
| Quantize | llama.cpp | `llama-quantize m.gguf m-Q5.gguf Q5_K_M` |
| Import Ollama | ollama | `ollama create my-model -f Modelfile` |
| Evaluate | lm-eval | `lm_eval --model hf --tasks mmlu,hellaswag` |
| Serve | vllm | `python -m vllm.entrypoints.openai.api_server --model ...` |

## Troubleshooting

**CUDA out of memory**: Reduce batch size to 1, enable gradient checkpointing, switch to QLoRA (4-bit), or reduce `max_seq_length`. For full FT use DeepSpeed ZeRO-3.

**Loss not decreasing**: Wrong learning rate. LoRA: 1e-4 to 5e-4. Full FT: 1e-5 to 5e-5. Verify data format matches the expected chat template.

**Garbage output after fine-tuning**: Chat template mismatch. Ensure `apply_chat_template()` produces identical format at train and inference time.

**Mergekit NaN weights**: Models too different. Verify same base architecture and tokenizer. Lower density in TIES/DARE configs.

**DPO diverges**: Lower LR (try 1e-7) or increase beta (0.3-0.5) to stay closer to the reference policy.
