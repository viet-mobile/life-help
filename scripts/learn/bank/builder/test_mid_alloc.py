alloc = {
    # M1
    "e.vocab": 226,
    "e.be": 171,
    "e.pres": 181,
    "e.plural": 181,
    "e.order": 191,
    # M2
    "e.m2.perf": 251,
    "e.m2.pass": 251,
    "e.m2.inf": 241,
    "e.m2.comp": 211,
    "e.m2.read": 231,
    # M3
    "e.m3.rel": 261,
    "e.m3.cond": 236,
    "e.m3.ques": 231,
    "e.m3.part": 226,
    "e.m3.read": 241
}
total = sum(alloc.values())
print("Total middle questions:", total)
assert total == 3330
