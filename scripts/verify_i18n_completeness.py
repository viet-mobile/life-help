# -*- coding: utf-8 -*-
"""
scripts/verify_i18n_completeness.py
Scans all 38 json files in messages/ to ensure complete presence of all required keys.
"""
import json
import os

MESSAGES_DIR = os.path.join(os.path.dirname(__file__), "..", "messages")
from patch_missing_i18n import LOCALES

REQUIRED_COMMON = ["detail", "apply", "safeApply", "platformTagline"]
REQUIRED_CUSTOMER = ["priorityEmergency", "lifeSupportTitle", "lifeSupportDesc", "partnerRegisterLink", "reviewLink", "safe050Badge"]
REQUIRED_SERVICE = ["clog", "leakPlumbing", "boiler", "cleaning", "housing", "bankHelp", "insuranceHelp", "jobHelp", "hospitalHelp", "mobileHelp"]
REQUIRED_SERVICE_DESC = REQUIRED_SERVICE
REQUIRED_SERVICE_PROBLEMS = REQUIRED_SERVICE
REQUIRED_SUPPORT = ["badge050", "requestTab", "partnerTab", "safe050Title", "safe050Desc", "phoneInputLabel", "submitBtn"]

def main():
    errors = []
    print(f"Verifying {len(LOCALES)} locale files...")

    for code in LOCALES:
        filepath = os.path.join(MESSAGES_DIR, f"{code}.json")
        if not os.path.exists(filepath):
            errors.append(f"Missing file: {code}.json")
            continue

        with open(filepath, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
            except Exception as e:
                errors.append(f"Corrupt JSON in {code}.json: {e}")
                continue

        # Check sections
        for key in REQUIRED_COMMON:
            if not data.get("common", {}).get(key):
                errors.append(f"[{code}] missing common.{key}")

        for key in REQUIRED_CUSTOMER:
            if not data.get("customer", {}).get(key):
                errors.append(f"[{code}] missing customer.{key}")

        for key in REQUIRED_SERVICE:
            if not data.get("service", {}).get(key):
                errors.append(f"[{code}] missing service.{key}")

        for key in REQUIRED_SERVICE_DESC:
            if not data.get("serviceDesc", {}).get(key):
                errors.append(f"[{code}] missing serviceDesc.{key}")

        for key in REQUIRED_SERVICE_PROBLEMS:
            if not data.get("serviceProblems", {}).get(key):
                errors.append(f"[{code}] missing serviceProblems.{key}")

        for key in REQUIRED_SUPPORT:
            if not data.get("support", {}).get(key):
                errors.append(f"[{code}] missing support.{key}")

    if errors:
        print(f"FAILED with {len(errors)} missing keys:")
        for err in errors[:30]:
            print(f"  - {err}")
        if len(errors) > 30:
            print(f"  ... and {len(errors) - 30} more.")
    else:
        print("PASS! All 38 locales have 100% of required keys in all sections.")

if __name__ == "__main__":
    main()

