# One-off correction found by a translator: n-m-h3-serieslim-06 s2 option b explanation said the sum "cannot be NOT smaller than the first term" (backwards).
# Fixes the Korean source and sets the translation in every language that has an overlay entry. Idempotent.
import json,os
KO_OLD="첫째항이 합보다 크려면 어떤 항은 음수여야 해요. 모든 항이 양수이면 합이 첫째항보다 작지 않을 수 없어요."
KO_NEW="첫째항이 합보다 크려면 어떤 항은 음수여야 해요. 모든 항이 양수이면 합은 첫째항보다 작을 수 없어요."
TR={"vi":"Để số hạng đầu lớn hơn tổng thì phải có một số hạng âm. Nếu mọi số hạng đều dương thì tổng không thể nhỏ hơn số hạng đầu.",
"zh-Hant":"要讓首項大於和，必須有某一項是負數。若所有項都是正數，和不可能小於首項。",
"zh-Hans":"要让首项大于和，必须有某一项是负数。若所有项都是正数，和不可能小于首项。",
"en":"For the first term to exceed the sum, some term must be negative. If all terms are positive, the sum cannot be smaller than the first term.",
"ja":"初項が和より大きくなるには、どれかの項が負でなければなりません。すべての項が正なら、和は初項より小さくなることはありません。"}
f="lib/think/data/extra/math-h3-n1.json"; d=json.load(open(f)); n=0
for t in d:
    if t["id"]!="n-m-h3-serieslim-06": continue
    for s in t["steps"]:
        for o in s.get("options",[]):
            if o.get("reveals")==KO_OLD: o["reveals"]=KO_NEW; n+=1
json.dump(d,open(f,"w"),indent=1)
m=0
for lang,txt in TR.items():
    p=f"lib/think/i18n/{lang}/math-h3-n1.json"
    if not os.path.exists(p): continue
    ov=json.load(open(p)); e=ov.get("n-m-h3-serieslim-06")
    if e is not None and "s.s2.r.b" in e: e["s.s2.r.b"]=txt; m+=1; json.dump(ov,open(p,"w"),ensure_ascii=False,separators=(",",":"))
print("source fixed:",n,"translations set:",m)
