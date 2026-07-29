import os
from PIL import Image

CLASSES = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
DATASET_DIR = "dataset"

print("=" * 50)
print("  DeepFER Dataset Verification & Class Balance Audit")
print("=" * 50)

def audit_split(split_name):
    split_dir = os.path.join(DATASET_DIR, split_name)
    if not os.path.exists(split_dir):
        print(f"Error: Directory '{split_dir}' not found!")
        return 0, {}
    
    counts = {}
    sample_sizes = set()
    total_imgs = 0
    
    for cls in CLASSES:
        cls_dir = os.path.join(split_dir, cls)
        if not os.path.exists(cls_dir):
            counts[cls] = 0
            continue
        files = [f for f in os.listdir(cls_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        counts[cls] = len(files)
        total_imgs += len(files)
        
        # Spot check dimensions on up to 5 images
        for f in files[:5]:
            img_path = os.path.join(cls_dir, f)
            try:
                with Image.open(img_path) as img:
                    sample_sizes.add(img.size)  # (width, height)
            except Exception:
                pass
                
    print(f"\n--- Split: '{split_name}' (Total: {total_imgs} images) ---")
    for cls in CLASSES:
        print(f"  - {cls:<10}: {counts[cls]:>6} images")
    print(f"Sample image resolutions (WxH): {list(sample_sizes)}")
    return total_imgs, counts

train_total, train_counts = audit_split("train")
test_total, test_counts = audit_split("test")

print("\n" + "=" * 50)
print(f"GRAND TOTAL: {train_total + test_total} images across train & test splits.")
print("=" * 50)
