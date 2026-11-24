with open("life-help/components/learn/DailyInsightCard.tsx", "r", encoding="utf-8") as f:
    text = f.read()

bad = """  const getBaseId = (id?: string): string => {
    if (!id) return "";
    const m = id.match(/^([a-z]+)-(\\d+)$/);
    if (!m) return id;
    const num = parseInt(m[2], 10);
    const baseNum = ((num - 1) % 36) + 1;
    return ;
  };"""

good = """  const getBaseId = (id?: string): string => {
    if (!id) return "";
    const m = id.match(/^([a-z]+)-(\\d+)$/);
    if (!m) return id;
    const num = parseInt(m[2], 10);
    const baseNum = ((num - 1) % 36) + 1;
    return `${m[1]}-${String(baseNum).padStart(3, "0")}`;
  };"""

if bad in text:
    text = text.replace(bad, good)
    with open("life-help/components/learn/DailyInsightCard.tsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("Fixed DailyInsightCard getBaseId return")
else:
    print("Pattern not found!")
