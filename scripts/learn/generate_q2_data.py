import json
import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
Q2_DIR = BASE_DIR / "lib" / "learn" / "dailyInsights" / "data" / "q2"
Q2_DIR.mkdir(parents=True, exist_ok=True)

print("Q2 Directory ready:", Q2_DIR)
