#!/usr/bin/env python3
"""
Merge and Validate Translated Standards Assets
Checks scratch translation files, validates zero boilerplates, and merges into public/standards/*.json.
"""

import json
import os
import re
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
STANDARDS_DIR = BASE_DIR / "public" / "standards"
SCRATCH_DIR = BASE_DIR / "scratch"

BOILERPLATES = [
    'Detailed standardization regulation regarding',
    'However, Detailed standardization regulation regarding',
    '該当内容に関する詳細な標準化規定',
    'ただし、該当内容に関する詳細な標準化規定',
    '关于该内容的详细标准化规定',
    '但是，关于该内容的详细标准化规定',
    '關於該內容的詳細標準化規定',
    '但是，關於該內容的詳細標準化規定',
    'Chú thích quy chuẩn:',
    'Standard usage note:',
    '用例及备注说明：',
    '連語・助数詞などの結合例：',
    'Kết hợp với các từ/đơn vị:',
    "nghĩa từ vựng '",
    "lexical meaning of '",
    "語彙「",
    "词汇 '",
    "詞彙 '"
]

def check_file_status():
    files = {
        'notes': SCRATCH_DIR / 'translated_notes.json',
        'meanings_p1': SCRATCH_DIR / 'translated_meanings_p1.json',
        'meanings_p2': SCRATCH_DIR / 'translated_meanings_p2.json',
        'comm_p1': SCRATCH_DIR / 'translated_commentary_p1.json',
        'comm_p2': SCRATCH_DIR / 'translated_commentary_p2.json'
    }
    status = {k: v.exists() and v.stat().st_size > 100 for k, v in files.items()}
    return status, files

def merge_notes(notes_file):
    with open(notes_file, 'r', encoding='utf-8') as f:
        new_notes = json.load(f)
    orig_path = STANDARDS_DIR / 'note_translations.json'
    with open(orig_path, 'r', encoding='utf-8') as f:
        notes = json.load(f)
    
    merged_count = 0
    for k, v in new_notes.items():
        if k in notes:
            notes[k].update(v)
            merged_count += 1
        else:
            notes[k] = v
            merged_count += 1
            
    with open(orig_path, 'w', encoding='utf-8') as f:
        json.dump(notes, f, ensure_ascii=False, indent=2)
    print(f'✅ Merged {merged_count} note translations into {orig_path.name}')

def merge_meanings(p1_file, p2_file):
    merged_meanings = {}
    if p1_file.exists():
        with open(p1_file, 'r', encoding='utf-8') as f:
            merged_meanings.update(json.load(f))
    if p2_file.exists():
        with open(p2_file, 'r', encoding='utf-8') as f:
            merged_meanings.update(json.load(f))
            
    orig_path = STANDARDS_DIR / 'word_meanings.json'
    with open(orig_path, 'r', encoding='utf-8') as f:
        orig = json.load(f)
        
    for k, v in merged_meanings.items():
        if k in orig:
            orig[k].update(v)
        else:
            orig[k] = v
            
    with open(orig_path, 'w', encoding='utf-8') as f:
        json.dump(orig, f, ensure_ascii=False, indent=2)
    print(f'✅ Merged {len(merged_meanings)} word meanings into {orig_path.name}')

def merge_commentary(p1_file, p2_file):
    items = []
    if p1_file.exists():
        with open(p1_file, 'r', encoding='utf-8') as f:
            items.extend(json.load(f))
    if p2_file.exists():
        with open(p2_file, 'r', encoding='utf-8') as f:
            items.extend(json.load(f))
            
    orig_path = STANDARDS_DIR / 'commentary_paragraphs.json'
    with open(orig_path, 'r', encoding='utf-8') as f:
        comm = json.load(f)
        
    updated = 0
    for it in items:
        art_id = it['art_id']
        p_idx = it['p_idx']
        if art_id in comm and p_idx < len(comm[art_id]):
            target = comm[art_id][p_idx]
            for l in ['en', 'ja', 'zh-Hans', 'zh-Hant']:
                if l in it and it[l]:
                    target[l] = it[l]
            updated += 1
            
    with open(orig_path, 'w', encoding='utf-8') as f:
        json.dump(comm, f, ensure_ascii=False, indent=2)
    print(f'✅ Merged {updated} commentary paragraphs into {orig_path.name}')

def validate_all():
    comm_path = STANDARDS_DIR / 'commentary_paragraphs.json'
    with open(comm_path, 'r', encoding='utf-8') as f:
        comm = json.load(f)
        
    comm_bp_count = 0
    for art_id, paras in comm.items():
        for p in paras:
            for l in ['en', 'ja', 'zh-Hans', 'zh-Hant']:
                val = p.get(l, '')
                if any(bp in val for bp in BOILERPLATES):
                    comm_bp_count += 1
                    
    print(f'🔍 Validation commentary boilerplates remaining: {comm_bp_count}')
    return comm_bp_count == 0

if __name__ == '__main__':
    status, files = check_file_status()
    print('Current Scratch Status:', status)
    if status['notes']:
        merge_notes(files['notes'])
    if status['meanings_p1'] and status['meanings_p2']:
        merge_meanings(files['meanings_p1'], files['meanings_p2'])
    if status['comm_p1'] and status['comm_p2']:
        merge_commentary(files['comm_p1'], files['comm_p2'])
    validate_all()
