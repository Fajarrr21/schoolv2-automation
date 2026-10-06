#!/usr/bin/env python3
"""
Kumpulkan evidence bug dari hasil run Cypress.

Pakai:
    python scripts/collect_evidence.py [<log run cypress>] [<fixture json> ...]

Langkah:
  1. Baca daftar bug + TC terkait dari fixture (blok "bug": {"BUG-001": {"tc": [...]}}).
     Default: cypress/fixtures/tahfidz.json.
  2. Cari screenshot gagal di cypress/screenshots yang namanya memuat ID TC tersebut.
  3. Salin ke docs/evidence/BUG-xxx/ (folder ini DI-COMMIT; cypress/screenshots tidak,
     dan isinya dihapus setiap run).
  4. Tulis docs/evidence/BUG-xxx/README.md: TC, file screenshot, dan pesan assertion
     (expected vs actual) yang diambil dari log run bila diberikan.
  5. Isi kolom "Screenshot Evidence" di bugs.csv dengan path relatif screenshot pertama.
     Kolom yang sudah terisi tidak ditimpa kecuali screenshot baru ditemukan.

Video sengaja tidak dikumpulkan (berat). README yang sudah ada ditulis ulang
hanya bagian otomatisnya (di antara penanda AUTO).
"""
import csv
import json
import os
import re
import shutil
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, "cypress", "screenshots")
EVID = os.path.join(ROOT, "docs", "evidence")
BUGS = os.path.join(ROOT, "bugs.csv")

args = sys.argv[1:]
log_path = args[0] if args and args[0].endswith(".log") else None
fixtures = [a for a in args if a.endswith(".json")] or [os.path.join(ROOT, "cypress", "fixtures", "tahfidz.json")]

ANSI = re.compile(r"\x1b\[[0-9;]*m")
log_text = ""
if log_path and os.path.exists(log_path):
    log_text = ANSI.sub("", open(log_path, encoding="utf-8", errors="replace").read())


def assertion_for(tc_id):
    """Pesan error pertama untuk TC di log (blok ringkasan kegagalan Cypress)."""
    if not log_text:
        return None
    m = re.search(re.escape(tc_id) + r" :[^\n]*:\n((?:.*\n){1,14})", log_text)
    if not m:
        return None
    keep = []
    for raw in m.group(1).splitlines():
        line = raw.strip()
        # Berhenti di kegagalan berikutnya ("2) Tahfidz ...") atau stack trace.
        if re.match(r"^\d+\) ", line) or line.startswith("at "):
            break
        # Ambil pesan error + baris diff expected/actual saja.
        if re.match(r"^(AssertionError|CypressError|Error|TypeError)", line) or re.match(r"^[-+]['\[]", line):
            keep.append(line)
    return "\n".join(keep[:6]) or None


bug_map = {}
for fx in fixtures:
    data = json.load(open(fx, encoding="utf-8"))
    for bug_id, info in (data.get("bug") or {}).items():
        if bug_id.startswith("BUG-"):
            bug_map[bug_id] = info

all_shots = []
for dirpath, _, files in os.walk(SHOTS):
    for f in files:
        if f.lower().endswith(".png"):
            all_shots.append(os.path.join(dirpath, f))

rows = list(csv.reader(open(BUGS, encoding="utf-8", newline="")))
header = rows[0]
i_shot = header.index("Screenshot Evidence")

AUTO_START, AUTO_END = "<!-- AUTO:START -->", "<!-- AUTO:END -->"
summary = []
for bug_id, info in sorted(bug_map.items()):
    tcs = info.get("tc") or []
    folder = os.path.join(EVID, bug_id)
    copied = []
    for tc in tcs:
        pat = re.compile(re.escape(tc) + r"\b")
        for shot in all_shots:
            if pat.search(os.path.basename(shot)):
                os.makedirs(folder, exist_ok=True)
                stem, ext = os.path.splitext(os.path.basename(shot))
                # Potong nama (Windows MAX_PATH) tanpa membuang ekstensi .png.
                dest_name = f"{tc}_{re.sub(r'[^A-Za-z0-9._-]+', '_', stem)}"[:140] + ext
                dest = os.path.join(folder, dest_name)
                shutil.copy2(shot, dest)
                copied.append((tc, dest))
    # TC yang tidak ikut run ini: pertahankan screenshot yang sudah ada di folder evidence
    # (supaya README tidak kehilangan tautan saat hanya sebagian spec dijalankan ulang).
    baru = {tc for tc, _ in copied}
    if os.path.isdir(folder):
        for tc in tcs:
            if tc in baru:
                continue
            lama = sorted(f for f in os.listdir(folder) if f.startswith(tc + "_") and f.lower().endswith(".png"))
            if lama:
                copied.append((tc, os.path.join(folder, lama[-1])))
        copied.sort(key=lambda x: tcs.index(x[0]))
    if not copied and not os.path.exists(os.path.join(folder, "README.md")):
        summary.append(f"{bug_id}: tidak ada screenshot baru")
        continue
    os.makedirs(folder, exist_ok=True)
    auto = [AUTO_START, f"## Evidence otomatis ({date.today().isoformat()})", ""]
    auto.append(f"**Judul:** {info.get('judul', '-')}")
    auto.append(f"**TC terkait:** {', '.join(tcs) or '-'}")
    auto.append("")
    auto.append("Keterangan diff assertion: baris `-` = hasil AKTUAL app, baris `+` = EXPECTED (PRD/keputusan).")
    auto.append("")
    for tc, dest in copied:
        rel = os.path.relpath(dest, folder).replace(os.sep, "/")
        auto.append(f"### {tc}")
        msg = assertion_for(tc)
        if msg:
            auto += ["```", msg, "```"]
        auto.append(f"![{tc}]({rel.replace(' ', '%20')})")
        auto.append("")
    auto.append(AUTO_END)
    readme = os.path.join(folder, "README.md")
    old = open(readme, encoding="utf-8").read() if os.path.exists(readme) else f"# {bug_id}\n\n"
    if AUTO_START in old:
        old = old[: old.index(AUTO_START)] + old[old.index(AUTO_END) + len(AUTO_END):]
    open(readme, "w", encoding="utf-8").write(old.rstrip() + "\n\n" + "\n".join(auto) + "\n")
    if copied:
        rel_first = os.path.relpath(copied[0][1], ROOT).replace(os.sep, "/")
        for r in rows[1:]:
            if r and r[0] == bug_id:
                while len(r) <= i_shot:
                    r.append("")
                r[i_shot] = rel_first
    summary.append(f"{bug_id}: {len(copied)} screenshot -> docs/evidence/{bug_id}/")

csv.writer(open(BUGS, "w", encoding="utf-8", newline="")).writerows(rows)
print("\n".join(summary))
