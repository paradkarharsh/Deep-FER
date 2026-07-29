"""
DeepFER Backend Server
FastAPI server for facial emotion recognition using a TensorFlow CNN model.
"""

import base64
import io
import json
import os
import time
import uuid
from contextlib import asynccontextmanager
from io import StringIO
from pathlib import Path

import cv2
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

# ---------------------------------------------------------------------------
# Paths (relative to the DeepFER root, one level above this file)
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "outputs" / "deepfer_model.keras"
LABEL_MAP_PATH = BASE_DIR / "outputs" / "label_map.json"

# ---------------------------------------------------------------------------
# Emotion metadata
# ---------------------------------------------------------------------------
EMOTION_EMOJIS = {
    "angry": "\U0001F620",      # 😠
    "disgust": "\U0001F922",    # 🤢
    "fear": "\U0001F628",       # 😨
    "happy": "\U0001F604",      # 😄
    "neutral": "\U0001F610",    # 😐
    "sad": "\U0001F622",        # 😢
    "surprise": "\U0001F632",   # 😲
}

EMOTION_COLORS = {
    "angry": "#EF4444",
    "disgust": "#22C55E",
    "fear": "#A855F7",
    "happy": "#EAB308",
    "neutral": "#6B7280",
    "sad": "#3B82F6",
    "surprise": "#F97316",
}

EMOTION_DESCRIPTIONS = {
    "angry": "The subject appears to be expressing anger or frustration",
    "disgust": "The subject appears to be expressing disgust or distaste",
    "fear": "The subject appears to be expressing fear or anxiety",
    "happy": "The subject appears to be expressing happiness or joy",
    "neutral": "The subject appears to have a neutral or calm expression",
    "sad": "The subject appears to be expressing sadness or sorrow",
    "surprise": "The subject appears to be expressing surprise or astonishment",
}

# ---------------------------------------------------------------------------
# Global state populated during startup
# ---------------------------------------------------------------------------
model: tf.keras.Model | None = None
label_map: dict[int, str] = {}
face_cascade: cv2.CascadeClassifier | None = None
model_summary_str: str = ""
START_TIME: float = time.time()


def _load_model_and_cascade() -> None:
    """Load the TF model, label map, and OpenCV Haar cascade once."""
    global model, label_map, face_cascade, model_summary_str

    # -- Model --
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
    model = tf.keras.models.load_model(str(MODEL_PATH))

    # Capture model.summary() as a string
    buf = StringIO()
    model.summary(print_fn=lambda line: buf.write(line + "\n"))
    model_summary_str = buf.getvalue()

    # -- Label map --
    if not LABEL_MAP_PATH.exists():
        raise FileNotFoundError(f"Label map not found: {LABEL_MAP_PATH}")
    with open(LABEL_MAP_PATH, "r") as f:
        raw = json.load(f)
    label_map = {int(k): v for k, v in raw.items()}

    # -- Face cascade --
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_cascade = cv2.CascadeClassifier(cascade_path)
    if face_cascade.empty():
        raise RuntimeError("Failed to load Haar cascade for face detection")


# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    _load_model_and_cascade()
    print(f"[DeepFER] Model loaded from {MODEL_PATH}")
    print(f"[DeepFER] Labels: {list(label_map.values())}")
    yield
    # cleanup if needed
    print("[DeepFER] Shutting down.")


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="DeepFER API",
    description="Facial Emotion Recognition API powered by a TensorFlow CNN",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

DIST_DIR = BASE_DIR / "frontend" / "dist"
if DIST_DIR.exists():
    assets_dir = DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse(DIST_DIR / "index.html")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json"):
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = DIST_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(DIST_DIR / "index.html")


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class BBox(BaseModel):
    x: int
    y: int
    w: int
    h: int


class FacePrediction(BaseModel):
    detection_id: str
    bbox: BBox
    emotion: str
    confidence: float
    probabilities: dict[str, float]
    emoji: str
    color: str
    description: str


class PredictionResponse(BaseModel):
    detection_id: str
    faces: list[FacePrediction]
    processing_time_ms: float
    image_dimensions: dict[str, int]


class FrameRequest(BaseModel):
    image: str  # base64-encoded image data (with or without data-URI prefix)


class ModelInfoResponse(BaseModel):
    name: str
    architecture: str
    parameters: int
    input_shape: list
    classes: list[str]
    accuracy: str
    version: str
    dataset: str
    inference_device: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str
    uptime_seconds: float


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _decode_image_bytes(raw_bytes: bytes) -> np.ndarray:
    """Decode raw image bytes into an OpenCV BGR numpy array."""
    arr = np.frombuffer(raw_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    return img


def _predict_faces(
    img_bgr: np.ndarray,
    min_face_size: tuple[int, int] = (60, 60),
) -> tuple[list[FacePrediction], dict[str, int]]:
    """
    Detect faces and run emotion prediction on each.
    Returns (list_of_predictions, image_dimensions_dict).
    """
    h, w = img_bgr.shape[:2]
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=min_face_size,
        flags=cv2.CASCADE_SCALE_IMAGE,
    )

    results: list[FacePrediction] = []

    for (fx, fy, fw, fh) in faces:
        # Extract face ROI, resize to 48x48, normalise
        roi_gray = gray[fy : fy + fh, fx : fx + fw]
        if roi_gray.size == 0:
            continue
        roi_resized = cv2.resize(roi_gray, (48, 48), interpolation=cv2.INTER_AREA)
        roi_norm = roi_resized.astype(np.float32) / 255.0
        roi_input = roi_norm.reshape(1, 48, 48, 1)

        # Predict
        preds = model.predict(roi_input, verbose=0)[0]

        # Build probability dict
        probabilities = {}
        for idx, prob in enumerate(preds):
            emotion_name = label_map.get(idx, f"class_{idx}")
            probabilities[emotion_name] = round(float(prob), 4)

        top_idx = int(np.argmax(preds))
        top_emotion = label_map.get(top_idx, f"class_{top_idx}")
        top_confidence = float(preds[top_idx])

        results.append(
            FacePrediction(
                detection_id=str(uuid.uuid4()),
                bbox=BBox(x=int(fx), y=int(fy), w=int(fw), h=int(fh)),
                emotion=top_emotion,
                confidence=round(top_confidence, 4),
                probabilities=probabilities,
                emoji=EMOTION_EMOJIS.get(top_emotion, ""),
                color=EMOTION_COLORS.get(top_emotion, "#6B7280"),
                description=EMOTION_DESCRIPTIONS.get(top_emotion, ""),
            )
        )

    return results, {"w": w, "h": h}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    """Accept an uploaded image, detect faces, and predict emotions."""
    start = time.perf_counter()

    try:
        contents = await file.read()
        img_bgr = _decode_image_bytes(contents)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image: {exc}")

    faces, dims = _predict_faces(img_bgr, min_face_size=(60, 60))
    elapsed_ms = (time.perf_counter() - start) * 1000.0

    return PredictionResponse(
        detection_id=str(uuid.uuid4()),
        faces=faces,
        processing_time_ms=round(elapsed_ms, 2),
        image_dimensions=dims,
    )


@app.post("/api/predict-frame", response_model=PredictionResponse)
async def predict_frame(payload: FrameRequest):
    """Accept a base64-encoded webcam frame, detect faces, predict emotions."""
    start = time.perf_counter()

    try:
        b64 = payload.image
        # Strip optional data-URI prefix (e.g. "data:image/jpeg;base64,...")
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        raw_bytes = base64.b64decode(b64)
        img_bgr = _decode_image_bytes(raw_bytes)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {exc}")

    faces, dims = _predict_faces(img_bgr, min_face_size=(30, 30))
    elapsed_ms = (time.perf_counter() - start) * 1000.0

    return PredictionResponse(
        detection_id=str(uuid.uuid4()),
        faces=faces,
        processing_time_ms=round(elapsed_ms, 2),
        image_dimensions=dims,
    )


@app.get("/api/model-info", response_model=ModelInfoResponse)
async def model_info():
    """Return metadata about the loaded model."""
    input_shape = list(model.input_shape) if model else []
    total_params = int(model.count_params()) if model else 0
    classes = [label_map[i] for i in sorted(label_map.keys())]

    # Determine inference device
    gpus = tf.config.list_physical_devices("GPU")
    device = f"GPU ({gpus[0].name})" if gpus else "CPU"

    return ModelInfoResponse(
        name="DeepFER CNN",
        architecture=model_summary_str,
        parameters=total_params,
        input_shape=input_shape,
        classes=classes,
        accuracy="~68% on FER-2013 test set",
        version="1.0.0",
        dataset="FER-2013",
        inference_device=device,
    )


@app.get("/api/health", response_model=HealthResponse)
async def health():
    """Health-check endpoint."""
    return HealthResponse(
        status="ok",
        model_loaded=model is not None,
        version="1.0.0",
        uptime_seconds=round(time.time() - START_TIME, 2),
    )


# ---------------------------------------------------------------------------
# Entry-point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=port,
        reload=False,
    )
