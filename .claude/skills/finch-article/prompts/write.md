# 단계 B: 기사 작성 프로토콜 (에이전트 위임)

## 원칙

**메인 세션은 오케스트레이션만.** 각 슬롯은 **독립된 executor 에이전트(model=opus)**에 위임한다.
원문 텍스트는 메인 컨텍스트에 쌓이지 않는다 — 에이전트가 읽고 결과 JSON만 반환.

## 메인 세션에서 할 일

1. 사용자가 붙여넣은 JSON 파싱 → `state/selected.json` 저장
2. JSON 예시:
```json
{
  "selections": [
    {"slot": 0, "id": "ns-003", "category": "천문우주"},
    {"slot": 1, "id": "sa-007", "category": "생명진화"},
    ...
  ]
}
```
3. 각 슬롯에 대해 `state/slot-N.json`이 존재하는지 확인 (있으면 skip 옵션 제공)
4. 슬롯 0부터 순차적으로 executor 에이전트 호출 (**병렬은 피한다** — Playwright 경쟁 방지)
5. 각 에이전트 완료 후 `slot-N.json` 존재 확인 → 다음 슬롯 진행

## 에이전트 호출 프롬프트 (template)

```
Agent({
  subagent_type: "oh-my-claudecode:executor",
  model: "opus",
  description: "슬롯 N 기사 작성",
  prompt: `
  [역할] 너는 finch.co.kr에 게시될 과학드림 스타일 기사를 작성한다.

  [필수 읽기]
  1. .claude/skills/finch-article/style-guide.md — 스타일 DNA (절대 위반 금지)
  2. .claude/skills/finch-article/templates/quill-html.md — 본문 HTML 포맷 규칙

  [입력]
  - 슬롯 번호: {SLOT}
  - 카테고리: {CATEGORY}
  - 원문 URL: {URL}
  - 원문 제목: {ORIGINAL_TITLE}
  - 요약: {SUMMARY}

  [작업 순서]
  1. Playwright(mcp__playwright__browser_navigate)로 원문 URL 열고 본문 추출
     - 로그인 세션 유지된 브라우저 사용 (메인 세션의 것)
     - browser_evaluate로 article 본문만 추출 (광고/사이드바 제외)
     - 원문 텍스트는 메모리에만 두고 절대 상태파일에 저장하지 말 것

  2. 원문에서 사실만 추출:
     - 핵심 수치, 인명(영문), 연도, 인과관계
     - 인용된 논문/연구 목록

  3. 학술 출처 교차 검증 (최소 2개):
     - Google Scholar 검색: scholar.google.com/scholar?q={KEY_TERMS}
     - arXiv 검색: arxiv.org (물리·천문·수학 주제)
     - PubMed (생명과학)
     - 논문 DOI·제목·저자·연도 확보

  4. 과학드림 스타일로 재작성 (style-guide.md 준수):
     - 제목: 호기심 유발 + 한글 (예: "북대서양에는 왜 바다사자가 한 마리도 없을까?")
     - 본문: 6~10문단, 기승전결
     - 원문 문장 직역 금지 — 사실만 재구성

  5. 이미지 3장 + 썸네일 1장 **URL 수집**:
     - Wikimedia Commons, NASA/ESA, Unsplash만 사용
     - 각 이미지에 대해: URL / 대체 텍스트 / 캡션 / 출처 / 라이선스 / 저자
     - 캡션 형식은 templates/quill-html.md 참조
     - 검색 방법: Playwright로 commons.wikimedia.org / images.nasa.gov / unsplash.com 검색

  5-1. 이미지 **로컬 다운로드** (필수 — 반드시 저용량 버전으로)
     - 저장 경로: `.claude/skills/finch-article/state/slot-{SLOT}/images/`
     - 파일명: `thumb.{ext}`, `body-1.{ext}`, `body-2.{ext}`, `body-3.{ext}`
     - **용량 목표**: 썸네일 100~300KB, 본문 이미지 150~500KB (상한 800KB)
     - **해상도 목표**: 가로 ~1200px (최대 1600px)
     - **포맷 우선순위**: jpg > webp > png

     **저용량 URL 요청 방법 (원본 대신 리사이즈 URL):**

     a. **Wikimedia Commons** — `Special:FilePath` 엔드포인트 사용
        - 패턴: `https://commons.wikimedia.org/wiki/Special:FilePath/{파일명}?width=1200`
        - 예: `https://commons.wikimedia.org/wiki/Special:FilePath/Paddy_plantation_during_rain.jpg?width=1200`
        - 302 리다이렉트를 따라가면 적절한 썸네일 반환 (curl `-L` 옵션 필수)
        - 공백 `_`, 특수문자 URL 인코딩(`%28`, `%29`)
        - **금지**: `upload.wikimedia.org/.../thumb/X/YZ/…1200px-…` 직접 패턴 (해시 디렉터리 오류 위험)

     b. **Unsplash** — 쿼리 파라미터 사용
        - `https://images.unsplash.com/photo-XXXX?w=1200&q=80&fm=jpg`
        - `w=1200`(너비), `q=80`(품질), `fm=jpg`(포맷 강제)

     c. **NASA/ESA/JWST/Hubble** — 공식 배포 중 `small` 또는 `medium` 선택
        - ESA Hubble: `cdn.esahubble.org/archives/images/screen/{id}.jpg` (~100KB)

     **다운로드 절차:**
     ```
     Bash: mkdir -p ".claude/skills/finch-article/state/slot-{SLOT}/images"
     Bash: curl -L -A "Mozilla/5.0" -o "<target_path>" "<저용량_URL>"
     ```

     **크기 검증 + 재시도:**
     ```
     Bash: stat -c%s "<target_path>"   # 바이트 단위 크기
     ```
     - 0 byte → URL 오류, 재다운로드
     - 1MB 미만 → OK
     - 1MB 이상 → **재시도**: Wikimedia는 `width=800`, Unsplash는 `w=800&q=75`로 내려서 재요청
     - 재시도 후에도 초과 시 다른 이미지 후보로 교체

     **⚠️ Supabase 저장소 주의:** 실제 Supabase 업로드는 **publish 단계**에서 Playwright가 처리한다.
     AdminPage의 `uploadImage()` 함수가 `article-thumbnails` 버킷(finch-history의 `finch-100-years-ago`와 다름)에 저장.
     작성 단계(write)에서는 **로컬 다운로드까지만** 하면 됨.

  6. Quill HTML 본문 조립 (templates/quill-html.md 규칙 엄수):
     - <p>문단</p> 사이에 이미지+캡션 블록
     - 마지막에 <h3>참고문헌</h3> + 학술 논문 리스트

  7. 발췌문(excerpt) 작성: 80~120자, 본문 요약

  8. 자가 검증 (style-guide.md §10 체크리스트 전부 통과해야 함)

  [출력 — 반드시 이 JSON으로 .claude/skills/finch-article/state/slot-{SLOT}.json 저장]
  {
    "slot": 0,
    "title": "기사 제목",
    "excerpt": "80~120자 발췌문",
    "full_content": "<p>...</p><p class=\"ql-align-center\"><img ...></p>...<h3>참고문헌</h3>...",
    "thumbnail": "썸네일_이미지_URL",
    "category": "천문우주",
    "display_order": 0,
    "is_published": true,
    "is_membership": false,
    "sources": {
      "original_url": "원문 URL (참고용, admin에는 등록되지 않음)",
      "images": [
        {
          "url": "저용량 원본 URL (참고)",
          "local_path": "D:/Finch/.claude/skills/finch-article/state/slot-0/images/body-1.jpg (절대 경로, Playwright browser_file_upload용)",
          "source": "Wikimedia Commons",
          "license": "CC BY-SA 4.0",
          "author": "..."
        },
        ...
      ],
      "thumbnail_source": {
        "url": "저용량 원본 URL (참고)",
        "local_path": "D:/Finch/.claude/skills/finch-article/state/slot-0/images/thumb.jpg",
        "source": "...", "license": "...", "author": "..."
      },
      "papers": [
        {"doi": "10.1038/...", "title": "...", "authors": "...", "year": 2024, "journal": "Nature"}
      ]
    },
    "self_check": {
      "hook_concrete": true,
      "questions_raised": 2,
      "scientist_fullname": true,
      "ending_styles_count": 3,
      "plagiarism_check_passed": true
    }
  }

  [실패 조건]
  - 원문 페이지가 로그인 벽에 막히면: 메인 세션에 "slot {SLOT} 로그인 만료" 보고 후 종료
  - 학술 출처 2개 미만이면: 재검색 최대 3회, 그래도 실패 시 종료
  - 적절한 이미지를 못 찾으면: 검색 키워드 바꿔 최대 3회 재시도
  `
})
```

## 슬롯 단위 진행 상태 관리

각 슬롯의 상태를 `state/progress.json`에 기록:
```json
{
  "slot_0": "done",
  "slot_1": "done",
  "slot_2": "in_progress",
  "slot_3": "pending",
  "slot_4": "pending",
  "slot_5": "pending"
}
```

중간에 세션이 끊겨도 이 파일을 보고 재개 가능.

## 완료 후

6개 `slot-N.json`이 모두 존재하면 → `prompts/review.md`(검증) → `prompts/publish.md`(등록)로 진행.
