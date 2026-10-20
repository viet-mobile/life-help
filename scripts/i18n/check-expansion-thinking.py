"""Audit explicit learner-field coverage; missing translations fail, never use English fallback.

Requires the private source export from export-expansion-thinking.mts. This is a
coverage check, not meaning approval, and includes source drafts without publishing them.
"""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--source', required=True)
parser.add_argument('--report', required=True)
args = parser.parse_args()
source = Path(args.source)
inventory = json.loads((source / 'inventory.json').read_text())
report = {'scope': 'ALL_AUTHORED_THINKING_TASKS_INCLUDING_DRAFTS',
          'meaningReview': 'NOT_ESTABLISHED_BY_THIS_CHECK', 'locales': {}}
for locale in ['pcm', 'tl', 'ro', 'fi', 'cs', 'hu', 'af']:
    required = present = complete = total = 0
    missing_files = []
    for entry in inventory['files']:
        file = source / (entry['key'] + '.json')
        if hashlib.sha256(file.read_bytes()).hexdigest() != entry['sha256']:
            raise ValueError('Stale source inventory: ' + str(file))
        packet = json.loads(file.read_text())
        overlay_file = ROOT / 'lib/think/i18n' / locale / (entry['key'] + '.json')
        overlay = json.loads(overlay_file.read_text()) if overlay_file.exists() else {}
        if not overlay_file.exists():
            missing_files.append(entry['key'])
        tasks = {}
        for row in packet['rows']:
            value = overlay.get(row['id'], {}).get(row['path'])
            exists = isinstance(value, str) and bool(value.strip())
            required += 1
            present += int(exists)
            tasks.setdefault(row['id'], []).append(exists)
        total += len(tasks)
        complete += sum(all(fields) for fields in tasks.values())
    report['locales'][locale] = {'requiredFields': required, 'presentFields': present,
                                'missingFields': required - present, 'sourceTasks': total,
                                'explicitlyCoveredTasks': complete, 'missingFiles': missing_files}
report['coveragePass'] = all(r['missingFields'] == 0 for r in report['locales'].values())
Path(args.report).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'coveragePass': report['coveragePass'], 'locales': {
    key: {k: v for k, v in row.items() if k != 'missingFiles'}
    for key, row in report['locales'].items()}}, indent=2))
raise SystemExit(0 if report['coveragePass'] else 1)
