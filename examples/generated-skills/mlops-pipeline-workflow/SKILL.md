# MLOps Pipeline Workflow

> Automate end-to-end ML pipelines — from experiment tracking and data versioning
> through distributed training to model serving and CI/CD for machine learning.

When the user asks to "set up an MLOps pipeline", "track ML experiments", "version
datasets", "deploy a model", "orchestrate training", or "automate ML workflows",
follow the recipes in this skill. Combine tools as needed: not every project requires
every component.

Tags: `workflow` `ai-ml` `mlops` `experiment-tracking` `model-serving` `pipeline`

## Tools in This Workflow

| Tool | Purpose | Install |
|------|---------|---------|
| [MLflow](https://github.com/mlflow/mlflow) | Experiment tracking, model registry | `pip install mlflow` |
| [DVC](https://github.com/iterative/dvc) | Data & model version control | `pip install dvc` |
| [W&B](https://github.com/wandb/wandb) | Experiment tracking platform | `pip install wandb` |
| [Kubeflow](https://github.com/kubeflow/kubeflow) | ML pipelines on Kubernetes | `pip install kfp` |
| [BentoML](https://github.com/bentoml/BentoML) | Model serving & containerization | `pip install bentoml` |
| [Ray](https://github.com/ray-project/ray) | Distributed computing & serving | `pip install "ray[serve]"` |
| [Metaflow](https://github.com/Netflix/metaflow) | ML workflow framework | `pip install metaflow` |
| [ClearML](https://github.com/allegroai/clearml) | ML experiment manager | `pip install clearml` |
| [Dagster](https://github.com/dagster-io/dagster) | Data orchestration platform | `pip install dagster dagster-webserver` |

---

## 1. Experiment Tracking Setup

### When to Use Which

| Criteria | MLflow | W&B | ClearML |
|----------|--------|-----|---------|
| Self-hosted | Yes (native) | Yes (server) | Yes (server) |
| Free tier | Unlimited | 100 GB | Unlimited |
| Best for | Model registry + serving | Research collaboration | End-to-end automation |

**MLflow** — Use when you need a model registry coupled with tracking. Start a server:

```bash
mlflow server \
  --backend-store-uri postgresql://user:pass@localhost:5432/mlflow \
  --default-artifact-root s3://mlflow-artifacts --host 0.0.0.0 --port 5000
```

```python
import mlflow
mlflow.set_tracking_uri("http://localhost:5000")
mlflow.set_experiment("fraud-detection-v2")
with mlflow.start_run(run_name="xgboost-baseline"):
    mlflow.log_params({"max_depth": 6, "learning_rate": 0.1, "n_estimators": 300})
    mlflow.log_metrics({"auc": 0.94, "f1": 0.87})
    mlflow.xgboost.log_model(model, artifact_path="model")
```

**W&B** — Use when the team needs rich visualization and experiment comparison:

```python
import wandb
wandb.init(project="fraud-detection", config={"max_depth": 6, "lr": 0.1})
for epoch in range(100):
    wandb.log({"epoch": epoch, "loss": loss, "val_auc": auc})
artifact = wandb.Artifact("fraud-model", type="model")
artifact.add_file("model.pkl")
wandb.log_artifact(artifact)
wandb.finish()
```

**ClearML** — Use when you want automatic logging with minimal code changes:

```python
from clearml import Task
task = Task.init(project_name="fraud-detection", task_name="xgboost-baseline")
task.connect({"max_depth": 6, "learning_rate": 0.1})
# ClearML auto-captures stdout, matplotlib plots, and framework metrics
```

---

## 2. Data Versioning with DVC

```bash
dvc init && git add .dvc .dvcignore && git commit -m "Initialize DVC"
dvc remote add -d myremote s3://my-bucket/dvc-store
dvc add data/raw/transactions.parquet
git add data/raw/transactions.parquet.dvc data/raw/.gitignore
git commit -m "Track raw transactions dataset" && dvc push
```

Define a reproducible pipeline in `dvc.yaml`:

```yaml
stages:
  prepare:
    cmd: python src/prepare.py
    deps: [src/prepare.py, data/raw/transactions.parquet]
    params: [prepare.train_split, prepare.seed]
    outs: [data/processed/train.parquet, data/processed/test.parquet]
  train:
    cmd: python src/train.py
    deps: [src/train.py, data/processed/train.parquet]
    params: [train.max_depth, train.learning_rate]
    outs: [models/model.pkl]
    metrics: [{metrics/train_metrics.json: {cache: false}}]
  evaluate:
    cmd: python src/evaluate.py
    deps: [src/evaluate.py, models/model.pkl, data/processed/test.parquet]
    metrics: [{metrics/eval_metrics.json: {cache: false}}]
```

```bash
dvc repro                                          # Run full pipeline
dvc metrics diff main..experiment/new-features     # Compare across branches
```

---

## 3. Training Pipeline Creation

### Metaflow — For Simplicity and Local-First Development

```python
from metaflow import FlowSpec, step, Parameter, resources

class FraudDetectionFlow(FlowSpec):
    max_depth = Parameter("max-depth", default=6, type=int)

    @step
    def start(self):
        import pandas as pd
        self.df = pd.read_parquet("s3://data/transactions.parquet")
        self.next(self.train)

    @resources(cpu=4, memory=8192)
    @step
    def train(self):
        from sklearn.model_selection import train_test_split
        import xgboost as xgb
        X_train, X_test, y_train, y_test = train_test_split(
            self.df.drop("label", axis=1), self.df["label"], test_size=0.2)
        self.model = xgb.XGBClassifier(max_depth=self.max_depth)
        self.model.fit(X_train, y_train)
        from sklearn.metrics import roc_auc_score
        self.auc = roc_auc_score(y_test, self.model.predict_proba(X_test)[:, 1])
        self.next(self.end)

    @step
    def end(self):
        print(f"AUC={self.auc:.4f}")

if __name__ == "__main__":
    FraudDetectionFlow()
```

### Kubeflow — For Production Scale on Kubernetes

```python
from kfp import dsl, compiler

@dsl.component(base_image="python:3.11", packages_to_install=["pandas", "xgboost"])
def train_model(data_uri: str, max_depth: int) -> str:
    import xgboost as xgb, pandas as pd
    df = pd.read_parquet(data_uri)
    model = xgb.XGBClassifier(max_depth=max_depth)
    model.fit(df.drop("label", axis=1), df["label"])
    model.save_model("/tmp/model.json")
    return "/tmp/model.json"

@dsl.pipeline(name="fraud-detection-pipeline")
def fraud_pipeline(data_uri: str, test_uri: str, max_depth: int = 6):
    train_task = train_model(data_uri=data_uri, max_depth=max_depth)

compiler.Compiler().compile(fraud_pipeline, "pipeline.yaml")
```

---

## 4. Model Registry and Versioning

```python
from mlflow.tracking import MlflowClient
import mlflow

client = MlflowClient(tracking_uri="http://localhost:5000")

# Register and promote
mv = mlflow.register_model(f"runs:/{run_id}/model", "fraud-detector")
client.set_registered_model_alias("fraud-detector", "champion", mv.version)

# Load champion for inference
champion = mlflow.pyfunc.load_model("models:/fraud-detector@champion")
predictions = champion.predict(input_df)

# Compare versions
v1 = client.get_run(client.get_model_version("fraud-detector", "1").run_id).data.metrics
v2 = client.get_run(client.get_model_version("fraud-detector", "2").run_id).data.metrics
print(f"V1 AUC: {v1['auc']:.4f} | V2 AUC: {v2['auc']:.4f}")
```

---

## 5. Model Serving and Deployment

### BentoML — Containerize and Deploy

```python
import bentoml, numpy as np
from bentoml.io import NumpyNdarray, JSON

bentoml.xgboost.save_model("fraud_detector", trained_model)
runner = bentoml.xgboost.get("fraud_detector:latest").to_runner()
svc = bentoml.Service("fraud_detection_service", runners=[runner])

@svc.api(input=NumpyNdarray(), output=JSON())
async def predict(input_data: np.ndarray) -> dict:
    prediction = await runner.predict.async_run(input_data)
    return {"predictions": prediction.tolist()}
```

```bash
bentoml build
bentoml containerize fraud_detection_service:latest -t fraud-detector:v1
docker run -p 3000:3000 fraud-detector:v1
curl -X POST http://localhost:3000/predict \
  -H "Content-Type: application/json" -d '[[0.5, 1.2, 3.4, 0.8, 2.1]]'
```

### Ray Serve — Deploy with Auto-Scaling

```python
from ray import serve
import xgboost as xgb

@serve.deployment(
    num_replicas=2,
    autoscaling_config={"min_replicas": 1, "max_replicas": 10},
)
class FraudDetector:
    def __init__(self, model_path: str):
        self.model = xgb.XGBClassifier()
        self.model.load_model(model_path)

    async def __call__(self, request):
        import numpy as np
        data = await request.json()
        predictions = self.model.predict_proba(np.array(data["features"]))[:, 1]
        return {"fraud_scores": predictions.tolist()}

app = FraudDetector.bind(model_path="models/model.json")
serve.run(app, host="0.0.0.0", port=8000)
```

---

## 6. Distributed Training

### Ray Train — Scale Across Nodes

```python
from ray.train import ScalingConfig
from ray.train.xgboost import XGBoostTrainer

trainer = XGBoostTrainer(
    label_column="label",
    params={"max_depth": 6, "objective": "binary:logistic", "eval_metric": "auc"},
    scaling_config=ScalingConfig(num_workers=4, use_gpu=True),
    datasets={"train": train_ds, "valid": valid_ds},
    num_boost_round=300,
)
result = trainer.fit()
print(f"Best AUC: {result.metrics['valid-auc']:.4f}")
```

### Ray + PyTorch — Distributed Deep Learning

Use `TorchTrainer` with `prepare_model()` for automatic DDP wrapping:

```python
from ray.train.torch import TorchTrainer
from ray.train import ScalingConfig

def train_loop(config):
    model = ray.train.torch.prepare_model(MyNeuralNet())
    for epoch in range(config["epochs"]):
        for batch in ray.train.get_dataset_shard("train").iter_torch_batches(batch_size=64):
            loss = compute_loss(model, batch)
            loss.backward(); optimizer.step(); optimizer.zero_grad()
        ray.train.report({"loss": loss.item()})

trainer = TorchTrainer(train_loop, train_loop_config={"lr": 1e-3, "epochs": 10},
    scaling_config=ScalingConfig(num_workers=4, use_gpu=True), datasets={"train": ds})
```

---

## 7. Pipeline Orchestration with Dagster

```python
from dagster import asset, AssetExecutionContext, MaterializeResult
from dagster import define_asset_job, ScheduleDefinition, Definitions

@asset(group_name="data")
def raw_transactions(context: AssetExecutionContext):
    import pandas as pd
    df = pd.read_sql("SELECT * FROM transactions WHERE date > current_date - 7", conn)
    df.to_parquet("/data/raw/transactions.parquet")
    return MaterializeResult(metadata={"row_count": len(df)})

@asset(deps=[raw_transactions], group_name="training")
def trained_model(context: AssetExecutionContext):
    import pandas as pd, xgboost as xgb, mlflow
    features = compute_features(pd.read_parquet("/data/raw/transactions.parquet"))
    with mlflow.start_run():
        model = xgb.XGBClassifier(max_depth=6)
        model.fit(features.drop("label", axis=1), features["label"])
        mlflow.xgboost.log_model(model, "model", registered_model_name="fraud-detector")

weekly_schedule = ScheduleDefinition(
    job=define_asset_job("weekly_training", selection="*"), cron_schedule="0 2 * * 1")
defs = Definitions(assets=[raw_transactions, trained_model], schedules=[weekly_schedule])
```

```bash
dagster dev -f assets.py                              # Launch UI
dagster asset materialize --select "*" -f assets.py   # CLI materialize
```

---

## 8. CI/CD for ML

```yaml
# .github/workflows/mlops.yml
name: MLOps Pipeline
on:
  push:
    paths: ["src/**", "data/**", "dvc.yaml"]
  schedule:
    - cron: "0 6 * * 1"

jobs:
  train-and-evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.11" }
      - run: pip install -r requirements.txt
      - name: Pull data and train
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}
        run: dvc pull && dvc repro
      - name: Evaluation gate
        run: |
          AUC=$(python -c "import json; print(json.load(open('metrics/eval_metrics.json'))['auc'])")
          python -c "
          auc = $AUC
          if auc < 0.90:
              raise SystemExit(f'AUC {auc:.4f} below threshold 0.90')
          print(f'Passed: AUC={auc:.4f}')
          "
      - name: Register candidate model
        if: success()
        env: { MLFLOW_TRACKING_URI: "${{ secrets.MLFLOW_TRACKING_URI }}" }
        run: |
          python -c "
          import mlflow; client = mlflow.MlflowClient()
          mv = client.search_model_versions(\"name='fraud-detector'\", order_by=['version_number DESC'])[0]
          client.set_registered_model_alias('fraud-detector', 'candidate', mv.version)
          "

  deploy:
    needs: train-and-evaluate
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - run: pip install bentoml && bentoml build && bentoml containerize fraud_detection_service:latest -t ${{ secrets.REGISTRY }}/fraud-detector:${{ github.sha }}
      - run: echo "${{ secrets.REGISTRY_PASSWORD }}" | docker login -u "${{ secrets.REGISTRY_USER }}" --password-stdin && docker push ${{ secrets.REGISTRY }}/fraud-detector:${{ github.sha }}
      - name: Promote to champion
        env: { MLFLOW_TRACKING_URI: "${{ secrets.MLFLOW_TRACKING_URI }}" }
        run: python -c "import mlflow; c=mlflow.MlflowClient(); v=c.get_model_version_by_alias('fraud-detector','candidate'); c.set_registered_model_alias('fraud-detector','champion',v.version)"
```

---

## 9. Agent Workflows

### Auto-Tune Hyperparameters

Instruct the agent: "Tune the fraud detection model using Ray Tune."

```python
from ray import tune
from ray.tune.search.optuna import OptunaSearch

def train_and_evaluate(config):
    import xgboost as xgb
    from sklearn.metrics import roc_auc_score
    model = xgb.XGBClassifier(**{k: config[k] for k in ["max_depth", "learning_rate", "n_estimators"]})
    model.fit(X_train, y_train)
    tune.report(auc=roc_auc_score(y_test, model.predict_proba(X_test)[:, 1]))

tuner = tune.Tuner(
    train_and_evaluate,
    param_space={
        "max_depth": tune.randint(3, 12),
        "learning_rate": tune.loguniform(1e-4, 1e-1),
        "n_estimators": tune.choice([100, 300, 500, 1000]),
    },
    tune_config=tune.TuneConfig(metric="auc", mode="max", search_alg=OptunaSearch(), num_samples=50),
)
best = tuner.fit().get_best_result()
print(f"Best AUC: {best.metrics['auc']:.4f}, config: {best.config}")
```

### Compare Experiments and Promote Best Model

Instruct the agent: "Compare the last 5 runs and promote the best one."

```python
import mlflow
from mlflow.tracking import MlflowClient

client = MlflowClient()
experiment = client.get_experiment_by_name("fraud-detection-v2")
runs = client.search_runs(
    experiment_ids=[experiment.experiment_id],
    order_by=["metrics.auc DESC"], max_results=5,
)
for i, run in enumerate(runs):
    print(f"  {i+1}. {run.info.run_id[:8]} | AUC={run.data.metrics.get('auc', 0):.4f}")

best_run = runs[0]
mv = mlflow.register_model(f"runs:/{best_run.info.run_id}/model", "fraud-detector")
client.set_registered_model_alias("fraud-detector", "champion", mv.version)
print(f"Promoted {best_run.info.run_id[:8]} to champion")
```

### Deploy Best Model with Canary Rollout

Instruct the agent: "Deploy the champion model to production."

```bash
# Export champion, build container, deploy at 10% traffic
python -c "
import mlflow
model = mlflow.pyfunc.load_model('models:/fraud-detector@champion')
mlflow.xgboost.save_model(model, 'deploy/model')
"
bentoml build && bentoml containerize fraud_api:latest -t fraud-api:canary

kubectl apply -f - << 'EOF'
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: fraud-api
spec:
  traffic:
    - revisionName: fraud-api-stable
      percent: 90
    - latestRevision: true
      percent: 10
EOF
```

Validate and promote to full traffic:

```bash
python -c "
import requests
r = requests.get('http://monitoring.internal/api/v1/query',
    params={'query': 'rate(fraud_api_errors_total{revision=\"canary\"}[5m])'})
err = float(r.json()['data']['result'][0]['value'][1])
assert err <= 0.01, f'Error rate {err:.4f} too high'
"
kubectl patch ksvc fraud-api --type merge \
  -p '{"spec":{"traffic":[{"latestRevision":true,"percent":100}]}}'
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Start MLflow server | `mlflow server --backend-store-uri ...` |
| Init DVC | `dvc init && dvc remote add ...` |
| Run DVC pipeline | `dvc repro` |
| Run Metaflow | `python flow.py run` |
| Build BentoML | `bentoml build && bentoml containerize ...` |
| Start Ray Serve | `serve.run(app, host="0.0.0.0")` |
| Launch Dagster | `dagster dev -f assets.py` |
| Tune hyperparams | `tune.Tuner(...).fit()` |
| Register model | `mlflow.register_model(uri, name)` |
| Promote champion | `client.set_registered_model_alias(...)` |
