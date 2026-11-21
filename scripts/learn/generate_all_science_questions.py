import json
import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
PHYSICS_DIR = BASE_DIR / "lib" / "learn" / "content" / "physics"
CHEMISTRY_DIR = BASE_DIR / "lib" / "learn" / "content" / "chemistry"

PHYSICS_DIR.mkdir(parents=True, exist_ok=True)
CHEMISTRY_DIR.mkdir(parents=True, exist_ok=True)

print("Starting generation of authentic, curriculum-aligned Physics & Chemistry inquiry problems...")
