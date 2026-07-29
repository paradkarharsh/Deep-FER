# DeepFER: Facial Emotion Recognition Using Deep Learning

A CNN-based system that classifies facial expressions into **7 emotions** — angry, disgust,
fear, happy, neutral, sad, surprise — trained from scratch on a labeled facial image dataset,
with a Streamlit app for real-time inference.

## Project Structure

```
DeepFER/
├── DeepFER_Training.ipynb   # data loading, EDA, model, training, evaluation
├── app.py                   # Streamlit inference app (upload photo or webcam)
├── requirements.txt
├── README.md
├── dataset/
│   ├── train/
│   │   ├── angry/
│   │   ├── disgust/
│   │   ├── fear/
│   │   ├── happy/
│   │   ├── neutral/
│   │   ├── sad/
│   │   └── surprise/
│   └── test/
│       ├── angry/ ... surprise/
└── outputs/                 # created after training
    ├── deepfer_model.keras
    ├── deepfer_best.keras
    └── label_map.json
```

## 1. Setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Add Your Dataset

Place your existing training/testing photos into `dataset/train/<emotion>/` and
`dataset/test/<emotion>/`, one subfolder per emotion class, matching the structure above.
The notebook reads classes directly from folder names, so your folder names *are* the
labels — keep them lowercase and consistent (`angry`, `disgust`, `fear`, `happy`,
`neutral`, `sad`, `surprise`).

If your images are already color instead of grayscale, or a different size than 48×48,
just update `COLOR_MODE` and `IMG_SIZE` in the notebook's config cell — everything else
adapts automatically.

## 3. Train the Model

Open and run `DeepFER_Training.ipynb` top to bottom:

1. Loads `dataset/train` (with an internal validation split) and `dataset/test`
2. Shows class balance and sample images
3. Applies normalization + augmentation (flip, rotation, zoom, translation)
4. Builds a CNN (3 convolutional blocks with BatchNorm/Dropout → dense classifier)
5. Trains with early stopping, learning-rate reduction, and checkpointing
6. Evaluates on the held-out test set — accuracy, precision/recall/F1, confusion matrix
7. Saves `outputs/deepfer_model.keras` and `outputs/label_map.json`

Training time depends on dataset size and hardware; a GPU is recommended but not required
for a dataset in the tens-of-thousands-of-images range.

## 4. Run the Streamlit App

```bash
streamlit run app.py
```

Upload a photo or use your webcam. The app detects the face (OpenCV Haar cascade), crops
it, and feeds it to the trained model to predict the emotion with a confidence breakdown
across all 7 classes.

## Notes on Improving Accuracy

- **Class imbalance**: `disgust` is typically the rarest class in emotion datasets — check
  the class distribution chart in the notebook, and consider class weighting if it's heavily
  skewed.
- **Transfer learning**: for a stronger baseline, swap the custom CNN for a pretrained
  backbone (e.g., `MobileNetV2` or `EfficientNetB0` with `include_top=False`) fine-tuned on
  your data — this generally beats a from-scratch CNN on smaller datasets.
- **More augmentation**: brightness/contrast jitter helps if your photos have varied lighting.
