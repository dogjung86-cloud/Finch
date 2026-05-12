---
name: finch-article
description: finch.co.kr admin에 과학드림 스타일 기사 8편을 자동 등록하는 2단계 파이프라인. New Scientist / Scientific American / The Atlantic Science에서 30개 주제 수집 → 슬롯 선택 → 서브에이전트 병렬 작성 → Playwright admin 자동 등록. 트리거: "/finch-article", "기사 자동 등록", "주제 수집해줘", "finch 기사 써줘"
---

# Finch Article Automation Skill

## 경로 규칙 (이식성)

- 이 문서와 `prompts/*.md` 안의 경로는 **프로젝트 루트(`pwd`) 기준 상대 경로**로 표기한다.
  - 예: `.claude/skills/finch-article/style-guide.md`
- Read/Write 같은 툴에 절대 경로가 필요하면 **현재 작업 디렉토리(pwd)와 결합**해서 쓴다.
- `${SKILL_DIR}`는 `<pwd>/.claude/skills/finch-article`의 약어로 문서 내에서만 사용.
- admin URL 등 머신별 설정은 `config.json`에 둔다 (`config.json.example` 참고).

## 초기 설정 (새 컴퓨터에서 처음 쓸 때)

1. **부트스트랩 실행 (권장)**
   ```
   python ${SKILL_DIR}/scripts/bootstrap.py
   ```
   - `state/` 폴더 생성
   - `config.json.example` → `config.json` 복사
   - `ref/*.docx` 가 있으면 자동으로 `.txt` 추출 (python-docx 필요)

2. `config.json` 에서 `admin_url` 등 머신별 값 조정
3. Playwright MCP 브라우저로 NS / SA / The Atlantic / finch admin 에 각각 수동 로그인 (세션 쿠키 유지)
4. 첫 실행: `/finch-article collect`

## 무엇을 하는가

finch.co.kr 관리자 페이지(Supabase `articles` 테이블)에 **과학드림 스타일**의 기사 8편을 슬롯 0~7에 자동 등록한다.

- 주제 수집: New Scientist(13) + Scientific American(13) + The Atlantic Science(4) = 30개
- 카테고리: 천문우주 / 생명진화 / 뇌심리 / 지구환경 / 물리화학 (5개) 균형 배분
- 작성: 각 기사를 독립 executor-opus 에이전트에 위임 (컨텍스트 오염 방지 + 퀄리티 유지)
- 이미지 수집: Wikimedia Commons / NASA·ESA / Unsplash 에서 **저용량 URL**로 로컬 다운로드
  - Wikimedia: `Special:FilePath?width=1200`, Unsplash: `w=1200&q=80&fm=jpg`
  - 용량 목표: 썸네일 100~300KB / 본문 150~500KB
- 등록: Playwright MCP로 admin **파일 업로드 UI** 경유 → Supabase `article-thumbnails` 버킷에 재호스팅 → 자체 CDN URL로 발행
  - ⚠️ HistoryAdmin의 `finch-100-years-ago` 버킷과는 다른 별도 버킷. AdminPage가 하드코딩돼 있어 자동 분리됨.

## 2단계 파이프라인

### 단계 A: `/finch-article collect`

1. Playwright로 4개 탭 오픈: New Scientist, Scientific American, The Atlantic, finch admin
2. 사용자에게 "각 탭 로그인 후 알려주세요" 요청 → 대기
3. 로그인 검증 (`browser_evaluate`로 프로필 요소 확인)
4. 각 사이트에서 기사 목록 스크래핑 (제목/요약/URL/발행일)
   - New Scientist: News + Features 섹션만
   - Scientific American: 전 섹션
   - The Atlantic: Science 섹션만
5. LLM 분류로 5개 카테고리 균형 배분 (30개)
6. `state/collected.json` 저장
7. `state/selector.html` 생성 후 브라우저에서 오픈
8. 사용자는 카드 8개에 슬롯 0~7 지정 후 "완료" 클릭
9. JSON이 `<textarea>`에 출력됨 → 사용자가 복사해서 채팅에 붙여넣기

자세한 프로토콜: `prompts/collect.md`

### 단계 B: `/finch-article write` (JSON 붙여넣기 후 자동 발동)

1. JSON 파싱 → `state/selected.json` 저장
2. 8개 슬롯을 순차적으로 처리:
   - **각 슬롯마다 executor(model=opus) 에이전트 독립 호출**
   - 에이전트는 원문 읽기 + 재작성 + 이미지 3장(도식 일러스트 2 + 실사 1) + 썸네일 + 참고문헌 → `state/slot-N.json` 저장
3. 8개 모두 완료 후 code-reviewer로 표절/톤 검증 (슬롯별 개별 호출)
4. Playwright로 finch admin 접속 → 슬롯별로 8회 입력·저장
5. 각 슬롯의 `display_order = 슬롯 번호`, `is_published = true` 고정

자세한 프로토콜: `prompts/write.md`, `prompts/publish.md`

## 핵심 원칙

1. **절대 한 컨텍스트에 8개 기사를 몰아넣지 않는다.** 각 기사는 독립 서브에이전트.
2. **style-guide.md를 모든 작성 에이전트에 강제 주입.**
3. **원문 사이트 이미지 절대 사용 금지.** Wikimedia/NASA/Unsplash만.
4. **참고문헌 섹션 필수.** 학술 논문 DOI·출처만 (언론 원문 링크 포함 금지 — 표절 우려 회피).
5. **로그인 세션은 Playwright 브라우저 쿠키로 유지.** 자격 증명 저장 금지.
6. **실패 복구**: `state/slot-N.json`이 존재하면 해당 슬롯은 스킵 가능 (이어쓰기).

## 파일 구조

```
${SKILL_DIR}/
├── SKILL.md               이 파일
├── style-guide.md         과학드림 톤·구조 고정 레퍼런스
├── prompts/
│   ├── collect.md         단계 A 프로토콜
│   ├── write.md           기사별 에이전트 프롬프트
│   ├── review.md          검증 에이전트 프롬프트
│   └── publish.md         Playwright admin 자동화 절차
├── templates/
│   ├── selector.html      슬롯 선택 UI 템플릿
│   └── quill-html.md      본문 HTML 포맷 규칙
├── ref/                   과학드림 원고 텍스트 (015/012/030)
├── scripts/               유틸리티 헬퍼
│   ├── bootstrap.py       새 환경 초기화 (state/ 생성, config 복사, ref 추출)
│   ├── apply_fixes.py     slot-N.json 기계적 교정 (이중 마침표, 따옴표 등)
│   └── fix_captions.py    썸네일 캡션 플레이스홀더 교체
├── config.json.example    머신별 설정 템플릿 (admin URL 등)
├── config.json            로컬 설정 (gitignore, .example을 복사해서 만듦)
├── .gitignore             state/ 와 config.json 제외
└── state/                 실행 중 아티팩트 (gitignore)
    ├── collected.json
    ├── selected.json
    └── slot-0~7.json
```

## 트리거 예시

- `/finch-article collect` — 주제 수집 시작
- `/finch-article write` — JSON 붙여넣기 감지 시 자동 시작
- "finch 기사 자동 등록" / "주제 수집해줘" / "기사 써서 admin에 올려줘" — 자연어 트리거
