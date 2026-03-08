---
name: computer-vision-workflow
version: 1.0.0
description: "Computer vision and image AI workflow combining YOLOv8 for object detection, SAM for segmentation, GroundingDINO for open-vocabulary detection, InsightFace for face analysis, and supervision for visualization. Use this skill whenever the user needs to detect objects in images, segment regions, recognize faces, annotate training data, train detection models, optimize inference, process video frames, run OCR, or build any visual AI pipeline — even if they just say 'find objects in this image' or 'segment the photo' or 'detect faces' or 'train a detector' or 'process this video'."
ingredients:
  - ultralytics/ultralytics
  - opencv/opencv
  - facebookresearch/segment-anything
  - IDEA-Research/GroundingDINO
  - deepinsight/insightface
  - open-mmlab/mmdetection
  - roboflow/supervision
  - HumanSignal/labelImg
tags:
  - workflow
  - ai-ml
  - computer-vision
  - object-detection
  - image-processing
  - yolo
---

# Computer Vision & Image AI Workflow

Detect objects, segment regions, recognize faces, annotate data, train models, and deploy optimized inference.

## Prerequisites

```bash
uv init cv-project && cd cv-project
uv add ultralytics opencv-python-headless supervision onnxruntime pillow numpy
# GPU: uv add torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

## 1. Object Detection Pipeline

### YOLOv8 — fast detection on standard classes

```python
from ultralytics import YOLO

model = YOLO("yolov8m.pt")  # see size table below
results = model("image.jpg")

for r in results:
    for box in r.boxes:
        cls = r.names[int(box.cls)]
        conf = float(box.conf)
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        print(f"{cls}: {conf:.2f} at [{x1:.0f},{y1:.0f},{x2:.0f},{y2:.0f}]")
```

| Model | Params | Speed (ms) | mAP | Use Case |
|---|---|---|---|---|
| `yolov8n.pt` | 3.2M | 1.2 | 37.3 | Edge / real-time |
| `yolov8s.pt` | 11.2M | 2.1 | 44.9 | Balanced |
| `yolov8m.pt` | 25.9M | 5.0 | 50.2 | Production |
| `yolov8l.pt` | 43.7M | 8.7 | 52.9 | High accuracy |
| `yolov8x.pt` | 68.2M | 14.7 | 53.9 | Maximum accuracy |

### Batch process a directory

```python
from pathlib import Path
model = YOLO("yolov8m.pt")
results = model(list(Path("images/").glob("*.jpg")), stream=True)
for r in results:
    print(f"{Path(r.path).name}: {len(r.boxes)} objects")
    r.save(filename=f"output/{Path(r.path).name}")
```

### GroundingDINO — detect anything by text prompt

```bash
uv add groundingdino-py
```

```python
from groundingdino.util.inference import load_model, predict
from PIL import Image

model = load_model("groundingdino/config/GroundingDINO_SwinT_OGC.py",
                    "weights/groundingdino_swint_ogc.pth")

boxes, logits, phrases = predict(model=model, image=Image.open("warehouse.jpg"),
    caption="forklift . pallet . safety vest", box_threshold=0.3, text_threshold=0.25)
for box, logit, phrase in zip(boxes, logits, phrases):
    print(f"{phrase}: {logit:.2f}")
```

WHY: Detects any object by text description without retraining. Use for custom domains without collecting training data.

### Visualize with supervision

```python
import supervision as sv
import cv2
image = cv2.imread("image.jpg")
dets = sv.Detections.from_ultralytics(model(image)[0])
labels = [f"{model.names[c]} {cf:.2f}" for c, cf in zip(dets.class_id, dets.confidence)]
out = sv.LabelAnnotator().annotate(
    scene=sv.BoxAnnotator().annotate(scene=image.copy(), detections=dets),
    detections=dets, labels=labels)
cv2.imwrite("annotated.jpg", out)
```

---

## 2. Image Segmentation

### SAM — segment anything with point or box prompts

```bash
uv add segment-anything
curl -L -o sam_vit_h.pth "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth"
```

```python
from segment_anything import sam_model_registry, SamPredictor
import cv2, numpy as np

sam = sam_model_registry["vit_h"](checkpoint="sam_vit_h.pth")
sam.to("cuda")
predictor = SamPredictor(sam)
image = cv2.imread("image.jpg")
predictor.set_image(image)

# Segment by point click
masks, scores, _ = predictor.predict(
    point_coords=np.array([[500, 375]]), point_labels=np.array([1]),
    multimask_output=True)
best_mask = masks[np.argmax(scores)]

# Or segment by bounding box (combine with YOLO detections)
for box in YOLO("yolov8m.pt")(image)[0].boxes:
    masks, _, _ = predictor.predict(box=box.xyxy[0].cpu().numpy(), multimask_output=False)
```

### YOLOv8 instance segmentation (faster, less flexible)

```python
model = YOLO("yolov8m-seg.pt")
results = model("image.jpg")
for r in results:
    if r.masks is not None:
        for mask, box in zip(r.masks.data, r.boxes):
            print(f"{r.names[int(box.cls)]}: area = {mask.sum().item():.0f}px")
```

### Automatic mask generation (segment everything)

```python
from segment_anything import SamAutomaticMaskGenerator
masks = SamAutomaticMaskGenerator(sam).generate(image)  # returns list of mask dicts
print(f"Found {len(masks)} segments")
```

---

## 3. Face Detection & Recognition

```bash
uv add insightface onnxruntime
```

### Detect and analyze faces

```python
from insightface.app import FaceAnalysis
import cv2, numpy as np

app = FaceAnalysis(name="buffalo_l", providers=["CUDAExecutionProvider"])
app.prepare(ctx_id=0, det_size=(640, 640))

faces = app.get(cv2.imread("group_photo.jpg"))
for i, face in enumerate(faces):
    bbox = face.bbox.astype(int)
    print(f"Face {i}: age={face.age}, gender={'M' if face.gender==1 else 'F'}, "
          f"score={face.det_score:.3f}, bbox={bbox.tolist()}")
```

### Compare two faces

```python
face1 = app.get(cv2.imread("person_a.jpg"))[0]
face2 = app.get(cv2.imread("person_b.jpg"))[0]
e1 = face1.embedding / np.linalg.norm(face1.embedding)
e2 = face2.embedding / np.linalg.norm(face2.embedding)
similarity = np.dot(e1, e2)
print(f"Similarity: {similarity:.3f}, Match: {similarity > 0.4}")
```

### Build a face database and identify unknowns

```python
from pathlib import Path

# Enroll: faces/person_name/*.jpg -> averaged embedding per person
face_db = {}
for d in Path("faces/").iterdir():
    if not d.is_dir(): continue
    embs = [app.get(cv2.imread(str(p)))[0].embedding for p in d.glob("*.jpg")
            if app.get(cv2.imread(str(p)))]
    if embs:
        avg = np.mean([e / np.linalg.norm(e) for e in embs], axis=0)
        face_db[d.name] = avg

# Identify: cosine similarity against database, threshold 0.4
for face in app.get(cv2.imread("test.jpg")):
    emb = face.embedding / np.linalg.norm(face.embedding)
    scores = {n: np.dot(emb, ref) for n, ref in face_db.items()}
    best = max(scores, key=scores.get)
    print(f"{best}: {scores[best]:.3f}" if scores[best] > 0.4 else "unknown")
```

---

## 4. Data Annotation Workflow

### Annotate with labelImg

```bash
printf "person\ncar\nbicycle\ndog\ncat\n" > classes.txt
uv tool install labelImg
labelImg images/ labels/ classes.txt
```

### Convert PASCAL VOC XML to YOLO format

```python
import xml.etree.ElementTree as ET
from pathlib import Path

classes = ["person", "car", "bicycle", "dog", "cat"]
for xf in Path("annotations/").glob("*.xml"):
    root = ET.parse(xf).getroot()
    iw, ih = int(root.find("size/width").text), int(root.find("size/height").text)
    lines = []
    for obj in root.findall("object"):
        n = obj.find("name").text
        if n not in classes: continue
        b = obj.find("bndbox")
        x1,y1,x2,y2 = (int(b.find(k).text) for k in ["xmin","ymin","xmax","ymax"])
        lines.append(f"{classes.index(n)} {(x1+x2)/2/iw:.6f} {(y1+y2)/2/ih:.6f} {(x2-x1)/iw:.6f} {(y2-y1)/ih:.6f}")
    xf.with_suffix(".txt").write_text("\n".join(lines))
```

### Organize into YOLO directory structure and create dataset config

```bash
mkdir -p dataset/{train,val}/{images,labels}
ls images/ | shuf | head -n $(( $(ls images/ | wc -l) * 80 / 100 )) > train_list.txt
ls images/ | grep -v -F -f train_list.txt > val_list.txt
while read f; do cp "images/$f" dataset/train/images/; cp "labels/${f%.jpg}.txt" dataset/train/labels/; done < train_list.txt
while read f; do cp "images/$f" dataset/val/images/; cp "labels/${f%.jpg}.txt" dataset/val/labels/; done < val_list.txt
cat > dataset.yaml << 'EOF'
path: ./dataset
train: train/images
val: val/images
names: { 0: person, 1: car, 2: bicycle, 3: dog, 4: cat }
EOF
```

---

## 5. Model Training

### Train YOLOv8 on custom data

```bash
uv run yolo detect train data=dataset.yaml model=yolov8m.pt epochs=100 imgsz=640 batch=16 name=my_detector
```

### Train with hyperparameter control

```python
from ultralytics import YOLO
YOLO("yolov8m.pt").train(data="dataset.yaml", epochs=100, imgsz=640, batch=16,
    lr0=0.01, momentum=0.937, weight_decay=0.0005, augment=True,
    mosaic=1.0, mixup=0.1, patience=20, project="runs/train", name="exp_v1")
```

### Train with mmdetection (Faster R-CNN, DETR, etc.)

```bash
uv add mmdet mmengine mmcv
```

```python
from mmengine.config import Config
cfg = Config.fromfile("configs/faster_rcnn/faster-rcnn_r50_fpn_1x_coco.py")
cfg.data_root, cfg.model.roi_head.bbox_head.num_classes = "dataset/", 5
cfg.train_cfg.max_epochs, cfg.work_dir = 24, "runs/mmdet_exp"
```

### Validate and resume

```bash
uv run yolo detect val model=runs/train/exp_v1/weights/best.pt data=dataset.yaml
uv run yolo detect train model=runs/train/exp_v1/weights/last.pt resume=True
```

---

## 6. Inference Optimization

### Export to ONNX

```bash
uv run yolo export model=best.pt format=onnx opset=17 simplify=True
```

```python
import onnxruntime as ort, cv2
session = ort.InferenceSession("best.onnx", providers=["CUDAExecutionProvider"])
blob = cv2.dnn.blobFromImage(cv2.imread("test.jpg"), 1/255.0, (640,640), swapRB=True)
outputs = session.run(None, {session.get_inputs()[0].name: blob})
```

### Export to TensorRT (maximum GPU speed)

```bash
uv run yolo export model=best.pt format=engine device=0 half=True
```

```python
model = YOLO("best.engine")  # same API as regular model
results = model("image.jpg")
```

### Batch processing and FP16 inference

```python
model = YOLO("best.pt")
images = list(Path("test_images/").glob("*.jpg"))
for i in range(0, len(images), 32):  # batch of 32 for GPU efficiency
    results = model(images[i:i+32], half=True)  # half=True for FP16 (2x faster)
```

```bash
uv run yolo benchmark model=best.pt imgsz=640 half=True
```

---

## 7. Video Processing Pipeline

### Extract frames (1 per second)

```python
import cv2
from pathlib import Path
cap = cv2.VideoCapture("input.mp4")
fps = cap.get(cv2.CAP_PROP_FPS)
Path("frames/").mkdir(exist_ok=True)
count = 0
while cap.isOpened():
    ret, frame = cap.read()
    if not ret: break
    if count % int(fps) == 0:
        cv2.imwrite(f"frames/frame_{count:06d}.jpg", frame)
    count += 1
cap.release()
```

### Simple tracking (no visualization)

```python
model = YOLO("yolov8m.pt")
for r in model.track(source="input.mp4", tracker="bytetrack.yaml", stream=True, persist=True):
    if r.boxes.id is not None:
        for box, tid in zip(r.boxes, r.boxes.id):
            print(f"{r.names[int(box.cls)]} track={int(tid)}")
```

### Full pipeline: detect, track, annotate, and write video

```python
import supervision as sv
from ultralytics import YOLO
import cv2

model = YOLO("yolov8m.pt")
tracker, box_ann, label_ann, trace_ann = (
    sv.ByteTrack(), sv.BoxAnnotator(), sv.LabelAnnotator(), sv.TraceAnnotator())
cap = cv2.VideoCapture("input.mp4")
fps, w, h = int(cap.get(5)), int(cap.get(3)), int(cap.get(4))
writer = cv2.VideoWriter("output.mp4", cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))
line = sv.LineZone(start=sv.Point(0, 500), end=sv.Point(w, 500))  # optional line counter

while cap.isOpened():
    ret, frame = cap.read()
    if not ret: break
    dets = tracker.update_with_detections(sv.Detections.from_ultralytics(model(frame)[0]))
    labels = [f"#{t} {model.names[c]} {cf:.2f}" for t, c, cf in
              zip(dets.tracker_id, dets.class_id, dets.confidence)]
    frame = trace_ann.annotate(scene=label_ann.annotate(
        scene=box_ann.annotate(scene=frame, detections=dets),
        detections=dets, labels=labels), detections=dets)
    line.trigger(detections=dets)  # count crossings
    writer.write(frame)
cap.release(); writer.release()
print(f"Line crossings — In: {line.in_count}, Out: {line.out_count}")
```

---

## 8. Agent Workflows

### Automated image analysis report

```python
from ultralytics import YOLO
from pathlib import Path
import json

def analyze_image(image_path):
    results = YOLO("yolov8m.pt")(image_path)[0]
    return {
        "file": str(image_path),
        "dimensions": list(results.orig_shape),
        "objects": [{"class": results.names[int(b.cls)],
                     "confidence": round(float(b.conf), 3),
                     "bbox": [round(x,1) for x in b.xyxy[0].tolist()]}
                    for b in results.boxes]}

reports = [analyze_image(p) for p in Path("uploads/").glob("*.jpg")]
print(json.dumps(reports, indent=2))
```

### Document OCR pipeline

```bash
uv add easyocr
```

```python
import easyocr
reader = easyocr.Reader(["en"])

def extract_text(image_path):
    results = reader.readtext(str(image_path))
    return [{"text": t, "confidence": round(c, 3)} for _, t, c in results]

text_data = extract_text("document.jpg")
full_text = " ".join(t["text"] for t in text_data if t["confidence"] > 0.5)
print(f"Extracted: {full_text}")
```

### Batch production pipeline with error handling

```python
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json

def process_single(path):
    try: return {**analyze_image(path), "status": "success"}
    except Exception as e: return {"file": str(path), "status": "error", "error": str(e)}

paths = list(Path("incoming/").glob("*.jpg"))
with ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(process_single, paths))
print(f"Processed {sum(1 for r in results if r['status']=='success')}/{len(results)}")
```

---

## Quick Reference

| Task | Command / Code |
|---|---|
| Detect objects | `YOLO("yolov8m.pt")("image.jpg")` |
| Detect by text | `predict(model, image, "cat . dog")` |
| Segment anything | `SamPredictor.predict(point_coords=...)` |
| Instance segment | `YOLO("yolov8m-seg.pt")("image.jpg")` |
| Detect faces | `FaceAnalysis("buffalo_l").get(image)` |
| Compare faces | Cosine similarity of `face.embedding` |
| Annotate data | `labelImg images/ labels/ classes.txt` |
| Train YOLO | `yolo detect train data=d.yaml model=yolov8m.pt` |
| Export ONNX | `yolo export model=best.pt format=onnx` |
| Export TensorRT | `yolo export model=best.pt format=engine half=True` |
| Track in video | `model.track(source="v.mp4", tracker="bytetrack.yaml")` |
| OCR text | `easyocr.Reader(["en"]).readtext("doc.jpg")` |
| Benchmark | `yolo benchmark model=best.pt imgsz=640` |

## Troubleshooting

**CUDA out of memory**: Reduce `imgsz`, use a smaller model (`yolov8n`), add `half=True`, or reduce `batch` size.

**OpenCV cannot open video**: Use `opencv-python` (not headless). On Linux, install `ffmpeg`.

**SAM slow on CPU**: SAM needs GPU. For CPU-only, use MobileSAM: `uv add mobile-sam`.

**InsightFace download fails**: Download models manually from InsightFace model zoo to `~/.insightface/models/buffalo_l/`.

**ONNX export fails**: Use `opset=17` for YOLOv8. Install `onnxsim` for graph simplification.

**Low accuracy**: Verify input resolution matches training `imgsz`. Check class names in `dataset.yaml` match annotations.
