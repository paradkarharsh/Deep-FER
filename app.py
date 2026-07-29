"""
DeepFER — Facial Emotion Recognition Streamlit App
----------------------------------------------------
Loads the model trained in DeepFER_Training.ipynb and classifies emotions from:
  - an uploaded photo
  - a webcam snapshot

Run with:
    streamlit run app.py
"""

import json
import numpy as np
import cv2
import streamlit as st
from PIL import Image
import tensorflow as tf

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "outputs" / "deepfer_model.keras"
LABEL_MAP_PATH = BASE_DIR / "outputs" / "label_map.json"
IMG_SIZE = (48, 48)
COLOR_MODE_GRAYSCALE = True  # must match training config

EMOTION_EMOJI = {
    "angry": "😠", "disgust": "🤢", "fear": "😨", "happy": "😄",
    "neutral": "😐", "sad": "😢", "surprise": "😲",
}

st.set_page_config(page_title="DeepFER", page_icon="🎭", layout="centered")


@st.cache_resource
def load_assets():
    model = tf.keras.models.load_model(str(MODEL_PATH))
    with open(LABEL_MAP_PATH) as f:
        label_map = {int(k): v for k, v in json.load(f).items()}
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    return model, label_map, face_cascade


def detect_faces(bgr_img, face_cascade):
    gray = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
    return gray, faces


def predict_emotion(face_crop_gray, model, label_map):
    face = cv2.resize(face_crop_gray, IMG_SIZE)
    face = face.astype("float32") / 255.0
    face = np.expand_dims(face, axis=(0, -1))  # (1, H, W, 1)
    preds = model.predict(face, verbose=0)[0]
    idx = int(np.argmax(preds))
    return label_map[idx], float(preds[idx]), preds


def render_result(label, confidence, preds, label_map):
    emoji = EMOTION_EMOJI.get(label, "")
    st.markdown(f"### {emoji} {label.capitalize()} — {confidence * 100:.1f}% confidence")
    probs = {label_map[i]: float(p) for i, p in enumerate(preds)}
    st.bar_chart(probs)


st.title("🎭 DeepFER: Facial Emotion Recognition")
st.caption("Upload a photo or take a snapshot — DeepFER detects faces and classifies emotion "
           "into angry, disgust, fear, happy, neutral, sad, or surprise.")

try:
    model, label_map, face_cascade = load_assets()
except Exception as e:
    st.error(
        "Couldn't load the trained model. Run `DeepFER_Training.ipynb` first — it saves "
        "`outputs/deepfer_model.keras` and `outputs/label_map.json`.\n\n"
        f"Details: {e}"
    )
    st.stop()

tab_upload, tab_camera = st.tabs(["📁 Upload photo", "📷 Camera"])

with tab_upload:
    uploaded = st.file_uploader("Choose an image", type=["jpg", "jpeg", "png"])
    if uploaded is not None:
        pil_img = Image.open(uploaded).convert("RGB")
        bgr_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        gray, faces = detect_faces(bgr_img, face_cascade)

        if len(faces) == 0:
            st.warning("No face detected. Try a clearer, front-facing photo.")
            st.image(pil_img, caption="Input image", use_container_width=True)
        else:
            for (x, y, w, h) in faces:
                cv2.rectangle(bgr_img, (x, y), (x + w, y + h), (0, 200, 0), 2)
            st.image(cv2.cvtColor(bgr_img, cv2.COLOR_BGR2RGB), caption="Detected face(s)", use_container_width=True)

            x, y, w, h = max(faces, key=lambda f: f[2] * f[3])  # largest face
            crop = gray[y:y + h, x:x + w]
            if crop.size > 0:
                label, confidence, preds = predict_emotion(crop, model, label_map)
                render_result(label, confidence, preds, label_map)

with tab_camera:
    st.subheader("📷 Camera Mode")
    cam_mode = st.radio(
        "Select Camera Method:",
        ["🔴 Live OpenCV Webcam Feed (Recommended)", "📸 Browser Snapshot"],
        index=0,
        help="If browser permissions block the webcam, use Live OpenCV Feed which accesses your camera directly."
    )

    if cam_mode == "🔴 Live OpenCV Webcam Feed (Recommended)":
        st.info("Direct Python webcam stream. Select your camera device index below.")
        
        col_cam, col_btn = st.columns([1, 2])
        with col_cam:
            cam_idx = st.selectbox(
                "Camera Device Index:",
                [1, 0, 2],
                index=0,
                help="Many laptops have an IR camera at Index 0 (pitch black) and main webcam at Index 1."
            )
        
        run_live = st.checkbox("Start Live Webcam Feed")
        frame_window = st.empty()
        warn_box = st.empty()

        if run_live:
            # On Windows, cv2.CAP_DSHOW works best for webcams
            cap = cv2.VideoCapture(cam_idx, cv2.CAP_DSHOW)
            if not cap.isOpened():
                # Fallback to default backend
                cap = cv2.VideoCapture(cam_idx)

            if not cap.isOpened():
                st.error(f"Error: Could not open camera at index {cam_idx}. Ensure no other application (e.g. Zoom, Teams) is using it.")
            else:
                # Warmup frames (discard initial uninitialized camera buffers)
                for _ in range(5):
                    cap.read()

                dark_frame_warned = False
                while run_live:
                    ret, frame = cap.read()
                    if not ret or frame is None:
                        st.error("Failed to read frame from webcam.")
                        break

                    # Check for dark / pitch black frames (common when wrong camera index like IR sensor is picked)
                    if frame.mean() < 12 and not dark_frame_warned:
                        warn_box.warning("⚠️ Image appears very dark or black. If your laptop has multiple camera sensors (e.g., Windows Hello IR camera), try changing 'Camera Device Index' to 1 or 2.")
                        dark_frame_warned = True

                    gray, faces = detect_faces(frame, face_cascade)
                    for (x, y, w, h) in faces:
                        face_crop = gray[y:y + h, x:x + w]
                        if face_crop.size == 0:
                            continue
                        label, confidence, _ = predict_emotion(face_crop, model, label_map)

                        color = (0, 255, 0)
                        cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                        text = f"{label.capitalize()} ({confidence * 100:.0f}%)"
                        cv2.putText(frame, text, (x, max(y - 10, 20)),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    frame_window.image(frame_rgb, channels="RGB", use_container_width=True)

                cap.release()

    else:
        snapshot = st.camera_input("Take a snapshot")
        if snapshot is not None:
            pil_img = Image.open(snapshot).convert("RGB")
            bgr_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            gray, faces = detect_faces(bgr_img, face_cascade)

            if len(faces) == 0:
                st.warning("No face detected. Center your face in the frame and try again.")
            else:
                x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
                crop = gray[y:y + h, x:x + w]
                if crop.size > 0:
                    label, confidence, preds = predict_emotion(crop, model, label_map)
                    render_result(label, confidence, preds, label_map)

        st.caption("🔒 **Troubleshooting Browser Camera Permissions:**\n"
                   "1. Click the lock/tune icon in your browser's address bar next to `localhost:8501`.\n"
                   "2. Ensure **Camera** permission is set to **Allow**.\n"
                   "3. Make sure no other app (Zoom, Teams, Skype) is currently using your camera.\n"
                   "4. Or switch to **Live OpenCV Webcam Feed** above!")

st.divider()
st.caption("DeepFER · CNN trained from scratch on 7-class facial emotion data · "
           "Built for Deep Learning for Computer Vision coursework.")
