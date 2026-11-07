"""Near-duplicate and template-share analysis of the built static site (read-only).

Usage: python3 scripts/seo/near-duplicates.py <dist-dir> <out.json> [threshold=0.5]
Primary content = text inside <article class="detail-article"> (header, footer, search form
excluded). 5-word shingles. A shingle is "template" when it appears on >= 5% of pages of the
same page type (or >= 20 pages); unique share = words covered only by non-template shingles.
Clusters = connected components of pairs with Jaccard >= threshold within a page type.
"""
import html, json, re, sys
from collections import Counter, defaultdict
from pathlib import Path

dist = Path(sys.argv[1]); out = Path(sys.argv[2]); thr = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5
base = "https://rvappliancefaultcodes.com"
locs = re.findall(r"<loc>(.*?)</loc>", (dist / "sitemap.xml").read_text())
K = 5

def text_of(path):
    raw = (dist / path.strip("/") / "index.html").read_text() if path != "/" else (dist / "index.html").read_text()
    m = re.search(r'<article class="detail-article">(.*?)</article>', raw, re.S)
    body = m.group(1) if m else re.sub(r".*<main[^>]*>|</main>.*", "", raw, flags=re.S)
    body = re.sub(r"<script.*?</script>|<style.*?</style>", " ", body, flags=re.S)
    t = html.unescape(re.sub(r"<[^>]+>", " ", body))
    return re.findall(r"[a-z0-9]+", t.lower())

def ptype(path):
    return "home" if path == "/" else path.strip("/").split("/")[0]

pages = {}
for loc in locs:
    path = loc.replace(base, "")
    words = text_of(path)
    sh = [" ".join(words[i:i + K]) for i in range(max(1, len(words) - K + 1))]
    pages[path] = {"type": ptype(path), "words": words, "shingles": sh}

# template shingles per type
by_type = defaultdict(list)
for p, d in pages.items(): by_type[d["type"]].append(p)
df = {t: Counter() for t in by_type}
for p, d in pages.items(): df[d["type"]].update(set(d["shingles"]))
report = {}
for p, d in pages.items():
    t = d["type"]; n = len(by_type[t]); cut = max(2, min(20, int(0.05 * n)))
    tmpl = {s for s in set(d["shingles"]) if df[t][s] >= cut}
    covered = [False] * len(d["words"])
    for i, s in enumerate(d["shingles"]):
        if s not in tmpl:
            for j in range(i, min(i + K, len(covered))): covered[j] = True
    uniq = sum(covered)
    report[p] = {"type": t, "words": len(d["words"]), "uniqueWords": uniq,
                 "templateShare": round(1 - uniq / max(1, len(d["words"])), 3)}

# pairwise jaccard within type
pairs = []
for t, ps in by_type.items():
    sets = {p: set(pages[p]["shingles"]) for p in ps}
    for i, a in enumerate(ps):
        for b in ps[i + 1:]:
            A, B = sets[a], sets[b]
            if not A or not B: continue
            j = len(A & B) / len(A | B)
            if j >= thr: pairs.append((a, b, round(j, 3)))
parent = {p: p for p in pages}
def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]; x = parent[x]
    return x
for a, b, _ in pairs: parent[find(a)] = find(b)
clusters = defaultdict(list)
for p in pages: clusters[find(p)].append(p)
multi = sorted([sorted(c) for c in clusters.values() if len(c) > 1], key=len, reverse=True)
out.write_text(json.dumps({"threshold": thr, "shingle": K, "pages": report, "pairs": pairs, "clusters": multi}, indent=1))
sizes = Counter(len(c) for c in multi)
print(f"pages {len(pages)}; pairs>={thr}: {len(pairs)}; clusters {len(multi)} covering {sum(map(len, multi))} pages; sizes {sorted(sizes.items())}")
for t, ps in by_type.items():
    ws = sorted(report[p]["words"] for p in ps); us = sorted(report[p]["uniqueWords"] for p in ps)
    ts = sorted(report[p]["templateShare"] for p in ps)
    mid = len(ps) // 2
    print(f"{t:9s} n={len(ps):4d} words median {ws[mid]} uniqueWords median {us[mid]} p10 {us[len(us)//10]} templateShare median {ts[mid]}")
