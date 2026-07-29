"""
DeepFER — Real-Time Live Webcam Emotion Recognition (OpenCV Desktop App)
-------------------------------------------------------------------------
Runs real-time facial emotion recognition directly in a native desktop window.

Run with:
    python webcam_demo.py
Press 'q' or ESC to exit.
"""

import json
import cv2
import numpy as np
import tensorflow as tf

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "outputs" / "deepfer_model.keras"
LABEL_MAP_PATH = BASE_DIR / "outputs" / "label_map.json"
IMG_SIZE = (48, 48)

print("Loading model and assets...")
model = tf.keras.models.load_model(str(MODEL_PATH))
with open(LABEL_MAP_PATH) as f:
    label_map = {int(k): v for k, v in json.load(f).items()}

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# Use Camera Index 1 (RGB Webcam) with DirectShow on Windows
cam_index = 1
cap = cv2.VideoCapture(cam_index, cv2.CAP_DSHOW)
if not cap.isOpened():
    print(f"Camera index {cam_index} failed, trying camera index 0...")
    cam_index = 0
    cap = cv2.VideoCapture(cam_index, cv2.CAP_DSHOW)

if not cap.isOpened():
    print("Error: Could not access any camera. Check if another app is using it.")
    exit(1)

# Warm up camera
for _ in range(10):
    cap.read()

print(f"Starting live webcam feed (Camera Index {cam_index}). Press 'q' to quit.")

while True:
    ret, frame = cap.read()
    if not ret or frame is None:
        print("Failed to capture frame.")
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))

    for (x, y, w, h) in faces:
        face_crop = gray[y:y + h, x:x + w]
        if face_crop.size == 0:
            continue
        face_crop = cv2.resize(face_crop, IMG_SIZE).astype("float32") / 255.0
        face_crop = np.expand_dims(face_crop, axis=(0, -1))

        preds = model.predict(face_crop, verbose=0)[0]
        idx = int(np.argmax(preds))
        label = label_map[idx]
        confidence = float(preds[idx])

        color = (0, 255, 0)
        cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
        text = f"{label.capitalize()} ({confidence * 100:.0f}%)"
        cv2.putText(frame, text, (x, max(y - 10, 20)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

    cv2.imshow("DeepFER Real-Time Emotion Detection", frame)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q') or key == 27:
        break

cap.release()
cv2.destroyAllWindows()
print("Webcam feed closed.")
