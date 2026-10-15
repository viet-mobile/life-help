with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder/build_high_expanded.py", "r") as f:
    text = f.read()

text = text.replace("for k in range(1, 257):", "for k in range(1, 237):") # par: 236
text = text.replace('generate_and_add("H3", "e.h3.par", h3_par_items, 256)', 'generate_and_add("H3", "e.h3.par", h3_par_items, 236)')

text = text.replace("for k in range(1, 212):", "for k in range(1, 192):") # tone: 191
text = text.replace('generate_and_add("H3", "e.h3.tone", h3_tone_items, 211)', 'generate_and_add("H3", "e.h3.tone", h3_tone_items, 191)')

text = text.replace("for k in range(1, 262):", "for k in range(1, 242):") # ins: 241
text = text.replace('generate_and_add("H3", "e.h3.ins", h3_ins_items, 261)', 'generate_and_add("H3", "e.h3.ins", h3_ins_items, 241)')

text = text.replace("for k in range(1, 217):", "for k in range(1, 197):") # col: 196
text = text.replace('generate_and_add("H3", "e.h3.col", h3_col_items, 216)', 'generate_and_add("H3", "e.h3.col", h3_col_items, 196)')

text = text.replace("for k in range(1, 242):", "for k in range(1, 222):") # sum: 221
text = text.replace('generate_and_add("H3", "e.h3.sum", h3_sum_items, 241)', 'generate_and_add("H3", "e.h3.sum", h3_sum_items, 221)')

with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder/build_high_expanded.py", "w") as f:
    f.write(text)
print("Adjusted H3 in build_high_expanded.py")
