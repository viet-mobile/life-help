#!/usr/bin/env python3
"""
Syncs AI-generated dialogue illustrations from brain directory into
life-help/public/images/dialogues/ with standardized names: {category}_1.png
"""

import glob
import os
import shutil

BRAIN_DIR = "/Users/juboklee/.gemini/antigravity/brain/3725b963-fd5a-4e26-b6c2-bdb3c91df306"
TARGET_DIR = "/Users/juboklee/life-project/life-help/public/images/dialogues"
os.makedirs(TARGET_DIR, exist_ok=True)

CATEGORIES = [
    ("hospital", ["hospital_pharmacy_dialogue*.jpg", "hospital*.jpg"]),
    ("airport", ["airport*.jpg"]),
    ("store", ["store*.jpg"]),
    ("classroom", ["classroom*.jpg"]),
    ("amusement_park", ["amusement_park*.jpg"]),
    ("restaurant", ["restaurant*.jpg"]),
    ("wedding", ["wedding*.jpg"]),
    ("hotel", ["hotel*.jpg"]),
    ("transport", ["transport*.jpg"]),
    ("bank", ["bank*.jpg"]),
    ("post_office", ["post_office*.jpg"]),
    ("housing", ["housing*.jpg"]),
    ("public_office", ["public_office*.jpg"]),
    ("workplace", ["workplace*.jpg"]),
    ("salon", ["salon*.jpg"]),
    ("lost_found", ["lost_found*.jpg"]),
    ("fitness", ["fitness*.jpg"]),
    ("library_museum", ["library_museum*.jpg"]),
    ("car_rental", ["car_rental*.jpg"]),
]

def sync():
    synced = []
    missing = []
    for cat, patterns in CATEGORIES:
        matched = []
        for pat in patterns:
            matched.extend(glob.glob(os.path.join(BRAIN_DIR, pat)))
        if matched:
            newest = max(matched, key=os.path.getmtime)
            dest_file = os.path.join(TARGET_DIR, f"{cat}_1.png")
            shutil.copy2(newest, dest_file)
            synced.append(cat)
        else:
            missing.append(cat)

    print(f"Synced: {len(synced)} / {len(CATEGORIES)}")
    if missing:
        print(f"Pending: {missing}")
    return len(synced) == len(CATEGORIES)

if __name__ == "__main__":
    sync()

