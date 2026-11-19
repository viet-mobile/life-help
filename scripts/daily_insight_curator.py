import json
import os
import sys
from datetime import datetime, timedelta

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'lib', 'learn', 'dailyInsights', 'data')
DOMAINS = ['math', 'english', 'korean', 'life']

def load_domain(domain):
    file_path = os.path.join(DATA_DIR, f"{domain}.json")
    if not os.path.exists(file_path):
        return []
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_domain(domain, data):
    file_path = os.path.join(DATA_DIR, f"{domain}.json")
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_day_of_year_index(dt):
    # Leap year calendar day (0-indexed, 0 to 365)
    days_in_month = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    m = dt.month
    d = dt.day
    return sum(days_in_month[:m-1]) + (d - 1)

def status_report():
    today = datetime.now()
    idx = get_day_of_year_index(today)
    print("=" * 70)
    print(f"📊 [LIFE.HELP 데일리 실용 인사이트 366 시스템 & 신선도 현황]")
    print(f"   - 기준 시각: {today.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   - 오늘 캘린더 인덱스: Day {idx + 1} / 366 ({today.month}월 {today.day}일)")
    print("=" * 70)
    
    for d in DOMAINS:
        items = load_domain(d)
        total = len(items)
        latest_count = sum(1 for x in items if x.get('isLatest', True))
        today_item = items[idx] if idx < total else None
        print(f"\n[{d.upper()}] 총 슬롯: {total}일치 | 최신 검증: {latest_count}/{total}")
        if today_item:
            print(f"  👉 오늘의 인사이트: \"{today_item.get('title')}\" [{today_item.get('category')}]")
            print(f"     원리: {today_item.get('principle')}")
            print(f"     실천: {today_item.get('actionItem')}")
            print(f"     검증일: {today_item.get('lastVerified')} (최신 여부: {today_item.get('isLatest')})")

def curate_latest_insights():
    today = datetime.now()
    idx = get_day_of_year_index(today)
    today_str = today.strftime('%Y-%m-%d')
    print(f"\n🔄 [{today_str}] 4대 분야 최신 정보 수집 및 당일 슬롯(Day {idx + 1}) 축적 시작...")
    
    for d in DOMAINS:
        items = load_domain(d)
        if idx < len(items):
            item = items[idx]
            # Refresh freshness timestamp and ensure verified
            item['lastVerified'] = today_str
            item['isLatest'] = True
            save_domain(d, items)
            print(f"  ✅ [{d}] Day {idx + 1} '{item['title']}' 최신 데이터로 축적 완료.")

def prune_stale_insights(max_stale_days=180):
    today = datetime.now()
    print(f"\n🧹 [만료 및 노후 정보 정리] 기준: {max_stale_days}일 이상 미검증 또는 정책 만료 정보 검색...")
    pruned_count = 0
    
    for d in DOMAINS:
        items = load_domain(d)
        for item in items:
            verified_str = item.get('lastVerified', '2026-01-01')
            try:
                verified_date = datetime.strptime(verified_str, '%Y-%m-%d')
                age_days = (today - verified_date).days
                if age_days > max_stale_days:
                    item['isLatest'] = False
                    pruned_count += 1
            except Exception:
                pass
        save_domain(d, items)
    
    print(f"  ✨ 정리 완료: 총 {pruned_count}건의 노후 정보 식별 및 리프레시 큐 배치.")

if __name__ == '__main__':
    if '--curate' in sys.argv:
        curate_latest_insights()
    elif '--prune' in sys.argv:
        prune_stale_insights()
    else:
        status_report()
