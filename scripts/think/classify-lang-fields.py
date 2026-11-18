#!/usr/bin/env python3
"""Assigns every English- and Korean-subject thinking task to one of six fields (English curriculum content areas):
topic = 주제, function = 기능, context = 맥락, strategy = 기술 및 전략, language = 언어지식 (pronunciation, vocabulary, grammar), text = 텍스트.
Output lib/think/lang-fields.json {taskId: field}. Rule order: per-task overrides, then keyword rules on topic (or title), first match wins.
Re-run after adding tasks; tests/think/areas.test.ts fails if a task has no field."""
import json, glob, re, collections, sys
OVERRIDES = {}
RULES = [  # (field, regex) ; text = topic if present else title
 ("language", r"idiom|Hangul|한글|반말|존댓말|speech level|speech\b|register|honorific|ending|connective|Connecting sentences|negation|모두 \.\.\.|-대요|Reported speech|passive|causative|counting words|numbers and prices|time expressions|time words|grammar|Omitted subjects|dropped|-아서|-기 전에|오해를 부르는|애매한|모호|\bshe\b|connector|reporting|ambiguity|ambiguous|-\(|-[가-힣]|Frequency words|Boundaries in rules|boundary words|Time and place conflicts|time \(|^time$"),
 ("function", r"request|refus|declin|invitation|apolog|thanks|greeting|saying no|asking what you need|asking a teacher|Message to a professor|Polite softening|정중하게|거절|부탁|초대에|사과|감사|질문하기|질문 하나|답장|물어|유용한 질문|Indirect refusals|Declining"),
 ("topic", r"family|Shops|Public offices|self-introduction|Introductions|^places$|^time$|^schedules$|Ages and relationships|dates and times|numbers and prices|Ordering food"),
 ("context", r"audience|listener|reader|relationship|titles and|situation|단서|공손|친근|읽는 사람|친구와 선생님|화용|상황에 맞는|어조|함축|Tone and implication|Message chains|Who said what|Writing a relayed|Relationships|Misunderstandings|Repairs|Meeting notes|Workplace"),
 ("text", r"notice|sign|label|message|chat|email|news|headline|review|\bad\b|poster|diary|plan|text|짧은 글|안내문|표지판|간판|이메일|뉴스|기사|논설|사설|연설|리뷰|후기|광고|쪽지|일정|초대장|대화|메시지|articles|letters|blog"),
]
def load():
    t = {}
    for f in glob.glob('lib/think/data/**/*.json', recursive=True):
        try: d = json.load(open(f))
        except Exception: continue
        if isinstance(d, list):
            for x in d:
                if isinstance(x, dict) and x.get('subject') in ('english', 'korean'): t[x['id']] = x
    return t
def classify(t):
    if t['id'] in OVERRIDES: return OVERRIDES[t['id']]
    s = t.get('topic') or t.get('title') or ''
    for f, rx in RULES:
        if re.search(rx, s, re.I): return f
    return 'strategy'
if __name__ == '__main__':
    tasks = load(); out = {i: classify(t) for i, t in sorted(tasks.items())}
    json.dump(out, open('lib/think/lang-fields.json', 'w'), sort_keys=True, indent=0)
    c = collections.Counter(out.values()); print(len(out), dict(c))
    if len(sys.argv) > 1:
        import random; random.seed(int(sys.argv[1]))
        for i in random.sample(sorted(out), 45): print(out[i][:4], i, '|', (tasks[i].get('topic') or '')[:34], '|', tasks[i]['title'][:36])
