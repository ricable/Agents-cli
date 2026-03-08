---
name: rag-pipeline-workflow
version: 1.0.0
description: "Build and operate Retrieval-Augmented Generation pipelines using vector databases, embedding models, and LLM frameworks. Use this skill whenever the user needs to ingest documents into a knowledge base, set up vector search, build a RAG chain, create a Q&A system over documents, search a codebase with embeddings, evaluate retrieval quality, or deploy a production RAG system — even if they just say 'chat with my docs' or 'build a knowledge base' or 'semantic search' or 'RAG pipeline' or 'index my PDFs'."
ingredients:
  - chroma-core/chroma
  - qdrant/qdrant
  - langchain-ai/langchain
  - run-llama/llama_index
  - Unstructured-IO/unstructured
  - mem0ai/mem0
  - pgvector/pgvector
  - UKPLab/sentence-transformers
tags:
  - workflow
  - ai-ml
  - rag
  - embeddings
  - vector-search
  - knowledge-base
---

# RAG Pipeline Workflow

Build retrieval-augmented generation pipelines that ground LLM responses in your own data. Covers the full lifecycle: ingestion, chunking, embedding, vector storage, retrieval, chain assembly, and evaluation.

## Prerequisites

```bash
uv init rag-project && cd rag-project
uv add langchain langchain-openai langchain-community chromadb
uv add sentence-transformers unstructured ragas
uv add llama-index llama-index-embeddings-huggingface
export OPENAI_API_KEY="sk-..."
```

---

## 1. Document Ingestion Pipeline

Parse documents from any format into clean text chunks. Ingestion quality determines RAG quality more than any other step.

### Load PDFs, Markdown, HTML, and code

```python
from langchain_community.document_loaders import (
    PyPDFLoader, DirectoryLoader, TextLoader, UnstructuredMarkdownLoader,
)

pdf_docs = PyPDFLoader("docs/report.pdf").load()
md_docs = DirectoryLoader("docs/", glob="**/*.md",
    loader_cls=UnstructuredMarkdownLoader, show_progress=True).load()
code_docs = DirectoryLoader("src/", glob="**/*.py",
    loader_cls=TextLoader, show_progress=True).load()
for doc in code_docs:
    doc.metadata["file_type"] = "python"

# Complex layouts (tables, images) — use Unstructured
from unstructured.partition.auto import partition
elements = partition(filename="docs/annual-report.pdf")
```

### Chunk documents

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter, Language

# General text — 1000 chars with 200 overlap
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000, chunk_overlap=200, separators=["\n\n", "\n", ". ", " ", ""])
chunks = splitter.split_documents(md_docs)

# Language-aware code splitting
code_chunks = RecursiveCharacterTextSplitter.from_language(
    language=Language.PYTHON, chunk_size=1500, chunk_overlap=200,
).split_documents(code_docs)

# Semantic chunking — groups by meaning, not character count
from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai import OpenAIEmbeddings
semantic_chunks = SemanticChunker(OpenAIEmbeddings(),
    breakpoint_threshold_type="percentile", breakpoint_threshold_amount=90,
).split_documents(md_docs)
```

WHY: Semantic chunking aligns chunks with topic boundaries, improving retrieval precision 10-25% on heterogeneous documents.

---

## 2. Embedding Generation

### Local embeddings (free, private, fast)

```python
from langchain_community.embeddings import HuggingFaceEmbeddings

# Development — 384 dims, 33MB, runs on CPU in milliseconds
embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-small-en-v1.5",
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True},
)

# Production — 1024 dims, better quality
embeddings_prod = HuggingFaceEmbeddings(
    model_name="BAAI/bge-large-en-v1.5",
    model_kwargs={"device": "mps"},  # Apple Silicon GPU
    encode_kwargs={"normalize_embeddings": True, "batch_size": 64},
)
```

### API embeddings (highest quality, costs money)

```python
from langchain_openai import OpenAIEmbeddings
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")  # $0.02/1M tokens
```

### Batch embed with sentence-transformers directly

```python
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("BAAI/bge-small-en-v1.5")
vectors = model.encode([c.page_content for c in chunks], batch_size=128, show_progress_bar=True)
```

### LlamaIndex embeddings

```python
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
```

---

## 3. Vector Store Setup

### ChromaDB — development (zero config, in-process)

```python
from langchain_community.vectorstores import Chroma

vectorstore = Chroma.from_documents(
    documents=chunks, embedding=embeddings,
    persist_directory="./chroma_db", collection_name="my_docs",
)

results = vectorstore.similarity_search("How does authentication work?", k=5)

# Reload existing collection
vectorstore = Chroma(persist_directory="./chroma_db",
    embedding_function=embeddings, collection_name="my_docs")
```

### Qdrant — production (scaling, filtering, snapshots)

```bash
docker run -d --name qdrant -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant:latest
```

```python
from langchain_qdrant import QdrantVectorStore  # uv add langchain-qdrant
from qdrant_client.models import Filter, FieldCondition, MatchValue

vectorstore = QdrantVectorStore.from_documents(
    documents=chunks, embedding=embeddings,
    url="http://localhost:6333", collection_name="my_docs", force_recreate=True,
)

# Metadata filtering
results = vectorstore.similarity_search("deployment config", k=5,
    filter=Filter(must=[FieldCondition(
        key="metadata.file_type", match=MatchValue(value="python"))]))
```

### pgvector — existing Postgres infrastructure

```bash
psql -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

```python
from langchain_postgres.vectorstores import PGVector  # uv add langchain-postgres

vectorstore = PGVector.from_documents(
    documents=chunks, embedding=embeddings,
    connection="postgresql+psycopg://user:pass@localhost:5432/ragdb",
    collection_name="my_docs", pre_delete_collection=True,
)
```

```sql
-- Direct SQL alongside vector search
SELECT content, 1 - (embedding <=> query_embedding) AS similarity
FROM langchain_pg_embedding
WHERE (metadata->>'source')::text LIKE '%config%'
ORDER BY embedding <=> query_embedding LIMIT 10;
```

WHY: ChromaDB for development (no infrastructure). Qdrant when you need filtering, sharding, or >1M vectors. pgvector when data already lives in Postgres.

---

## 4. Retrieval Strategies

### Similarity, MMR, and threshold

```python
# Basic similarity
retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 5})

# MMR — prevents returning 5 chunks that say the same thing
retriever = vectorstore.as_retriever(search_type="mmr",
    search_kwargs={"k": 5, "fetch_k": 20, "lambda_mult": 0.7})

# Score threshold — only return high-confidence matches
retriever = vectorstore.as_retriever(search_type="similarity_score_threshold",
    search_kwargs={"score_threshold": 0.75, "k": 10})
```

### Hybrid search (sparse + dense)

```python
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever

hybrid_retriever = EnsembleRetriever(
    retrievers=[BM25Retriever.from_documents(chunks, k=5),
                vectorstore.as_retriever(search_kwargs={"k": 5})],
    weights=[0.4, 0.6],  # 40% keyword, 60% semantic
)
```

### Multi-query retriever (LLM expands the query)

```python
from langchain.retrievers.multi_query import MultiQueryRetriever
from langchain_openai import ChatOpenAI

multi_retriever = MultiQueryRetriever.from_llm(
    retriever=vectorstore.as_retriever(search_kwargs={"k": 3}),
    llm=ChatOpenAI(model="gpt-4o-mini", temperature=0),
)
```

### Parent document retriever (search small, return big)

```python
from langchain.retrievers import ParentDocumentRetriever
from langchain.storage import InMemoryStore

parent_retriever = ParentDocumentRetriever(
    vectorstore=vectorstore, docstore=InMemoryStore(),
    child_splitter=RecursiveCharacterTextSplitter(chunk_size=500),
    parent_splitter=RecursiveCharacterTextSplitter(chunk_size=4000),
)
parent_retriever.add_documents(docs)
```

WHY: Searches fine-grained chunks for precision but returns the surrounding section, giving the LLM enough context to answer well.

---

## 5. RAG Chain Assembly

### LangChain RAG chain

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
prompt = ChatPromptTemplate.from_template("""Answer based only on this context.
If insufficient, say so. Do not make up information.
Context: {context}
Question: {question}
Answer:""")

def format_docs(docs):
    return "\n\n---\n\n".join(
        f"[Source: {d.metadata.get('source', '?')}]\n{d.page_content}" for d in docs)

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt | llm | StrOutputParser()
)
answer = rag_chain.invoke("How do I set up database migrations?")
```

### LlamaIndex RAG pipeline

```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.openai import OpenAI

Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
Settings.llm = OpenAI(model="gpt-4o-mini", temperature=0)
index = VectorStoreIndex.from_documents(SimpleDirectoryReader("docs/").load_data())

response = index.as_query_engine(similarity_top_k=5).query("Deployment process?")

# Chat with memory — follow-ups use conversation history
chat = index.as_chat_engine(chat_mode="condense_plus_context", similarity_top_k=5)
chat.chat("What databases do we support?")
chat.chat("Which one for production?")

# Persist and reload
index.storage_context.persist(persist_dir="./llama_storage")
from llama_index.core import StorageContext, load_index_from_storage
index = load_index_from_storage(StorageContext.from_defaults(persist_dir="./llama_storage"))
```

### Streaming

```python
for chunk in rag_chain.stream("Explain the architecture"):
    print(chunk, end="", flush=True)
```

---

## 6. Evaluation and Quality Metrics

Do not ship a RAG pipeline without evaluating it.

### Evaluate with RAGAS

```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
from datasets import Dataset

questions = ["How do I configure the database?", "What auth methods are supported?"]
ground_truths = ["Set DATABASE_URL in .env and run db:migrate.", "OAuth2, API keys, and JWT."]

results = [{"question": q, "answer": rag_chain.invoke(q), "ground_truth": gt,
    "contexts": [d.page_content for d in retriever.invoke(q)]}
    for q, gt in zip(questions, ground_truths)]

scores = evaluate(dataset=Dataset.from_list(results),
    metrics=[faithfulness, answer_relevancy, context_precision, context_recall])
print(scores.to_pandas())
```

**Metrics**: Faithfulness = grounded in context (low = hallucinating). Answer relevancy = addresses question. Context precision = retrieved chunks relevant (low = noisy). Context recall = context covers ground truth (low = missing docs).

---

## 7. Agent Workflows

### Knowledge base Q&A agent

```python
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.tools.retriever import create_retriever_tool
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

retriever_tool = create_retriever_tool(retriever, name="search_docs",
    description="Search the documentation knowledge base.")

prompt = ChatPromptTemplate.from_messages([
    ("system", "Use search_docs to find information before answering."),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

agent = create_tool_calling_agent(llm, [retriever_tool], prompt)
executor = AgentExecutor(agent=agent, tools=[retriever_tool], verbose=True)
executor.invoke({"input": "How do I reset my password?", "chat_history": []})
```

### Codebase search agent

```python
code_store = Chroma.from_documents(code_chunks, embeddings,
    collection_name="codebase", persist_directory="./code_db")
code_retriever = code_store.as_retriever(search_type="mmr",
    search_kwargs={"k": 8, "fetch_k": 30})

code_prompt = ChatPromptTemplate.from_template("""Senior developer answering codebase questions.
Give precise answers with file paths.

Code context:
{context}

Question: {question}
Answer:""")

code_chain = (
    {"context": code_retriever | format_docs, "question": RunnablePassthrough()}
    | code_prompt | llm | StrOutputParser()
)
code_chain.invoke("Where is the authentication middleware?")
```

### Multi-collection agent (compare across document sets)

Create separate retriever tools per collection (contracts, policies, etc.) and let the agent decide which to search:

```python
tools = [
    create_retriever_tool(contracts_store.as_retriever(search_kwargs={"k": 5}),
        "search_contracts", "Search legal contracts."),
    create_retriever_tool(policies_store.as_retriever(search_kwargs={"k": 5}),
        "search_policies", "Search company policies."),
]
AgentExecutor(agent=create_tool_calling_agent(llm, tools, prompt), tools=tools).invoke(
    {"input": "Compare data retention policy with vendor contracts.", "chat_history": []})
```

---

## 8. Production Patterns

### Embedding cache

```python
from langchain.embeddings import CacheBackedEmbeddings
from langchain.storage import LocalFileStore

cached_embeddings = CacheBackedEmbeddings.from_bytes_store(
    underlying_embeddings=embeddings,
    document_embedding_cache=LocalFileStore("./embedding_cache"),
    namespace="bge-small",
)
```

### Reranking (dramatically improves precision)

```python
# API-based reranking
from langchain.retrievers import ContextualCompressionRetriever
from langchain_cohere import CohereRerank  # uv add langchain-cohere

reranking_retriever = ContextualCompressionRetriever(
    base_compressor=CohereRerank(model="rerank-v3.5", top_n=5),
    base_retriever=vectorstore.as_retriever(search_kwargs={"k": 20}),
)

# Local reranking (no API calls)
from sentence_transformers import CrossEncoder
cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

def rerank_local(query, docs, top_k=5):
    scores = cross_encoder.predict([(query, d.page_content) for d in docs])
    return [d for _, d in sorted(zip(scores, docs), reverse=True)[:top_k]]
```

### Chunking strategies

| Strategy | Best for | chunk_size | chunk_overlap |
|---|---|---|---|
| Fixed-size | Quick start | 1000 | 200 |
| Recursive | Structured text, markdown | 1000 | 200 |
| Semantic | Mixed-topic documents | varies | N/A |
| Code-aware | Source code | 1500 | 200 |

### Incremental indexing

```python
from langchain.indexes import SQLRecordManager, index

record_manager = SQLRecordManager(namespace="my_docs", db_url="sqlite:///records.db")
record_manager.create_schema()

result = index(docs_source=chunks, record_manager=record_manager,
    vector_store=vectorstore, cleanup="incremental", source_id_key="source")
print(f"Added: {result['num_added']}, Skipped: {result['num_skipped']}")
```

### Full ingestion script (one-liner)

```bash
uv run python -c "
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
docs = DirectoryLoader('docs/', glob='**/*.*', loader_cls=TextLoader).load()
chunks = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200).split_documents(docs)
store = Chroma.from_documents(chunks, HuggingFaceEmbeddings(model_name='BAAI/bge-small-en-v1.5'),
    persist_directory='./chroma_db', collection_name='docs')
print(f'Indexed {store._collection.count()} chunks')
"
```

---

## Troubleshooting

**ChromaDB sqlite3 version error**: Requires SQLite 3.35+. Fix: `uv add pysqlite3-binary` then `__import__('pysqlite3'); import sys; sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')`.

**Out of memory during embedding**: Use `batch_size=32`. For large corpora, process in batches of 10k docs and add incrementally.

**Irrelevant retrieval results**: Reduce chunk_size to 500-800. Switch to MMR. Add a reranker.

**LLM hallucinating**: Strengthen grounding prompt. Check faithfulness score with RAGAS.

**pgvector slow**: Add HNSW index: `CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);`

**Qdrant connection refused**: Check Docker is running: `curl http://localhost:6333/healthz`. Ensure port 6333 is mapped and volume is mounted.
