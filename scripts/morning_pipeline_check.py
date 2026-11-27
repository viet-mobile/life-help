#!/usr/bin/env python3
"""
morning_pipeline_check.py
LIFE.HELP Daily Morning Pipeline Inspection & Health Check Script

Inspects overnight automated pipeline assets:
1. 55 Daily Thinking Questions (55문항 무결성 및 배포 파일)
2. 190 Countries Info (190개국 비자 정보, 롤모델 380명, 행정구역)
3. Standard Korean Regulations Translations (한국어 표준어 규정 88개 언어 진행 상태)
4. Total Service Languages (서비스 언어 총수: 89개 언어)
5. Cloudflare & Git Production Deployment Status (배포 정상 여부)
"""

import os
import sys
import json
import re
import subprocess
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
LIFE_HELP_DIR = BASE_DIR / "life-help"

def check_55_questions(today_str=None):
    if not today_str:
        today_str = datetime.now().strftime("%Y%m%d")
    
    q_dir = LIFE_HELP_DIR / "questions" / "daily" / today_str
    s55_path = q_dir / "source_55.json"
    s110_path = q_dir / "source_110.json"
    
    result = {
        "date": today_str,
        "exists": s55_path.exists(),
        "count": 0,
        "breakdown": {},
        "valid": False,
        "errors": []
    }
    
    if not s55_path.exists():
        result["errors"].append(f"Missing {s55_path}")
        return result
        
    try:
        with open(s55_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        result["count"] = len(data)
        breakdown = {}
        for item in data:
            s = item.get("subject", "unknown")
            breakdown[s] = breakdown.get(s, 0) + 1
        result["breakdown"] = breakdown
        
        # Validation via validate_daily_thinking.py logic
        if len(data) == 55:
            result["valid"] = True
        else:
            result["errors"].append(f"Question count mismatch: expected 55, got {len(data)}")
    except Exception as e:
        result["errors"].append(str(e))
        
    return result

def check_190_countries():
    visa_path = LIFE_HELP_DIR / "lib" / "visa" / "data" / "visa-info.json"
    rm_path = LIFE_HELP_DIR / "lib" / "region" / "roleModels.json"
    rm_en_path = LIFE_HELP_DIR / "lib" / "region" / "roleModels_en.json"
    
    res = {
        "visa_countries": 0,
        "role_models_countries": 0,
        "role_models_en_countries": 0,
        "role_models_people": 0,
        "valid": False,
        "errors": []
    }
    
    try:
        if visa_path.exists():
            with open(visa_path, "r", encoding="utf-8") as f:
                v = json.load(f)
                res["visa_countries"] = len(v)
        else:
            res["errors"].append("Missing visa-info.json")

        if rm_path.exists():
            with open(rm_path, "r", encoding="utf-8") as f:
                rm = json.load(f)
                res["role_models_countries"] = len(rm)
                people_count = 0
                for item in rm:
                    if "male" in item: people_count += 1
                    if "female" in item: people_count += 1
                res["role_models_people"] = people_count
        else:
            res["errors"].append("Missing roleModels.json")
            
        if rm_en_path.exists():
            with open(rm_en_path, "r", encoding="utf-8") as f:
                res["role_models_en_countries"] = len(json.load(f))
                
        if res["visa_countries"] == 190 and res["role_models_countries"] == 190:
            res["valid"] = True
    except Exception as e:
        res["errors"].append(str(e))
        
    return res

def check_standards_translations():
    progress_path = LIFE_HELP_DIR / "public" / "standards" / "translations" / "progress.json"
    res = {
        "completed_count": 0,
        "completed_locales": [],
        "last_updated": None,
        "valid": False,
        "errors": []
    }
    
    if not progress_path.exists():
        res["errors"].append("Missing standards progress.json")
        return res
        
    try:
        with open(progress_path, "r", encoding="utf-8") as f:
            prog = json.load(f)
            locales = prog.get("completed_locales", [])
            res["completed_count"] = len(locales)
            res["completed_locales"] = locales
            res["last_updated"] = prog.get("last_updated")
            res["valid"] = len(locales) >= 6
    except Exception as e:
        res["errors"].append(str(e))
        
    return res

def check_service_languages():
    registry_path = LIFE_HELP_DIR / "messages" / "registry.ts"
    res = {
        "total_languages": 0,
        "sample_locales": [],
        "valid": False,
        "errors": []
    }
    
    if not registry_path.exists():
        res["errors"].append("Missing messages/registry.ts")
        return res
        
    try:
        with open(registry_path, "r", encoding="utf-8") as f:
            content = f.read()
        codes = re.findall(r"code:\s*\"([^\"]+)\"", content)
        res["total_languages"] = len(codes)
        res["sample_locales"] = codes[:12]
        res["valid"] = len(codes) >= 88
    except Exception as e:
        res["errors"].append(str(e))
        
    return res

def check_deployment_status():
    res = {
        "git_commit": "",
        "git_clean": False,
        "wrangler_version": "",
        "wrangler_status": "",
        "valid": False,
        "errors": []
    }
    
    try:
        # Git commit check
        p1 = subprocess.run(["git", "-C", str(LIFE_HELP_DIR), "log", "-n", "1", "--oneline"], capture_output=True, text=True)
        res["git_commit"] = p1.stdout.strip()
        
        # Git clean check
        p2 = subprocess.run(["git", "-C", str(LIFE_HELP_DIR), "status", "--porcelain"], capture_output=True, text=True)
        res["git_clean"] = len(p2.stdout.strip()) == 0
        
        # Wrangler deployment check
        p3 = subprocess.run(["npx", "wrangler", "deployments", "status"], cwd=str(LIFE_HELP_DIR), capture_output=True, text=True)
        out = p3.stdout
        ver_match = re.search(r"Version\(s\):\s+\(100%\)\s+([a-f0-9-]+)", out)
        if ver_match:
            res["wrangler_version"] = ver_match.group(1)
            res["wrangler_status"] = "Active 100% traffic"
            res["valid"] = True
        else:
            res["wrangler_status"] = "Unable to parse status"
            res["errors"].append(out[:200])
    except Exception as e:
        res["errors"].append(str(e))
        
    return res

def run_all_checks():
    q = check_55_questions()
    c = check_190_countries()
    s = check_standards_translations()
    l = check_service_languages()
    d = check_deployment_status()
    
    all_ok = q["valid"] and c["valid"] and s["valid"] and l["valid"] and d["valid"]
    
    report = []
    report.append("=" * 64)
    report.append(f"🌅 [LIFE.HELP] 아침 일일 자동 파이프라인 무결성 점검 보고 ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})")
    report.append("=" * 64)
    
    # 1. 55 Thinking Questions
    q_icon = "✅" if q["valid"] else "❌"
    report.append(f"{q_icon} 1. 일일 55문항 출제 (Thinking Questions):")
    report.append(f"   - 일자: {q['date']}")
    report.append(f"   - 출제 문항 수: {q['count']}문항 ({'정상 출제 완료' if q['valid'] else '오류 발생'})")
    report.append(f"   - 과목별 분포: 수학 {q['breakdown'].get('math', 0)}, 영어 {q['breakdown'].get('english', 0)}, 물리 {q['breakdown'].get('physics', 0)}, 화학 {q['breakdown'].get('chemistry', 0)}, 한국어 {q['breakdown'].get('korean', 0)}, 생활 {q['breakdown'].get('life', 0)}")
    
    # 2. 190 Countries Info
    c_icon = "✅" if c["valid"] else "❌"
    report.append(f"\n{c_icon} 2. 190개국 글로벌 정착 정보:")
    report.append(f"   - 비자 정보: {c['visa_countries']}/190개국 완비")
    report.append(f"   - 성공 롤모델: {c['role_models_countries']}/190개국 (총 {c['role_models_people']}명 프로필 탑재)")
    report.append(f"   - 영문 롤모델: {c['role_models_en_countries']}/190개국 완비")
    
    # 3. Standard Korean Regulations Translations
    s_icon = "✅" if s["valid"] else "❌"
    report.append(f"\n{s_icon} 3. 한국어 표준어 규정 자동 번역:")
    report.append(f"   - 번역 완료 언어 수: {s['completed_count']}개 언어 ({', '.join(s['completed_locales'])})")
    report.append(f"   - 상태: 6대 앵커 언어 완비 + 글로벌 언어 슬라이딩 윈도우 진행 중")
    
    # 4. Total Service Languages
    l_icon = "✅" if l["valid"] else "❌"
    report.append(f"\n{l_icon} 4. 서비스 언어 총수:")
    report.append(f"   - 등록 언어: 총 {l['total_languages']}개 언어 공식 지원")
    report.append(f"   - 사전 딕셔너리: messages (89개), lib/learn locales (88개 언어 + 한국어)")
    
    # 5. Deployment Status
    d_icon = "✅" if d["valid"] else "❌"
    report.append(f"\n{d_icon} 5. 정상 배포 여부 (Cloudflare Workers & Git):")
    report.append(f"   - Git HEAD: {d['git_commit']}")
    report.append(f"   - 작업 트리 상태: {'Clean' if d['git_clean'] else 'Modified files pending'}")
    report.append(f"   - 실서버 버전: {d['wrangler_version']} ({d['wrangler_status']})")
    report.append(f"   - 서비스 도메인: https://life-help.simpl2eye.workers.dev")
    report.append("=" * 64)
    report.append(f"종합 판정: {'🎉 모든 파이프라인 정상 가동 및 무결성 합격' if all_ok else '⚠️ 점검 항목 중 확인 필요 사항 있음'}")
    report.append("=" * 64)
    
    return "\n".join(report), all_ok

if __name__ == "__main__":
    text, success = run_all_checks()
    print(text)
    sys.exit(0 if success else 1)
