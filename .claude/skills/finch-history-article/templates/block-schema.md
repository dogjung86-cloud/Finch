# slot-N.json 구조 정의

각 슬롯 작성 에이전트가 반드시 출력해야 하는 JSON 스키마.

Playwright 발행 에이전트는 **오직 이 JSON만 읽어서** admin 화면을 조작한다.
따라서 필드가 빠지거나 형식이 다르면 발행이 실패한다.

## 전체 스키마

```json
{
  "slot": 0,
  "title": "피라미드는 왜 그 자리에 서 있을까?",

  "thumbnail": {
    "local_path": "D:/Finch/.claude/skills/finch-history-article/state/slot-0/images/thumb.jpg",
    "source": "Wikimedia Commons",
    "license": "CC BY-SA 4.0",
    "author": "Nina Aldin Thune",
    "original_url": "https://upload.wikimedia.org/..."
  },

  "body_blocks": [
    {
      "_comment": "★ 첫 블록은 반드시 썸네일 캡션. HistoryDetailClient.jsx가 본문 위에 자동으로 썸네일을 삽입하기 때문.",
      "type": "paragraph",
      "align": "center",
      "italic": true,
      "text": "이집트 기자의 대피라미드. 출처: Wikimedia Commons (CC BY-SA 4.0) / Nina Aldin Thune"
    },
    {
      "type": "paragraph",
      "text": "이집트 기자 고원에는 거대한 돌무더기 세 개가 있습니다. 대피라미드 — 평균 무게 2.5톤짜리 석회암 블록 약 230만 개가 쌓여 올라간, 높이 146.6m의 인공 산이죠."
    },
    {
      "type": "paragraph",
      "text": "그런데 2,500년 전 헤로도토스가 처음 이 피라미드를 기록한 이후로 풀리지 않은 질문이 하나 있습니다."
    },
    {
      "type": "image",
      "local_path": "D:/Finch/.claude/skills/finch-history-article/state/slot-0/images/body-1.jpg",
      "alt": "기자 고원의 대피라미드",
      "caption": "이집트 기자의 대피라미드 — 출처: Wikimedia Commons (CC BY-SA 4.0) / Nina Aldin Thune",
      "source": "Wikimedia Commons",
      "license": "CC BY-SA 4.0",
      "author": "Nina Aldin Thune",
      "original_url": "https://upload.wikimedia.org/..."
    },
    {
      "type": "paragraph",
      "text": "..."
    },
    {
      "type": "heading",
      "level": 2,
      "text": "사라진 강의 흔적"
    },
    {
      "type": "paragraph",
      "text": "..."
    },
    {
      "type": "references",
      "items": [
        {
          "doi": "10.1038/s43247-022-00512-8",
          "title": "The Nile's lost Ahramat Branch and the construction of the Giza pyramids",
          "authors": "Ghoneim, E., et al.",
          "year": 2022,
          "journal": "Communications Earth & Environment"
        },
        {
          "doi": "10.1073/pnas.2202530119",
          "title": "Nile waterscapes facilitated the construction of the Giza pyramids",
          "authors": "Sheisha, H., et al.",
          "year": 2022,
          "journal": "PNAS"
        }
      ]
    }
  ],

  "self_check": {
    "hook_concrete": true,
    "questions_raised": 3,
    "scientist_fullname": true,
    "ending_styles_count": 3,
    "papers_count": 2,
    "images_count": 3,
    "all_captions_have_source": true,
    "plagiarism_risk_self_assessed": "low"
  }
}
```

## 블록 타입

### `paragraph` — 일반 문단
```json
{"type": "paragraph", "text": "한국어 본문..."}
```
- 3~5문장 (최대 6문장)
- 한 문단에 종결어 2종 이상 섞기 (~합니다 / ~하죠 / ~인 거죠 / ~거예요)
- 발행 시 `<p>텍스트</p>`로 렌더링

### `image` — 이미지 + 캡션
```json
{
  "type": "image",
  "local_path": "절대 경로",
  "alt": "이미지 대체 텍스트",
  "caption": "캡션 본문 — 출처: {소스} ({라이선스}) / {저자}",
  "source": "Wikimedia Commons | NASA | ESA | Unsplash",
  "license": "CC BY | CC BY-SA 4.0 | Public Domain | Unsplash License",
  "author": "저자명 또는 Unknown",
  "original_url": "다운로드 원본 URL"
}
```
- 발행 시:
  1. Quill 툴바의 이미지 버튼 클릭 → file input에 `local_path` 업로드 → Supabase 버킷으로 자동 업로드 → URL 삽입
  2. 다음 줄에 캡션 텍스트 입력, 전체 선택 후 이탤릭 + 가운데 정렬 버튼 클릭
- 최종 HTML: `<p class="ql-align-center"><img src="supabase-url"></p><p class="ql-align-center"><em>캡션</em></p>`

### `heading` — 소제목 (선택)
```json
{"type": "heading", "level": 2, "text": "소제목"}
```
- 4~5문단마다 1개 권장. 자주 쓰지 말 것.
- 발행 시 `<h2>텍스트</h2>` (Quill 툴바의 헤더 드롭다운 H2)

### `references` — 참고문헌 (반드시 마지막 블록)
```json
{
  "type": "references",
  "items": [
    {"doi": "...", "title": "...", "authors": "...", "year": 2022, "journal": "..."},
    ...
  ]
}
```
- **학술 논문 2편 이상 필수.** Nautilus 원문 링크는 넣지 않는다.
- 발행 시 Quill에 다음 구조로 입력:
  ```
  [H3] 참고문헌
  [small text]
  1. Ghoneim, E., et al. (2022). "The Nile's lost Ahramat Branch and the construction of the Giza pyramids." Communications Earth & Environment. DOI: 10.1038/s43247-022-00512-8
  2. Sheisha, H., et al. (2022). "Nile waterscapes facilitated the construction of the Giza pyramids." PNAS. DOI: 10.1073/pnas.2202530119
  ```

## 썸네일 규칙

- `thumbnail.local_path`는 절대 경로, Playwright `browser_file_upload`에 그대로 전달
- 썸네일은 **본문 내 이미지와 별개로** 추가 1장 준비 (본문 이미지 중 하나를 재활용해도 무방, 단 파일은 따로 저장)
- 가로 비율 권장 (목록 카드에서 160px 폭으로 렌더링됨)

## 파일명 규칙

`state/slot-N/images/` 아래:
- `thumb.{ext}` — 썸네일
- `body-1.{ext}`, `body-2.{ext}`, `body-3.{ext}` — 본문 이미지 순서대로

확장자는 원본에 맞춰 jpg/png/webp 사용.

## self_check 필드

작성 에이전트가 자가 검증 후 채우는 필드. reviewer가 교차 확인한다.

| 키 | 의미 | 기준 |
|---|---|---|
| `hook_concrete` | 훅이 구체적 수치·장면으로 시작 | true/false |
| `questions_raised` | 독자 질문 문장 개수 | 2 이상 |
| `scientist_fullname` | 과학자 한글+영문+소속 | true/false |
| `ending_styles_count` | 한 문단 내 종결어 종류 수 (평균) | 2 이상 |
| `papers_count` | 학술 논문 개수 | 2 이상 |
| `images_count` | 본문 이미지 개수 (썸네일 제외) | 2~3 |
| `all_captions_have_source` | 모든 캡션에 출처/라이선스/저자 | true |
| `plagiarism_risk_self_assessed` | 원문과 대조한 자기 평가 | "low" |
