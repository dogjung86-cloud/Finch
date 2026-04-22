"""썸네일 캡션 플레이스홀더를 실제 설명으로 교체.

매번 쓰이는 범용 스크립트가 아니라, 에이전트가 자동 생성한 일반화 캡션
("기사 주제 X 을 상징하는 이미지")을 사용자 정의 문구로 덮어쓸 때 쓰는 템플릿.
슬롯별 실제 이미지 내용에 맞춰 NEW_CAPTIONS dict를 편집한 뒤 실행할 것.
"""
import io, json, re, sys
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
SKILL_ROOT = Path(__file__).resolve().parent.parent
STATE = SKILL_ROOT / "state"

# 사용자가 슬롯별로 편집하는 영역
NEW_CAPTIONS = {
    # 0: {"desc": "이미지 설명 한 문장", "src_meta": "Wikimedia Commons (CC BY-SA 4.0) / 저자"},
}

def main():
    if not NEW_CAPTIONS:
        print("NEW_CAPTIONS가 비어 있습니다. 슬롯별 desc/src_meta를 이 파일에 먼저 채우세요.")
        return
    for slot, cap in NEW_CAPTIONS.items():
        p = STATE / f"slot-{slot}.json"
        if not p.exists():
            print(f"slot {slot}: file not found")
            continue
        d = json.loads(p.read_text(encoding="utf-8"))
        new_cap = f'<p class="ql-align-center"><em>{cap["desc"]}. 출처: {cap["src_meta"]}</em></p>'
        new_body = re.sub(
            r'^<p class="ql-align-center">\s*<em>.+?</em>\s*</p>',
            new_cap, d["full_content"], count=1, flags=re.DOTALL,
        )
        if new_body != d["full_content"]:
            d["full_content"] = new_body
            p.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"slot {slot}: replaced")
        else:
            print(f"slot {slot}: no caption match")

if __name__ == "__main__":
    main()
