"""A partial or corrupted batch must never create a course overlay."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('assemble-language-course.py')


class DraftAssemblyBoundary(unittest.TestCase):
    def run_case(self, rows, source=None):
        source = source or [
            {'index': 0, 'source': 'Choose 안녕 2 times.', 'sourceHash': 'frozen', 'paths': [['questions', 'q1', 'prompt']]},
            {'index': 1, 'source': 'Hello', 'sourceHash': 'frozen2', 'paths': [['questions', 'q1', 'hints', 0]]},
        ]
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root/'catalog.json').write_text(json.dumps(source))
            translations = root/'translations'
            translations.mkdir()
            (translations/f'korean-course-pcm-0000-{len(rows)-1:04}.json').write_text(json.dumps(rows))
            output = root/'draft.json'
            result = subprocess.run([sys.executable, str(SCRIPT), '--subject', 'korean', '--locale', 'pcm',
                                     '--catalog', str(root/'catalog.json'), '--translations', str(translations),
                                     '--output', str(output)], capture_output=True, text=True)
            return result.returncode, json.loads(output.read_text()) if output.exists() else None

    def records(self):
        return {
            '0': {'sourceHash': 'frozen', 'translation': 'Choose 안녕 2 times.', 'role': 'localized_instruction_or_meaning'},
            '1': {'sourceHash': 'frozen2', 'translation': 'How far', 'role': 'localized_instruction_or_meaning'},
        }

    def test_incomplete_batch_creates_no_overlay(self):
        rows = self.records()
        del rows['1']
        code, output = self.run_case(rows)
        self.assertNotEqual(code, 0)
        self.assertIsNone(output)

    def test_changed_quantity_or_korean_target_creates_no_overlay(self):
        for invalid in ['Choose 안녕 3 times.', 'Choose 감사 2 times.']:
            with self.subTest(invalid=invalid):
                rows = self.records()
                rows['0']['translation'] = invalid
                code, output = self.run_case(rows)
                self.assertNotEqual(code, 0)
                self.assertIsNone(output)

    def test_complete_draft_preserves_hint_array_and_question_identity(self):
        code, output = self.run_case(self.records())
        self.assertEqual(code, 0)
        self.assertEqual(output['questions']['q1'], {'prompt': 'Choose 안녕 2 times.', 'hints': ['How far']})


if __name__ == '__main__':
    unittest.main()
