with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder/build_elementary.py", "r") as f:
    text = f.read()

old_block = '''        if k == 2:
            p = f"빈칸에 알맞은 동사 형태는? (문항 #{k}) 'They ____ in Seoul for three years.'"
            c = "live"
            d = ["lives", "living", "are live"]
            ex = "복수 주어 They의 단순 현재형 동사는 원형 'live'이며, 도시 앞에는 전치사 'in'을 써서 'live in Seoul'이 됩니다."
        else:
            mod = (k - 1) % 4
            if mod == 0:
                p = f"빈칸에 알맞은 동사 형태는? (문항 #{k}) '{name} ____ in Seoul with his family.'"
                c = "lives"
                d = ["live", "living", "is live"]
                ex = f"3인칭 단수 주어 '{name}'의 현재형 동사에는 -s를 붙여 'lives'를 쓰며, 도시명 앞에는 전치사 'in'을 씁니다."
        elif mod == 1:
            p = f"빈칸에 알맞은 동사 형태는? (문항 #{k}) 'My sister ____ English every morning.'"
            c = "studies"
            d = ["study", "studying", "are study"]
            ex = "3인칭 단수 주어 뒤에서 자음+y로 끝나는 동사는 y를 i로 고치고 -es를 붙여 'studies'가 됩니다."
        elif mod == 2:
            p = f"빈칸에 알맞은 동사 형태는? (문항 #{k}) 'They ____ soccer after school every Friday.'"
            c = "play"
            d = ["plays", "playing", "is play"]
            ex = "복수 주어 'They' 뒤에는 동사원형 'play'를 사용합니다."
        else:
            p = f"빈칸에 알맞은 동사 형태는? (문항 #{k}) '{name} ____ to the library on Saturdays.'"
            c = "goes"
            d = ["go", "going", "gone"]
            ex = "3인칭 단수 주어 뒤에서 -o로 끝나는 동사는 -es를 붙여 'goes'로 씁니다."'''

new_block = '''        if k == 2:
            p = f"빈칸에 알맞은 동사 형태는? (문항 #{k}) 'They ____ in Seoul for three years.'"
            c = "live"
            d = ["lives", "living", "are live"]
            ex = "복수 주어 They의 단순 현재형 동사는 원형 'live'이며, 도시 앞에는 전치사 'in'을 써서 'live in Seoul'이 됩니다."
        else:
            mod = (k - 1) % 4
            if mod == 0:
                p = f"빈칸에 알맞은 동사 형태는? (문항 #{k}) '{name} ____ in Seoul with his family.'"
                c = "lives"
                d = ["live", "living", "is live"]
                ex = f"3인칭 단수 주어 '{name}'의 현재형 동사에는 -s를 붙여 'lives'를 쓰며, 도시명 앞에는 전치사 'in'을 씁니다."
            elif mod == 1:
                p = f"빈칸에 알맞은 동사 형태는? (문항 #{k}) 'My sister ____ English every morning.'"
                c = "studies"
                d = ["study", "studying", "are study"]
                ex = "3인칭 단수 주어 뒤에서 자음+y로 끝나는 동사는 y를 i로 고치고 -es를 붙여 'studies'가 됩니다."
            elif mod == 2:
                p = f"빈칸에 알맞은 동사 형태는? (문항 #{k}) 'They ____ soccer after school every Friday.'"
                c = "play"
                d = ["plays", "playing", "is play"]
                ex = "복수 주어 'They' 뒤에는 동사원형 'play'를 사용합니다."
            else:
                p = f"빈칸에 알맞은 동사 형태는? (문항 #{k}) '{name} ____ to the library on Saturdays.'"
                c = "goes"
                d = ["go", "going", "gone"]
                ex = "3인칭 단수 주어 뒤에서 -o로 끝나는 동사는 -es를 붙여 'goes'로 씁니다."'''

assert old_block in text, "old_block not found"
text = text.replace(old_block, new_block)
with open("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder/build_elementary.py", "w") as f:
    f.write(text)
print("Indentation fixed.")
