---
name: finch-history-article
description: finch.co.kr admin "100년 전 과학" 탭에 과학드림 스타일 기사 6편을 자동 등록하는 4단계 파이프라인. Nautilus 로컬 아카이브(G:\내 드라이브\Nautilus\History(노틸러스)\articles)에서 6편 선택 → 서브에이전트 병렬 재작성(학술 논문 기반) → 이미지 다운로드 → Playwright로 썸네일·본문 이미지를 UI 업로드 플로우로 등록. 트리거: "/finch-history-article", "100년 전 과학 기사 자동 등록", "과학사 기사 써줘"
---

# Finch History Article Automation Skill

## 무엇을 하는가

finch.co.kr 관리자 페이지의 **"100년 전 과학" 탭** (Supabase `history_science` 테이블)에
**과학드림 스타일**의 과학사 기사 6편을 자동으로 등록한다.

- **소스**: `G:\내 드라이브\Nautilus\History(노틸러스)\articles\` — 각 폴더에 `article.md` + `metadata.json` 이미 스크래핑 완료 (172편)
- **재작성 원칙**: 원문 문장 직역 금지. **학술 논문 2편 이상을 실제로 검색해 교차 확인**하고, 그 논문들을 바탕으로 한국어 이야기로 재구성
- **이미지**: 썸네일 1장 + 본문 2~3장 (각각 캡션 포함), Wikimedia Commons / NASA·ESA / Unsplash만 사용
- **등록 방식**: **URL 직접 입력이 아닌** Playwright로 썸네일 드롭존·Quill 이미지 버튼에 **실제 파일 업로드** → Supabase `finch-100-years-ago` 버킷 경유

## DB 필드 (history_science)

HistoryAdmin 폼이 보내는 값만 채운다:
- `title` (텍스트)
- `content` (Quill HTML — Supabase 업로드된 이미지 URL이 삽입된 상태)
- `thumbnail` (Supabase 업로드된 URL — 드롭존이 자동 채움)
- `is_published: true`
- `is_membership: false`

## 4단계 파이프라인

### 단계 1: 기사 선택 (`/finch-history-article select`)
1. Nautilus 아카이브 디렉터리 목록 읽기 (172개)
2. 랜덤 6편 선택 → 사용자에게 제목·요약 목록 제시
3. 사용자가 OK / 교체 지시 → `state/selected.json` 확정

자세한 절차: `prompts/select.md`

### 단계 2: 재작성 (서브에이전트 6개 병렬)
- 각 슬롯마다 **executor(model=opus)** 독립 호출 (컨텍스트 오염 방지)
- 에이전트가 하는 일:
  1. `article.md` 읽기 (로컬 파일 — Playwright 불필요)
  2. 핵심 사실 추출 (수치·인명·연도·인과관계)
  3. **Google Scholar / arXiv / PubMed에서 학술 논문 2편 이상 검색 및 확보** (제목·저자·연도·저널·DOI)
  4. 학술 논문 내용을 바탕으로 과학드림 스타일로 재구성
  5. 이미지 3~4장 URL 수집 (썸네일 1 + 본문 2~3)
  6. 각 이미지를 `state/slot-N/images/` 아래 로컬 디스크에 **다운로드**
  7. `state/slot-N.json`에 `body_blocks` 구조로 결과 저장

자세한 절차: `prompts/write.md`

### 단계 3: 검증 (code-reviewer 서브에이전트 6개 병렬)
- 스타일 가이드 체크리스트
- Nautilus 원문(`article.md`)과 문장 유사도 대조 (표절 리스크)
- 학술 논문 DOI 실재 확인
- 이미지 라이선스 도메인 확인

자세한 절차: `prompts/review.md`

### 단계 4: 발행 (Playwright UI 업로드 플로우)
Playwright MCP로 admin 화면을 실제 조작:
1. `/admin` 이동 → "100년 전 과학" 탭 클릭
2. "+ 새 항목 작성" 클릭
3. 제목 입력
4. **썸네일**: `<input id="history-thumb-input" type="file">` 에 `browser_file_upload`로 로컬 파일 업로드 → Supabase 업로드 자동 완료
5. **본문**: `body_blocks`를 순차 처리
   - 텍스트 블록: Quill 에디터에 `browser_type`으로 문단 입력 + Enter
   - 이미지 블록: Quill 툴바의 이미지 버튼 클릭 → 나타나는 file input에 `browser_file_upload` → 이미지 삽입 완료 → 다음 줄에 캡션 텍스트 입력 (이탤릭·가운데 정렬)
6. 공개/멤버십 체크박스 확인 후 "작성" 클릭
7. 목록으로 돌아가면 다음 슬롯

자세한 절차: `prompts/publish.md`

## 핵심 원칙

1. **원문 문장 직역 금지.** 사실만 추출 → 학술 논문으로 교차 확인 → 한국어로 재구성.
2. **학술 논문 2편 이상 필수.** Nautilus 원문은 참고문헌 섹션에 포함시키지 않는다.
3. **이미지는 파일 업로드로.** URL 직접 입력 금지 → 모두 Supabase 버킷 경유.
4. **각 이미지는 반드시 캡션 동반.** `<em>...</em>` 이탤릭, 출처+라이선스+저자.
5. **병렬 작성, 직렬 발행.** 작성은 executor 6개 병렬 OK (로컬 파일이라 충돌 없음). 발행은 단일 Playwright 브라우저 → 반드시 순차.
6. **실패 복구**: `state/slot-N.json` 존재 시 재작성 스킵. `state/progress.json`에 발행 상태 기록.

## 파일 구조

```
.claude/skills/finch-history-article/
├── SKILL.md               이 파일
├── prompts/
│   ├── select.md          단계 1 (선택)
│   ├── write.md           단계 2 (재작성 에이전트 프롬프트)
│   ├── review.md          단계 3 (검증 에이전트 프롬프트)
│   └── publish.md         단계 4 (Playwright 업로드 플로우)
├── templates/
│   └── block-schema.md    slot-N.json 구조 정의
└── state/                 실행 아티팩트 (gitignore 권장)
    ├── selected.json
    ├── slot-0.json ~ slot-5.json
    ├── slot-N/
    │   └── images/
    │       ├── thumb.jpg
    │       ├── body-1.jpg
    │       ├── body-2.jpg
    │       └── body-3.jpg
    └── progress.json
```

## 공통 자산 (기존 finch-article 스킬과 공유)

다음 파일은 **기존 `D:/Finch/.claude/skills/finch-article/` 아래 것을 그대로 참조**한다:

- **스타일 가이드**: `D:/Finch/.claude/skills/finch-article/style-guide.md`
- **Quill HTML 규칙**: `D:/Finch/.claude/skills/finch-article/templates/quill-html.md`
- **과학드림 샘플 원고**: `D:/Finch/.claude/skills/finch-article/ref/012.txt, 015.txt, 030.txt`

작성 에이전트는 필수 읽기에 위 경로를 포함한다. 본 스킬은 별도 스타일 가이드를 두지 않고 단일 소스를 유지한다.

## 트리거 예시

- `/finch-history-article select` — 기사 선택 시작
- `/finch-history-article write` — selected.json 확정 후 재작성 시작
- `/finch-history-article publish` — 검증 통과 후 admin 등록
- "100년 전 과학 6편 자동 등록" / "과학사 기사 써줘" — 자연어 트리거

## 새 컴퓨터에서 처음 쓸 때

[SETUP.md](./SETUP.md) 참조. 요약:
1. Finch 저장소 클론 (`.claude/skills/`도 같이 따라옴)
2. Google Drive 마운트해서 Nautilus 폴더 동기화
3. `cp config.json.example config.json` → 본인 머신 경로(특히 nautilus_archive, downloads_dir)에 맞게 수정
4. `prompts/*.md`에 박힌 절대 경로(D:/Finch/..., G:/내 드라이브/...) 새 머신과 다르면 메인 세션이 config.json 기반으로 치환해서 서브에이전트에 전달

## 호출 시 유의사항

- Nautilus 디렉터리 경로에 한글과 괄호가 포함되어 있음: `G:\내 드라이브\Nautilus\History(노틸러스)\articles\`. Bash에서는 `/g/내 드라이브/Nautilus/History(노틸러스)/articles/`로 접근 가능.
- 로컬 이미지 저장 경로는 Playwright `browser_file_upload` 요구사항에 맞춰 **절대 경로**로 기록.
