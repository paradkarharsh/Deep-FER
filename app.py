"""
DeepFER — Facial Emotion Recognition Streamlit Application
------------------------------------------------------------
Advanced UI & Multi-Feature Dashboard for DeepFER.
Offers Single Image Analysis, Live Webcam, Batch Processing, Session Analytics,
Model Insights, and Export Capabilities.
"""

import json
import time
import io
import base64
from pathlib import Path

import cv2
import numpy as np
import pandas as pd
from PIL import Image
import tensorflow as tf
import streamlit as st

# ---------------------------------------------------------------------------
# Path & Configuration Setup
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "outputs" / "deepfer_model.keras"
LABEL_MAP_PATH = BASE_DIR / "outputs" / "label_map.json"
IMG_SIZE = (48, 48)

EMOTION_EMOJI = {
    "angry": "😠",
    "disgust": "🤢",
    "fear": "😨",
    "happy": "😄",
    "neutral": "😐",
    "sad": "😢",
    "surprise": "😲",
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
    "angry": "Expressing anger, frustration, or intense dislike.",
    "disgust": "Expressing disgust, revulsion, or distaste.",
    "fear": "Expressing fear, anxiety, or apprehension.",
    "happy": "Expressing happiness, joy, or satisfaction.",
    "neutral": "Expressing a neutral, calm, or relaxed state.",
    "sad": "Expressing sadness, sorrow, or unhappiness.",
    "surprise": "Expressing surprise, astonishment, or shock.",
}

st.set_page_config(
    page_title="DeepFER — Facial Emotion Recognition",
    page_icon="🎭",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ---------------------------------------------------------------------------
# Custom CSS for Modern UI & Glassmorphism
# ---------------------------------------------------------------------------
st.markdown(
    """
<style>
    /* Metric Cards */
    div[data-testid="stMetricValue"] {
        font-size: 1.8rem !important;
        font-weight: 700 !important;
    }
    .metric-card {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 16px;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .emotion-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-weight: 600;
        color: white;
        font-size: 0.95rem;
    }
    .main-header {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        padding: 24px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        margin-bottom: 24px;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        border-radius: 8px;
        padding: 8px 16px;
    }
</style>
""",
    unsafe_allow_html=True,
)

# Initialize Session State for Analytics & Log
if "history" not in st.session_state:
    st.session_state.history = []

# ---------------------------------------------------------------------------
# Asset Loader
# ---------------------------------------------------------------------------
@st.cache_resource
def load_assets():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file missing at: {MODEL_PATH}")
    model = tf.keras.models.load_model(str(MODEL_PATH))

    if not LABEL_MAP_PATH.exists():
        raise FileNotFoundError(f"Label map missing at: {LABEL_MAP_PATH}")
    with open(LABEL_MAP_PATH) as f:
        label_map = {int(k): v for k, v in json.load(f).items()}

    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_cascade = cv2.CascadeClassifier(cascade_path)
    if face_cascade.empty():
        raise RuntimeError("Failed to load OpenCV Haar Cascade Classifier.")

    return model, label_map, face_cascade


# ---------------------------------------------------------------------------
# Core Inference Functions
# ---------------------------------------------------------------------------
def detect_faces(bgr_img, face_cascade, min_size=(60, 60)):
    gray = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=min_size
    )
    return gray, faces


def predict_emotion(face_crop_gray, model, label_map):
    face = cv2.resize(face_crop_gray, IMG_SIZE)
    face = face.astype("float32") / 255.0
    face = np.expand_dims(face, axis=(0, -1))  # (1, 48, 48, 1)
    preds = model.predict(face, verbose=0)[0]
    idx = int(np.argmax(preds))
    label = label_map[idx]
    confidence = float(preds[idx])
    probs = {label_map[i]: float(p) for i, p in enumerate(preds)}
    return label, confidence, probs


def log_prediction(source, label, confidence, probs):
    st.session_state.history.append(
        {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "source": source,
            "emotion": label,
            "confidence": round(confidence, 4),
            "top_emoji": EMOTION_EMOJI.get(label, ""),
            "all_probabilities": probs,
        }
    )


# ---------------------------------------------------------------------------
# App Main Execution
# ---------------------------------------------------------------------------
def main():
    # Sidebar
    with st.sidebar:
        st.title("🎭 DeepFER")
        st.markdown("**Facial Emotion Recognition System**")
        st.caption("Deep Learning CNN Model (FER-2013)")
        st.divider()

        # Model Info Widget
        st.markdown("### ⚙️ System Status")
        try:
            model, label_map, face_cascade = load_assets()
            st.success("✅ Model Loaded")
            st.caption(f"**Classes**: {', '.join(label_map.values())}")
            st.caption(f"**Total Parameters**: {model.count_params():,}")
        except Exception as e:
            st.error(f"❌ Model Error: {e}")
            st.stop()

        st.divider()
        st.markdown("### 📊 Session Quick Stats")
        total_scans = len(st.session_state.history)
        st.metric("Total Analyzed Faces", total_scans)
        if total_scans > 0:
            emotions_list = [h["emotion"] for h in st.session_state.history]
            most_common = pd.Series(emotions_list).mode()[0]
            avg_conf = np.mean([h["confidence"] for h in st.session_state.history]) * 100
            st.metric("Top Emotion", f"{EMOTION_EMOJI.get(most_common, '')} {most_common.capitalize()}")
            st.metric("Avg Confidence", f"{avg_conf:.1f}%")

            if st.button("🗑️ Clear Session History"):
                st.session_state.history = []
                st.rerun()

        st.divider()
        st.caption("Built with TensorFlow & Streamlit")

    # Header
    st.markdown(
        """
    <div class="main-header">
        <h1 style="margin: 0; font-size: 2.2rem;">🎭 DeepFER — Facial Emotion Recognition</h1>
        <p style="margin-top: 6px; margin-bottom: 0; opacity: 0.85; font-size: 1.05rem;">
            Real-time multi-face emotion analysis powered by Convolutional Neural Networks. Upload images, use camera, batch process, or view session analytics.
        </p>
    </div>
    """,
        unsafe_allow_html=True,
    )

    # Main Navigation Tabs
    tab_single, tab_cam, tab_batch, tab_analytics, tab_model, tab_fullstack = st.tabs(
        [
            "🎯 Single Image",
            "📷 Live Webcam",
            "📁 Batch Processing",
            "📊 Analytics Dashboard",
            "🧠 Model Architecture",
            "🌐 Full-Stack React UI & Deploy",
        ]
    )

    # -----------------------------------------------------------------------
    # TAB 1: Single Image
    # -----------------------------------------------------------------------
    with tab_single:
        st.subheader("Upload Photo for Emotion Analysis")
        uploaded_file = st.file_uploader(
            "Choose an image (JPG, PNG, WEBP)",
            type=["jpg", "jpeg", "png", "webp"],
            key="single_upload",
        )

        if uploaded_file is not None:
            pil_img = Image.open(uploaded_file).convert("RGB")
            bgr_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            gray, faces = detect_faces(bgr_img, face_cascade)

            col_left, col_right = st.columns([1.2, 1])

            with col_left:
                if len(faces) == 0:
                    st.warning("⚠️ No face detected. Displaying original image.")
                    st.image(pil_img, caption="Input Image", use_container_width=True)
                else:
                    annotated_bgr = bgr_img.copy()
                    for x, y, w, h in faces:
                        cv2.rectangle(annotated_bgr, (x, y), (x + w, y + h), (0, 220, 100), 3)

                    st.image(
                        cv2.cvtColor(annotated_bgr, cv2.COLOR_BGR2RGB),
                        caption=f"Detected {len(faces)} Face(s)",
                        use_container_width=True,
                    )

            with col_right:
                if len(faces) > 0:
                    st.markdown(f"### Detected Faces ({len(faces)})")
                    for idx, (x, y, w, h) in enumerate(faces):
                        crop = gray[y : y + h, x : x + w]
                        if crop.size == 0:
                            continue

                        label, confidence, probs = predict_emotion(crop, model, label_map)
                        log_prediction(
                            source=uploaded_file.name,
                            label=label,
                            confidence=confidence,
                            probs=probs,
                        )

                        emoji = EMOTION_EMOJI.get(label, "")
                        color = EMOTION_COLORS.get(label, "#3B82F6")

                        with st.expander(
                            f"Face #{idx + 1}: {emoji} {label.capitalize()} ({confidence * 100:.1f}%)",
                            expanded=(idx == 0),
                        ):
                            sub_c1, sub_c2 = st.columns([1, 2])
                            with sub_c1:
                                crop_rgb = cv2.cvtColor(crop, cv2.COLOR_GRAY2RGB)
                                st.image(crop_rgb, width=120, caption="Facial Crop")

                            with sub_c2:
                                st.markdown(
                                    f"<div style='background-color:{color}; padding: 8px 14px; border-radius: 8px; font-weight: bold; color: white; text-align: center;'>"
                                    f"{emoji} {label.upper()} — {confidence * 100:.1f}% Confidence"
                                    f"</div>",
                                    unsafe_allow_html=True,
                                )
                                st.caption(EMOTION_DESCRIPTIONS.get(label, ""))

                            # Probability Distribution Chart
                            st.markdown("**Emotion Probability Breakdown:**")
                            df_probs = pd.DataFrame(
                                list(probs.items()), columns=["Emotion", "Probability"]
                            )
                            df_probs["Probability"] = df_probs["Probability"] * 100
                            df_probs = df_probs.sort_values(by="Probability", ascending=True)

                            st.bar_chart(
                                data=df_probs.set_index("Emotion"),
                                color="#3B82F6",
                            )

    # -----------------------------------------------------------------------
    # TAB 2: Live Webcam
    # -----------------------------------------------------------------------
    with tab_cam:
        st.subheader("📷 Camera & Live Stream Mode")
        cam_method = st.radio(
            "Select Camera Mode:",
            ["📸 Browser Snapshot", "🔴 Live OpenCV Video Stream"],
            horizontal=True,
        )

        if cam_method == "📸 Browser Snapshot":
            st.info("Take a quick photo using your browser camera.")
            snapshot = st.camera_input("Capture Snapshot")

            if snapshot is not None:
                pil_img = Image.open(snapshot).convert("RGB")
                bgr_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
                gray, faces = detect_faces(bgr_img, face_cascade)

                if len(faces) == 0:
                    st.warning("No face detected in snapshot. Please align your face in the frame.")
                    st.image(pil_img, use_container_width=True)
                else:
                    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
                    crop = gray[y : y + h, x : x + w]
                    label, confidence, probs = predict_emotion(crop, model, label_map)
                    log_prediction(
                        source="Webcam Snapshot",
                        label=label,
                        confidence=confidence,
                        probs=probs,
                    )

                    c1, c2 = st.columns([1, 1.5])
                    with c1:
                        annotated = bgr_img.copy()
                        cv2.rectangle(annotated, (x, y), (x + w, y + h), (0, 255, 0), 3)
                        st.image(
                            cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB),
                            caption="Detected Face",
                            use_container_width=True,
                        )
                    with c2:
                        emoji = EMOTION_EMOJI.get(label, "")
                        color = EMOTION_COLORS.get(label, "#3B82F6")
                        st.markdown(
                            f"### {emoji} {label.capitalize()} ({confidence * 100:.1f}%)"
                        )
                        st.caption(EMOTION_DESCRIPTIONS.get(label, ""))

                        probs_df = pd.DataFrame(
                            list(probs.items()), columns=["Emotion", "Probability"]
                        )
                        probs_df["Probability"] = probs_df["Probability"] * 100
                        st.bar_chart(probs_df.set_index("Emotion"))

        else:
            st.info("Direct Python webcam stream. Make sure no other app is using your webcam.")
            cam_idx = st.selectbox("Select Camera Index:", [0, 1, 2], index=0)
            run_live = st.checkbox("▶️ Start Live Stream")
            frame_spot = st.empty()

            if run_live:
                cap = cv2.VideoCapture(cam_idx, cv2.CAP_DSHOW)
                if not cap.isOpened():
                    cap = cv2.VideoCapture(cam_idx)

                if not cap.isOpened():
                    st.error(f"Failed to access camera device index {cam_idx}.")
                else:
                    for _ in range(3):
                        cap.read()

                    while run_live:
                        ret, frame = cap.read()
                        if not ret or frame is None:
                            st.error("Lost camera feed.")
                            break

                        gray, faces = detect_faces(frame, face_cascade, min_size=(40, 40))
                        for x, y, w, h in faces:
                            crop = gray[y : y + h, x : x + w]
                            if crop.size > 0:
                                label, conf, _ = predict_emotion(crop, model, label_map)
                                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                                txt = f"{label.capitalize()} ({conf * 100:.0f}%)"
                                cv2.putText(
                                    frame,
                                    txt,
                                    (x, max(y - 10, 20)),
                                    cv2.FONT_HERSHEY_SIMPLEX,
                                    0.7,
                                    (0, 255, 0),
                                    2,
                                )

                        frame_spot.image(
                            cv2.cvtColor(frame, cv2.COLOR_BGR2RGB),
                            channels="RGB",
                            use_container_width=True,
                        )

                    cap.release()

    # -----------------------------------------------------------------------
    # TAB 3: Batch Processing
    # -----------------------------------------------------------------------
    with tab_batch:
        st.subheader("📁 Bulk / Batch Image Emotion Analysis")
        st.caption("Upload multiple images at once to generate a comprehensive emotion classification report.")

        batch_files = st.file_uploader(
            "Select multiple image files",
            type=["jpg", "jpeg", "png", "webp"],
            accept_multiple_files=True,
            key="batch_upload",
        )

        if batch_files:
            if st.button("🚀 Process All Images"):
                results_list = []
                progress_bar = st.progress(0)

                for i, file_obj in enumerate(batch_files):
                    progress_bar.progress((i + 1) / len(batch_files))
                    pil_img = Image.open(file_obj).convert("RGB")
                    bgr_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
                    gray, faces = detect_faces(bgr_img, face_cascade)

                    if len(faces) == 0:
                        results_list.append(
                            {
                                "filename": file_obj.name,
                                "face_index": 0,
                                "emotion": "No Face Detected",
                                "confidence": 0.0,
                                "emoji": "❓",
                            }
                        )
                    else:
                        for f_idx, (x, y, w, h) in enumerate(faces):
                            crop = gray[y : y + h, x : x + w]
                            if crop.size > 0:
                                label, conf, probs = predict_emotion(crop, model, label_map)
                                log_prediction(
                                    source=file_obj.name,
                                    label=label,
                                    confidence=conf,
                                    probs=probs,
                                )
                                results_list.append(
                                    {
                                        "filename": file_obj.name,
                                        "face_index": f_idx + 1,
                                        "emotion": label,
                                        "confidence": round(conf, 4),
                                        "emoji": EMOTION_EMOJI.get(label, ""),
                                    }
                                )

                progress_bar.empty()
                df_batch = pd.DataFrame(results_list)
                st.success(f"Processed {len(batch_files)} files successfully!")
                st.dataframe(df_batch, use_container_width=True)

                # CSV & JSON Download buttons
                csv_bytes = df_batch.to_csv(index=False).encode("utf-8")
                st.download_button(
                    "📥 Download CSV Report",
                    data=csv_bytes,
                    file_name="deepfer_batch_report.csv",
                    mime="text/csv",
                )

    # -----------------------------------------------------------------------
    # TAB 4: Session Analytics Dashboard
    # -----------------------------------------------------------------------
    with tab_analytics:
        st.subheader("📊 Live Session Analytics")

        if not st.session_state.history:
            st.info("No images analyzed in this session yet. Upload photos in the Single Image or Batch tab to populate analytics.")
        else:
            df_hist = pd.DataFrame(st.session_state.history)

            m1, m2, m3, m4 = st.columns(4)
            m1.metric("Total Analyzed Faces", len(df_hist))
            most_freq = df_hist["emotion"].mode()[0]
            m2.metric("Dominant Emotion", f"{EMOTION_EMOJI.get(most_freq, '')} {most_freq.capitalize()}")
            m3.metric("Average Confidence", f"{df_hist['confidence'].mean() * 100:.1f}%")
            m4.metric("Unique Emotions", df_hist["emotion"].nunique())

            st.divider()

            col_c1, col_c2 = st.columns(2)

            with col_c1:
                st.markdown("### Emotion Distribution")
                counts = df_hist["emotion"].value_counts().reset_index()
                counts.columns = ["Emotion", "Count"]
                st.bar_chart(counts.set_index("Emotion"))

            with col_c2:
                st.markdown("### Average Confidence per Emotion")
                avg_conf_df = df_hist.groupby("emotion")["confidence"].mean().reset_index()
                avg_conf_df["confidence"] = avg_conf_df["confidence"] * 100
                st.bar_chart(avg_conf_df.set_index("emotion"))

            st.markdown("### Detailed Session Log")
            st.dataframe(
                df_hist[["timestamp", "source", "top_emoji", "emotion", "confidence"]],
                use_container_width=True,
            )

    # -----------------------------------------------------------------------
    # TAB 5: Model Architecture & Insights
    # -----------------------------------------------------------------------
    with tab_model:
        st.subheader("🧠 Model Specifications & Architecture")

        col_m1, col_m2 = st.columns(2)

        with col_m1:
            st.markdown("#### Model Specifications")
            specs_df = pd.DataFrame(
                [
                    ["Architecture", "Custom Deep Convolutional Neural Network (CNN)"],
                    ["Framework", "TensorFlow 2.x / Keras"],
                    ["Dataset", "FER-2013 (Facial Expression Recognition)"],
                    ["Classes", "7 (Angry, Disgust, Fear, Happy, Neutral, Sad, Surprise)"],
                    ["Input Resolution", "48 x 48 pixels (Grayscale)"],
                    ["Total Parameters", f"{model.count_params():,}"],
                    ["Test Accuracy", "~68.5%"],
                ],
                columns=["Attribute", "Value"],
            )
            st.table(specs_df)

        with col_m2:
            st.markdown("#### Emotion Classes & Badges")
            for emotion_name in label_map.values():
                emoji = EMOTION_EMOJI.get(emotion_name, "")
                color = EMOTION_COLORS.get(emotion_name, "#6B7280")
                desc = EMOTION_DESCRIPTIONS.get(emotion_name, "")
                st.markdown(
                    f"<div style='margin-bottom: 8px; border-left: 4px solid {color}; padding-left: 10px;'>"
                    f"<strong>{emoji} {emotion_name.capitalize()}</strong> — <span style='opacity: 0.8;'>{desc}</span>"
                    f"</div>",
                    unsafe_allow_html=True,
                )

        st.divider()
        st.markdown("#### Keras Model Layer Summary")
        buf = io.StringIO()
        model.summary(print_fn=lambda x: buf.write(x + "\n"))
        st.code(buf.getvalue(), language="text")

    # -----------------------------------------------------------------------
    # TAB 6: Full-Stack React UI & Deployment Options
    # -----------------------------------------------------------------------
    with tab_fullstack:
        st.subheader("🌐 Deploying DeepFER: Full-Stack UI & Production Options")

        st.markdown(
            """
        DeepFER includes **two distinct deployment modes**:

        ---

        ### 1️⃣ Option A: Streamlit Cloud (Current Setup)
        - **What it runs**: `app.py` directly from your GitHub repository.
        - **Pros**: 1-click deployment, zero server configuration, automatic HTTPS.
        - **How to Deploy**:
            1. Push changes to your GitHub repo.
            2. Go to [share.streamlit.io](https://share.streamlit.io/).
            3. Connect your repo and set main file to `app.py`.

        ---

        ### 2️⃣ Option B: Full-Stack React UI + FastAPI Backend
        - **What it runs**: Built React TypeScript frontend (`frontend/dist`) served by FastAPI (`backend/server.py`).
        - **Features**: Dashboard, Live Video Stream with bounding boxes, Drag-and-Drop Uploader, History Page, Analytics, Settings, and REST API.
        - **Deployment Platforms**:
            - **Render**: Connect repository, set build command to `cd frontend && npm install && npm run build && cd ..`, start command to `python backend/server.py`.
            - **Docker / Hugging Face Spaces / Railway**: Use the included `Dockerfile` in the repository root.

        ```bash
        # Run Full-Stack Locally:
        # Step 1: Build Frontend
        cd frontend
        npm install
        npm run build

        # Step 2: Launch FastAPI Server (serves both API & React UI)
        cd ..
        python backend/server.py
        # Open http://localhost:8000 in your browser!
        ```
        """
        )


if __name__ == "__main__":
    main()
