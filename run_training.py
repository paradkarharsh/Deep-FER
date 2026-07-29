import os
import json
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
from sklearn.metrics import classification_report, confusion_matrix

print("=" * 60)
print("  DeepFER Model Training & Evaluation Execution")
print("=" * 60)

SEED = 42
tf.random.set_seed(SEED)
np.random.seed(SEED)

TRAIN_DIR = "dataset/train"
TEST_DIR = "dataset/test"

IMG_SIZE = (48, 48)
BATCH_SIZE = 64
COLOR_MODE = "grayscale"
VAL_SPLIT = 0.15
EPOCHS = 35  # Full training execution


print(f"\n1. Loading dataset from '{TRAIN_DIR}' and '{TEST_DIR}'...")
train_ds = tf.keras.utils.image_dataset_from_directory(
    TRAIN_DIR,
    validation_split=VAL_SPLIT,
    subset="training",
    seed=SEED,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    color_mode=COLOR_MODE,
    label_mode="categorical",
)

val_ds = tf.keras.utils.image_dataset_from_directory(
    TRAIN_DIR,
    validation_split=VAL_SPLIT,
    subset="validation",
    seed=SEED,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    color_mode=COLOR_MODE,
    label_mode="categorical",
)

test_ds = tf.keras.utils.image_dataset_from_directory(
    TEST_DIR,
    shuffle=False,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    color_mode=COLOR_MODE,
    label_mode="categorical",
)

class_names = train_ds.class_names
NUM_CLASSES = len(class_names)
print(f"Classes ({NUM_CLASSES}): {class_names}")

AUTOTUNE = tf.data.AUTOTUNE
normalization_layer = layers.Rescaling(1. / 255)

data_augmentation = tf.keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.08),
    layers.RandomZoom(0.1),
    layers.RandomTranslation(0.05, 0.05),
])

def prepare(ds, training=False):
    ds = ds.map(lambda x, y: (normalization_layer(x), y), num_parallel_calls=AUTOTUNE)
    if training:
        ds = ds.map(lambda x, y: (data_augmentation(x, training=True), y), num_parallel_calls=AUTOTUNE)
    return ds.cache().prefetch(buffer_size=AUTOTUNE)

print("\n2. Preprocessing & dataset pipelines...")
train_ds_prepped = prepare(train_ds, training=True)
val_ds_prepped = prepare(val_ds, training=False)
test_ds_prepped = prepare(test_ds, training=False)

def build_model(input_shape, num_classes):
    inputs = layers.Input(shape=input_shape)

    x = layers.Conv2D(32, 3, padding="same", activation="relu")(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.Conv2D(32, 3, padding="same", activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D()(x)
    x = layers.Dropout(0.25)(x)

    x = layers.Conv2D(64, 3, padding="same", activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Conv2D(64, 3, padding="same", activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D()(x)
    x = layers.Dropout(0.25)(x)

    x = layers.Conv2D(128, 3, padding="same", activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Conv2D(128, 3, padding="same", activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D()(x)
    x = layers.Dropout(0.3)(x)

    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.5)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    return models.Model(inputs, outputs, name="DeepFER_CNN")

CHANNELS = 1 if COLOR_MODE == "grayscale" else 3
model = build_model((IMG_SIZE[0], IMG_SIZE[1], CHANNELS), NUM_CLASSES)
print("\n3. Model architecture built:")
model.summary()

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    loss="categorical_crossentropy",
    metrics=["accuracy"],
)

from sklearn.utils.class_weight import compute_class_weight

# Calculate class weights for dataset imbalance
y_train_labels = []
for _, y_batch in train_ds:
    y_train_labels.extend(np.argmax(y_batch.numpy(), axis=1))

class_weights = compute_class_weight(
    class_weight="balanced",
    classes=np.unique(y_train_labels),
    y=y_train_labels
)
class_weight_dict = dict(enumerate(class_weights))
print(f"Calculated class weights: {class_weight_dict}")

os.makedirs("outputs", exist_ok=True)
cb_list = [
    callbacks.EarlyStopping(monitor="val_accuracy", patience=8, restore_best_weights=True),
    callbacks.ModelCheckpoint("outputs/deepfer_best.keras", monitor="val_accuracy", save_best_only=True),
    callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, min_lr=1e-6),
]

print(f"\n4. Training model for {EPOCHS} epochs...")
history = model.fit(
    train_ds_prepped,
    validation_data=val_ds_prepped,
    epochs=EPOCHS,
    callbacks=cb_list,
    class_weight=class_weight_dict,
    verbose=2,
)


print("\n5. Evaluating on held-out test set...")
test_loss, test_acc = model.evaluate(test_ds_prepped)
print(f"--> Test Accuracy: {test_acc * 100:.2f}% | Test Loss: {test_loss:.4f}")

y_true, y_pred = [], []
for images, labels in test_ds_prepped:
    preds = model.predict(images, verbose=0)
    y_true.extend(np.argmax(labels.numpy(), axis=1))
    y_pred.extend(np.argmax(preds, axis=1))

print("\nClassification Report:")
print(classification_report(y_true, y_pred, target_names=class_names))

print("\n6. Saving final trained model and label map to 'outputs/'...")
model.save("outputs/deepfer_model.keras")
label_map = {i: name for i, name in enumerate(class_names)}
with open("outputs/label_map.json", "w") as f:
    json.dump(label_map, f, indent=2)

print("Saved: outputs/deepfer_model.keras")
print("Saved: outputs/label_map.json")
print("=" * 60)
