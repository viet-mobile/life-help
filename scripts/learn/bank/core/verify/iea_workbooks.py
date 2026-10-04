"""
Independent verification of the IEA (TIMSS / PIRLS 2011) rows against the official released-item statistics workbooks.
  python iea_workbooks.py <TIMSS_G4.xlsx> <TIMSS_G8.xlsx> <PIRLS.xlsx> <items.csv> <out.json>
Reads the workbooks with zipfile + xml only (no other library), takes the 'International Avg.' row and the format line of every sheet, and compares
them with the rows of the bulk CSV. It writes facts only (item ref, format, points, international average, standard error, match): no item text.
"""
import csv, json, re, sys, zipfile
import xml.etree.ElementTree as ET

M = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

def read(path):
    z = zipfile.ZipFile(path)
    ss = ["".join(t.itertext()) for t in ET.fromstring(z.read("xl/sharedStrings.xml")).iter(M + "si")]
    n = len(re.findall(r"<sheet ", z.read("xl/workbook.xml").decode()))
    for i in range(1, n + 1):
        rows = []
        for row in ET.fromstring(z.read(f"xl/worksheets/sheet{i}.xml")).iter(M + "row"):
            cells = []
            for c in row:
                v = c.find(M + "v")
                if v is not None:
                    cells.append(ss[int(v.text)] if c.get("t") == "s" else v.text)
            if cells:
                rows.append(cells)
        yield rows

def facts(rows, pirls):
    head = rows[1][0]
    ref = re.match(r"(\S+) \((.*?)\):", head)
    code, inner = ref.group(1), ref.group(2)
    item = code if pirls else inner
    fmt = rows[2][0]
    avg = next((r for r in rows if r[0].startswith("International Avg")), None)
    colhead = next((r for r in rows if r[0] == "Country"), [])
    return {"item": item, "format": fmt, "metricHeader": " ".join(colhead[1:]).replace("\n", " "), "avgPct": float(avg[1]) if avg else None, "se": float(avg[2]) if avg and len(avg) > 2 else None}

def points(fmt):
    m = re.search(r"\((\d) Points?\)", fmt)
    return int(m.group(1)) if m else 1

wb = {"TIMSS-2011-G4-M": (sys.argv[1], False), "TIMSS-2011-G8-M": (sys.argv[2], False), "PIRLS-2011-G4-R": (sys.argv[3], True)}
csv_rows = {(r["source_id"], r["item_ref"]): r for r in csv.DictReader(open(sys.argv[4], newline="", encoding="utf-8"))}
out = {"sources": {}, "items": []}
for sid, (path, pirls) in wb.items():
    found, bad = 0, []
    for rows in read(path):
        f = facts(rows, pirls)
        r = csv_rows.get((sid, f["item"]))
        f["points"] = points(f["format"])
        f["csvRatePct"] = round(float(r["correct_rate"]) * 100, 4) if r else None
        f["match"] = bool(r) and f["avgPct"] is not None and abs(f["csvRatePct"] - f["avgPct"]) < 1e-6
        f["sourceId"] = sid
        out["items"].append(f)
        found += 1
        if not f["match"]:
            bad.append(f["item"])
    csv_n = sum(1 for k in csv_rows if k[0] == sid)
    out["sources"][sid] = {"sheets": found, "csvRows": csv_n, "mismatches": bad}
json.dump(out, open(sys.argv[5], "w"), indent=1)
print(json.dumps(out["sources"]))
