"""공용 수정 스크립트. state/ 안 slot-N.json 에 대해 기계적 정리 수행.

사용: python scripts/apply_fixes.py
스크립트는 자기 위치 기준으로 경로를 잡으므로 작업 디렉토리와 무관하게 실행 가능.
"""
import io, json, os, re, sys, urllib.parse
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

SKILL_ROOT = Path(__file__).resolve().parent.parent  # scripts/ → 스킬 루트
STATE = SKILL_ROOT / "state"

def fix_double_period(text):
    return re.sub(r"\.\.(\s|<|$)", r".\1", text)

def normalize_source_in_caption(html):
    def repl(m):
        body = m.group(1).strip()
        parts = [p.strip() for p in body.split(",")]
        if len(parts) == 3 and "(" not in body and ")" not in body:
            return f"출처: {parts[0]} ({parts[1]}) / {parts[2]}"
        return m.group(0)
    return re.sub(r"출처:\s*([^<\n]+?)(?=</em>)", repl, html)

def is_verb_form(s):
    return bool(re.search(r"(고|는|며|다|면|자|요|데|지|네)$", s))

def strip_more_quotes(html):
    if not html: return html
    def repl(m):
        inner = m.group(1)
        if len(inner) > 20: return m.group(0)
        if is_verb_form(inner) and len(inner) <= 6: return m.group(0)
        if re.search(r"\d", inner) and len(inner) > 5: return m.group(0)
        return inner
    return re.sub(r"'([^']{1,30})'", repl, html)

def strip_nested_em(html):
    def caption_repl(m):
        outer = m.group(1)
        fixed = re.sub(r"<em>([^<]+?)</em>", r"\1", outer)
        return f'<p class="ql-align-center"><em>{fixed}</em></p>'
    return re.sub(r'<p class="ql-align-center">\s*<em>(.+?)</em>\s*</p>', caption_repl, html, flags=re.DOTALL)

def main():
    for slot in range(6):
        p = STATE / f"slot-{slot}.json"
        if not p.exists():
            print(f"slot {slot}: skipped (file not found)")
            continue
        d = json.loads(p.read_text(encoding="utf-8"))
        changes = []
        if ".." in d["full_content"]:
            d["full_content"] = fix_double_period(d["full_content"])
            changes.append("double-period")
        before = d["full_content"]
        d["full_content"] = normalize_source_in_caption(d["full_content"])
        if before != d["full_content"]:
            changes.append("source-format")
        before_q = d["full_content"].count("'")
        d["full_content"] = strip_more_quotes(d["full_content"])
        d["title"] = strip_more_quotes(d["title"])
        d["excerpt"] = strip_more_quotes(d["excerpt"])
        if before_q != d["full_content"].count("'"):
            changes.append(f"quotes({before_q}->{d['full_content'].count(chr(39))})")
        before_em = d["full_content"]
        d["full_content"] = strip_nested_em(d["full_content"])
        if before_em != d["full_content"]:
            changes.append("nested-em")
        p.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"slot {slot}: {changes if changes else '(no change)'}")

if __name__ == "__main__":
    main()
