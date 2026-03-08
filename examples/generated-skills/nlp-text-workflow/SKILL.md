---
name: nlp-text-workflow
version: 1.0.0
description: "NLP and text processing workflow combining spaCy, HuggingFace Transformers, NLTK, sentence-transformers, gensim, and fastText. Use this skill whenever the user needs to process text, extract entities, classify documents, compute semantic similarity, run sentiment analysis, summarize text, cluster topics, or build NLP pipelines — even if they just say 'extract names from this text' or 'classify these documents' or 'find similar sentences' or 'summarize this article' or 'what is the sentiment'."
ingredients:
  - explosion/spaCy
  - huggingface/huggingface_hub
  - huggingface/transformers
  - nltk/nltk
  - UKPLab/sentence-transformers
  - chartbeat-labs/textacy
  - piskvorky/gensim
  - facebookresearch/fastText
tags:
  - workflow
  - ai-ml
  - nlp
  - text-processing
  - transformers
  - embeddings
  - ner
---

# NLP & Text Processing Workflow

Process, analyze, and extract structured information from unstructured text using spaCy, HuggingFace Transformers, sentence-transformers, gensim, and fastText.

## Prerequisites

```bash
uv add spacy transformers sentence-transformers nltk textacy gensim fasttext-wheel torch
uv add huggingface-hub
uv run python -m spacy download en_core_web_sm
uv run python -m spacy download en_core_web_trf
uv run python -c "import nltk; nltk.download('punkt_tab'); nltk.download('stopwords'); nltk.download('wordnet')"
```

---

## Workflow 1: Text Preprocessing Pipeline

Clean and normalize text before feeding it to any model.

### Tokenize, lemmatize, and filter with spaCy

```python
import spacy
nlp = spacy.load("en_core_web_sm")

def preprocess(text: str) -> list[str]:
    doc = nlp(text)
    return [token.lemma_.lower() for token in doc
            if not token.is_stop and not token.is_punct and not token.is_space]

preprocess("The companies were running towards better AI solutions in 2026.")
# ['company', 'run', 'well', 'ai', 'solution', '2026']
```

### Clean HTML, URLs, and noise with textacy

```python
import textacy.preprocessing as tp

clean = tp.make_pipeline(
    tp.remove.html_tags, tp.remove.urls, tp.remove.emails,
    tp.normalize.unicode, tp.normalize.whitespace, tp.remove.punctuation,
)
clean('<p>Visit https://example.com! Contact info@test.com</p>')
# 'Visit  Contact '
```

### Batch processing (2-10x faster than looping)

```python
texts = ["Document one.", "Document two.", "Document three."]
docs = list(nlp.pipe(texts, batch_size=50, n_process=2))
```

### NLTK when spaCy is overkill

```python
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

stops = set(stopwords.words("english"))
lem = WordNetLemmatizer()
tokens = word_tokenize("The runners were running in competitions.")
filtered = [lem.lemmatize(w.lower()) for w in tokens if w.lower() not in stops and w.isalpha()]
```

---

## Workflow 2: Named Entity Recognition

Extract people, organizations, locations, dates, and monetary values from text.

### spaCy NER (fast, production-ready)

```python
import spacy
nlp = spacy.load("en_core_web_sm")

def extract_entities(text: str) -> list[dict]:
    doc = nlp(text)
    return [{"text": ent.text, "label": ent.label_} for ent in doc.ents]

extract_entities("Apple CEO Tim Cook announced a $3B investment in Berlin on March 8, 2026.")
# [{'text': 'Apple', 'label': 'ORG'}, {'text': 'Tim Cook', 'label': 'PERSON'},
#  {'text': '$3B', 'label': 'MONEY'}, {'text': 'Berlin', 'label': 'GPE'}]
```

### HuggingFace NER (higher accuracy)

```python
from transformers import pipeline
ner = pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple")

results = ner("Elon Musk visited the European Central Bank in Frankfurt.")
for e in results:
    print(f"{e['word']:25s} {e['entity_group']:5s} {e['score']:.3f}")
```

### Deduplicate entities across documents

```python
from collections import defaultdict
entity_index = defaultdict(set)

for text in ["Google hired in New York.", "Microsoft and Google partnered."]:
    for ent in nlp(text).ents:
        entity_index[ent.label_].add(ent.text)
# {'ORG': {'Google', 'Microsoft'}, 'GPE': {'New York'}}
```

---

## Workflow 3: Text Classification

Use fastText for speed on large datasets, HuggingFace for accuracy.

### fastText supervised classification

```python
import fasttext

# Training file format: __label__spam Buy cheap pills now!!!
model = fasttext.train_supervised(input="train.txt", lr=0.5, epoch=25, wordNgrams=2, dim=100)
model.predict("Free money click here")  # (('__label__spam',), array([0.99]))
model.save_model("classifier.bin")

precision, recall = model.test("test.txt")[:2]
```

### Zero-shot classification (no training data)

```python
from transformers import pipeline
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

result = classifier(
    "The server crashed due to a memory leak in auth.",
    candidate_labels=["bug report", "feature request", "question", "docs"],
)
# result["labels"][0] == "bug report", result["scores"][0] == 0.892
```

### Fine-tuned classification with Transformers

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification, TrainingArguments, Trainer
from datasets import Dataset

tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
data = Dataset.from_dict({"text": ["Great!", "Terrible.", "OK.", "Love it!"], "label": [1, 0, 1, 1]})
data = data.map(lambda x: tokenizer(x["text"], truncation=True, padding="max_length", max_length=128), batched=True)
data = data.train_test_split(test_size=0.2)

model = AutoModelForSequenceClassification.from_pretrained("distilbert-base-uncased", num_labels=2)
trainer = Trainer(
    model=model, train_dataset=data["train"], eval_dataset=data["test"],
    args=TrainingArguments(output_dir="./out", num_train_epochs=3, per_device_train_batch_size=8),
)
trainer.train()
```

### Batch document classification

```python
from pathlib import Path
import json

categories = ["technical", "legal", "financial", "marketing", "support"]
def classify_documents(directory: str) -> list[dict]:
    results = []
    for path in Path(directory).glob("*.txt"):
        text = path.read_text()[:1000]
        pred = classifier(text, candidate_labels=categories)
        results.append({"file": str(path), "category": pred["labels"][0], "confidence": round(pred["scores"][0], 3)})
    return sorted(results, key=lambda x: x["category"])
```

---

## Workflow 4: Semantic Similarity & Embeddings

Convert text to dense vectors for search, deduplication, and clustering.

### Compute embeddings and similarity

```python
from sentence_transformers import SentenceTransformer, util
model = SentenceTransformer("all-MiniLM-L6-v2")  # fast, 384-dim

query_emb = model.encode("How do I reset my password?")
candidate_embs = model.encode(["Password reset instructions", "Billing FAQ", "Change password"])
scores = util.cos_sim(query_emb, candidate_embs)[0]
ranked = sorted(zip(["Password reset", "Billing", "Change pwd"], scores.tolist()), key=lambda x: -x[1])
```

### Semantic search over a corpus

```python
corpus = ["Python is a programming language.", "Docker packages apps.", "Neural nets have layers."]
corpus_embs = model.encode(corpus, convert_to_tensor=True)

def search(query: str, top_k: int = 3) -> list[dict]:
    q_emb = model.encode(query, convert_to_tensor=True)
    hits = util.semantic_search(q_emb, corpus_embs, top_k=top_k)[0]
    return [{"text": corpus[h["corpus_id"]], "score": round(h["score"], 3)} for h in hits]

search("deep learning algorithms")
```

### Find near-duplicate texts

```python
texts = ["Meeting at 3pm.", "Meeting scheduled for 3 PM.", "Q4 revenue exceeded expectations."]
pairs = util.paraphrase_mining(model, texts, show_progress_bar=False)
dupes = [(score, texts[i], texts[j]) for score, i, j in pairs if score > 0.7]
```

---

## Workflow 5: Topic Modeling & Clustering

Discover themes in document collections.

### Gensim LDA

```python
import spacy
from gensim import corpora
from gensim.models import LdaMulticore

nlp = spacy.load("en_core_web_sm")
documents = ["Machine learning needs training data.", "Stock market crashed due to inflation.",
             "Neural networks use backpropagation.", "Federal reserve raised interest rates."]

tokenize = lambda text: [t.lemma_.lower() for t in nlp(text) if not t.is_stop and not t.is_punct and t.is_alpha]
tokenized = [tokenize(d) for d in documents]
dictionary = corpora.Dictionary(tokenized)
corpus = [dictionary.doc2bow(doc) for doc in tokenized]
lda = LdaMulticore(corpus, num_topics=2, id2word=dictionary, passes=20, workers=2)

for idx, topic in lda.print_topics(-1):
    print(f"Topic {idx}: {topic}")
```

### BERTopic (modern, embedding-based)

```bash
uv add bertopic
```

```python
from bertopic import BERTopic
topic_model = BERTopic(min_topic_size=2, language="english")
topics, probs = topic_model.fit_transform(documents)
print(topic_model.get_topic_info()[["Topic", "Count", "Name"]])
```

### KMeans clustering with embeddings

```python
from sklearn.cluster import KMeans

docs = ["Python for data science.", "JavaScript for web apps.", "Pandas for data.", "React for frontend."]
labels = KMeans(n_clusters=2, random_state=42, n_init=10).fit_predict(model.encode(docs))
for label in sorted(set(labels)):
    print(f"Cluster {label}: {[d for d, l in zip(docs, labels) if l == label]}")
```

---

## Workflow 6: Sentiment Analysis

### Basic sentiment

```python
from transformers import pipeline
sentiment = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")

results = sentiment(["Absolutely fantastic!", "Terrible service.", "It arrived on time."])
for text, r in zip(["fantastic", "terrible", "on time"], results):
    print(f"  {r['label']:8s} ({r['score']:.3f}) {text}")
```

### Fine-grained (5-star scale)

```python
sentiment5 = pipeline("sentiment-analysis", model="nlptown/bert-base-multilingual-uncased-sentiment")
sentiment5("The food was decent but service was slow.")  # [{'label': '3 stars', 'score': 0.45}]
```

### Aspect-based sentiment

Split text into sentences and analyze each:

```python
def aspect_sentiment(text: str) -> list[dict]:
    doc = nlp(text)
    results = []
    for sent in doc.sents:
        s = sent.text.strip()
        if len(s) > 5:
            pred = sentiment(s)[0]
            results.append({"aspect": s, "sentiment": pred["label"], "score": round(pred["score"], 3)})
    return results

aspect_sentiment("Camera is excellent. Battery is disappointing. Screen is crisp.")
```

---

## Workflow 7: Text Summarization

### Abstractive (generates new text)

```python
from transformers import pipeline
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

article = """Climate change is accelerating. Scientists analyzed century-spanning data and found
warming doubled in two decades. Arctic ice melts 40% faster than predicted. Researchers
call for 50% emission cuts before 2035."""

summarizer(article, max_length=60, min_length=20, do_sample=False)[0]["summary_text"]
```

### Extractive (selects key sentences via textacy)

```python
from textacy.extract import keyterms

doc = nlp(long_text)
terms = keyterms.sgrank(doc, ngrams=(1, 2, 3), topn=5)
term_set = {t[0].lower() for t in terms}
scored = sorted([(sum(1 for tok in s if tok.lemma_.lower() in term_set), s.text.strip()) for s in doc.sents], reverse=True)
summary = " ".join(s[1] for s in scored[:3])
```

### Chunked summarization for long documents

For text exceeding the model context window, summarize chunks then combine:

```python
def summarize_long(text: str, chunk_size: int = 1000) -> str:
    words = text.split()
    chunks = [" ".join(words[i:i+chunk_size]) for i in range(0, len(words), chunk_size)]
    sums = [summarizer(c, max_length=130, min_length=30, do_sample=False)[0]["summary_text"]
            for c in chunks if len(c.split()) > 30]
    combined = " ".join(sums)
    if len(combined.split()) > 200:
        return summarizer(combined, max_length=150, min_length=40, do_sample=False)[0]["summary_text"]
    return combined
```

---

## Workflow 8: Agent Workflows

### Automated document tagging pipeline

Classify, extract entities, and tag documents in one pass:

```python
import spacy, json
from transformers import pipeline
from sentence_transformers import SentenceTransformer
from pathlib import Path

nlp = spacy.load("en_core_web_sm")
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
embedder = SentenceTransformer("all-MiniLM-L6-v2")
CATEGORIES = ["engineering", "legal", "finance", "marketing", "operations"]

def process_document(path: str) -> dict:
    text = Path(path).read_text()[:2000]
    doc = nlp(text)
    cls = classifier(text[:500], candidate_labels=CATEGORIES)
    return {
        "file": path, "category": cls["labels"][0], "confidence": round(cls["scores"][0], 3),
        "entities": [{"text": e.text, "label": e.label_} for e in doc.ents][:20],
        "key_phrases": list(set(c.text.lower() for c in doc.noun_chunks if len(c.text) > 3))[:10],
        "embedding": embedder.encode(text[:500]).tolist(),
    }

results = [process_document(str(p)) for p in sorted(Path("./docs").glob("*.txt"))]
Path("document_tags.json").write_text(json.dumps(results, indent=2))
```

### Entity extraction from structured logs

```python
import re, spacy
from collections import defaultdict
from pathlib import Path

nlp = spacy.load("en_core_web_sm")
LOG_RE = re.compile(r"(?P<ts>[\d-]+[T ][\d:]+).*?(?P<level>INFO|WARN|ERROR|DEBUG)\s+(?P<msg>.+)")

def extract_from_logs(log_path: str) -> dict:
    index, errors = defaultdict(list), []
    for i, line in enumerate(Path(log_path).open(), 1):
        m = LOG_RE.search(line)
        if not m: continue
        doc = nlp(m.group("msg"))
        for ent in doc.ents:
            index[ent.label_].append({"text": ent.text, "line": i})
        if m.group("level") == "ERROR" and doc.ents:
            errors.append({"line": i, "ts": m.group("ts"), "msg": m.group("msg").strip(),
                           "entities": [{"text": e.text, "label": e.label_} for e in doc.ents]})
    return {"entity_summary": {k: list(set(e["text"] for e in v)) for k, v in index.items()}, "errors": errors}
```

### Semantic search over code docstrings

```python
import ast
from sentence_transformers import SentenceTransformer, util
from pathlib import Path

model = SentenceTransformer("all-MiniLM-L6-v2")

def extract_docstrings(directory: str) -> list[dict]:
    entries = []
    for f in Path(directory).rglob("*.py"):
        try: tree = ast.parse(f.read_text())
        except SyntaxError: continue
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                ds = ast.get_docstring(node)
                if ds: entries.append({"file": str(f), "name": node.name, "line": node.lineno, "doc": ds})
    return entries

entries = extract_docstrings("./src")
embs = model.encode([e["doc"] for e in entries], convert_to_tensor=True)

def search_docs(query: str, top_k=5):
    hits = util.semantic_search(model.encode(query, convert_to_tensor=True), embs, top_k=top_k)[0]
    return [{**entries[h["corpus_id"]], "score": round(h["score"], 3)} for h in hits]
```

### Model management via CLI

```bash
huggingface-cli download sentence-transformers/all-MiniLM-L6-v2
huggingface-cli scan-cache --sort size   # check cache usage
huggingface-cli delete-cache             # clean up unused models
```

---

## Quick Reference

| Task | Tool | Pattern |
|---|---|---|
| Tokenize | spaCy | `nlp(text)` iterate tokens |
| Clean text | textacy | `tp.make_pipeline(tp.remove.html_tags, ...)` |
| Extract entities | spaCy | `doc.ents` |
| Accurate NER | Transformers | `pipeline("ner", model="dslim/bert-base-NER")` |
| Zero-shot classify | Transformers | `pipeline("zero-shot-classification")` |
| Fast classify | fastText | `fasttext.train_supervised("train.txt")` |
| Embeddings | sentence-transformers | `model.encode(sentences)` |
| Semantic search | sentence-transformers | `util.semantic_search(q, corpus)` |
| Duplicates | sentence-transformers | `util.paraphrase_mining(model, texts)` |
| Topics (LDA) | gensim | `LdaMulticore(corpus, num_topics=k)` |
| Topics (modern) | BERTopic | `BERTopic().fit_transform(docs)` |
| Sentiment | Transformers | `pipeline("sentiment-analysis")` |
| Summarize | Transformers | `pipeline("summarization")` |
| Key terms | textacy | `keyterms.sgrank(doc, topn=10)` |
| Manage models | huggingface-cli | `huggingface-cli download model` |

## Troubleshooting

**Can't find model 'en_core_web_sm'**: Run `uv run python -m spacy download en_core_web_sm`.

**CUDA out of memory**: Reduce batch size, use smaller model (distilbert), or force CPU with `pipeline("task", device=-1)`.

**fastText training slow**: Reduce `epoch` or `dim`. Use `loss="ova"` for many classes.

**Gensim LDA incoherent topics**: Increase `passes` to 30+, use `dictionary.filter_extremes(no_below=5, no_above=0.5)`, tune `num_topics` with `CoherenceModel`.

**sentence-transformers download hangs**: Set `HF_HUB_OFFLINE=1` for cached-only mode. Pre-download with `huggingface-cli download`.

**NLTK resource not found**: Run `nltk.download('resource_name')`. Common: `punkt_tab`, `stopwords`, `wordnet`.

**Empty NER results**: Try transformer-based model (`en_core_web_trf`) or HuggingFace NER pipeline for better recall.
