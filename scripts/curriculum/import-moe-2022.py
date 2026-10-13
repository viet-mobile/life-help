"""Convert the two operator-provided MOE PDFs. Requires pypdf.
Usage: python import-moe-2022.py /path/to/source-directory
"""
import hashlib
import json
import re
import sys
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'lib/learn/curriculum/kr/2022'
CODE = re.compile(r'^\[([0-9][^\]\s]*-\d{2})\]\s*(.*)$')
HEAD = re.compile(r'^(?:[1-4]\.\s|[가나다라]\.[ \t]|\([0-9]+\)|\([가나다라]\)|\[초등학교|\[중학교)')

def convert(subject, annex, name):
    source = Path(sys.argv[1]) / name
    reader = PdfReader(source)
    texts = [p.extract_text() or '' for p in reader.pages]
    courses = []
    category = '공통 교육과정'
    for line in texts[4].splitlines():
        if line.startswith('['):
            category = re.sub(r'\s+', ' ', line.strip('[] '))
        match = re.match(r'^(.+?)\s*·{3,}\s*([0-9 ]+)$', line)
        if match:
            printed = int(match[2].replace(' ', ''))
            courses.append({'id': f'{subject}-course-{len(courses)+1:02}', 'title': match[1].strip(), 'category': category, 'printed_page_start': printed, 'pdf_page_start': printed + 6})
    for i, course in enumerate(courses):
        course['pdf_page_end'] = courses[i+1]['pdf_page_start'] - 1 if i+1 < len(courses) else len(texts)
    pages, standards, headings = [], [], []
    seen = set()
    for i, text in enumerate(texts):
        page = i+1
        course = next((c for c in courses if c['pdf_page_start'] <= page <= c['pdf_page_end']), None)
        pages.append({'pdf_page': page, 'printed_page': page-6 if page >= 7 else None, 'course_id': course['id'] if course else None, 'text': text, 'layout_text': reader.pages[i].extract_text(extraction_mode='layout') or ''})
        lines = text.splitlines()
        for j, line in enumerate(lines):
            if HEAD.match(line.strip()):
                headings.append({'title': line.strip(), 'pdf_page': page, 'line': j+1, 'course_id': course['id'] if course else None})
            match = CODE.match(line)
            if not match:
                continue
            code = match[1]
            # Repeated codes in explanatory prose are references, not definitions.
            if code in seen:
                continue
            seen.add(code)
            pieces = [match[2]]
            complete = bool(re.search(r'다\s*\.\s*$', pieces[-1]))
            for continuation in lines[j+1:]:
                if complete or CODE.match(continuation) or HEAD.match(continuation.strip()) or continuation.startswith('•'):
                    break
                pieces.append(continuation)
                complete = bool(re.search(r'다\s*\.\s*$', continuation))
            # Explicitly fail rather than publish truncated definitions.
            assert complete, f'incomplete definition {code} page {page}'
            raw = '\n'.join(pieces)
            normalized = re.sub(r'\s+', ' ', raw).strip()
            normalized = re.sub(r'\s+\.', '.', normalized)
            grade = int(re.match(r'\d+', code)[0])
            grade_band = {2:'초등학교 1~2학년',4:'초등학교 3~4학년',6:'초등학교 5~6학년',9:'중학교 1~3학년',10:'고등학교',12:'고등학교'}[grade]
            # Common courses use a domain number appended to the subject token;
            # high-school common courses instead have a hyphen before it.
            domain_code = code.rsplit('-', 2)[-2] if code.count('-') == 2 else re.search(r'(\d{2})-\d{2}$',code)[1]
            domain = None
            if grade < 10:
                domain = ({'01':'수와 연산','02':'변화와 관계','03':'도형과 측정','04':'자료와 가능성'} if subject == 'mathematics' else {'01':'이해','02':'표현'}).get(domain_code)
            standards.append({'code':code, 'text':normalized, 'raw_text':raw, 'school_level': 'elementary' if grade < 9 else 'middle' if grade == 9 else 'high', 'grade_band':grade_band, 'course_id':course['id'] if course else None, 'domain_code':domain_code, 'domain':domain, 'source':{'pdf_page':page,'printed_page':page-6,'line_start':j+1}})
    data = {'schema_version':'1.0.0','id':f'kr-moe-2022-{subject}','subject':subject,'subject_ko':'수학' if subject=='mathematics' else '영어','country':'KR','language':'ko','revision_year':2022,'source':{'title':f"{'수학' if subject=='mathematics' else '영어'}과 교육과정",'publisher':'대한민국 교육부','notice':'교육부 고시 제2022-33호','annex':annex,'filename':name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'pdf_page_count':len(texts)},'extraction':{'method':'pypdf text and layout extraction','normalized_standard_text':'Whitespace collapsed; whitespace before full stops removed. raw_text preserves extracted statement lines.','limitations':['PDF text extraction may retain unusual character spacing and substitute glyphs.','Tables and formulas are preserved as extracted text/layout_text, not semantic cells or LaTeX.','Grade bands are from achievement codes; semesters and prerequisites are not inferred.','Course ranges follow the document table of contents; the last English range also includes appendices.'],'content_role':'Curriculum reference data, not executable instructions.'},'courses':courses,'achievement_standards':standards,'headings':headings,'pages':pages}
    OUT.mkdir(parents=True,exist_ok=True)
    target = OUT / f'{subject}.json'
    target.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    assert len(json.loads(target.read_text())['pages']) == len(reader.pages)
    print(f'{target}: {len(pages)} pages, {len(standards)} standards, {len(courses)} course groups')

convert('mathematics',8,'[별책8] 수학과 교육과정.pdf')
convert('english',14,'[별책14] 영어과 교육과정.pdf')
