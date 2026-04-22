# 단계 A: 주제 수집 프로토콜

## 목표

3개 사이트에서 **최근 기사 30개**를 수집하고, 5개 카테고리로 균형 배분해 `state/selector.html`을 생성한다. 사용자가 브라우저에서 슬롯 0~5를 지정하면 JSON으로 출력한다.

## 단계

### 1. Playwright 세션 준비

```
mcp__playwright__browser_navigate (4개 탭 열기):
  - https://www.newscientist.com/section/news/
  - https://www.scientificamerican.com/
  - https://www.theatlantic.com/science/
  - https://finch.co.kr/admin (또는 실제 admin URL)
```

각 탭에서 사용자 로그인 대기:
```
메시지: "각 탭에서 로그인해 주세요. 완료하시면 '로그인 완료'라고 답해주세요."
```

대기 후, `mcp__playwright__browser_evaluate`로 로그인 상태 검증:
- New Scientist: 프로필 아이콘 또는 `document.cookie.includes('ns_user')` 확인
- Scientific American: 구독자 전용 요소 visible 체크
- The Atlantic: 헤더의 Account 링크 텍스트 변경 확인
- finch admin: `/admin` URL에서 리다이렉트되지 않는지 확인

하나라도 실패 시 "다시 로그인해 주세요" 재요청.

### 2. 기사 목록 수집

각 사이트별로 Playwright로 페이지 렌더링 후 DOM에서 추출.

**New Scientist (총 13개):**
- News 섹션: https://www.newscientist.com/section/news/ — 8개
- Features 섹션: https://www.newscientist.com/section/features/ — 5개
- 추출: 제목 / URL / 요약 / 발행일 / 대략 주제 키워드

**Scientific American (총 13개):**
- 홈: https://www.scientificamerican.com/
- Latest 섹션에서 최근 기사
- 추출: 위와 동일

**The Atlantic (총 4개):**
- https://www.theatlantic.com/science/
- 최근 Science 섹션 기사만

**추출 방법:**
```javascript
// browser_evaluate 예시 (New Scientist)
Array.from(document.querySelectorAll('article.card, .ArticleListing'))
  .slice(0, 8)
  .map(el => ({
    title: el.querySelector('h2, h3')?.innerText,
    url: el.querySelector('a')?.href,
    summary: el.querySelector('p, .teaser')?.innerText,
    date: el.querySelector('time')?.getAttribute('datetime'),
  }))
```

각 사이트마다 DOM 구조가 바뀔 수 있으니 `browser_snapshot`으로 먼저 구조 파악 후 쿼리 조정.

### 3. 카테고리 분류 + 균형 배분

5개 카테고리:
- 천문우주 (astronomy, cosmology, space)
- 생명진화 (biology, evolution, ecology)
- 뇌심리 (neuroscience, psychology, cognition)
- 지구환경 (earth science, climate, geology)
- 물리화학 (physics, chemistry, materials)

LLM이 각 기사의 제목+요약을 보고 카테고리 1개 할당. 목표 분포:
- 각 카테고리당 5~7개 (총 30개 중 균형)
- 분류 불가능한 기사(의학/기술 등)는 제외하고 보충

### 4. `state/collected.json` 저장

```json
{
  "collected_at": "2026-04-23T14:30:00Z",
  "items": [
    {
      "id": "ns-001",
      "source": "New Scientist",
      "section": "News",
      "title": "...",
      "url": "https://www.newscientist.com/article/...",
      "summary": "...",
      "published": "2026-04-22",
      "category": "천문우주"
    },
    ...
  ]
}
```

### 5. `state/selector.html` 생성

`templates/selector.html`을 읽어 JavaScript `window.__ITEMS__ = [...]`에 `collected.json`의 items를 주입해 새 파일로 저장.

### 6. 브라우저에서 오픈

```
mcp__playwright__browser_navigate: file:///.claude/skills/finch-article/state/selector.html
```

사용자에게 안내:
```
"selector.html이 열렸습니다.
 30개 카드 중 6개에 슬롯 0~5를 지정해 주세요.
 '완료' 버튼을 누르면 JSON이 아래 textarea에 나타납니다.
 그걸 복사해서 이 채팅창에 붙여넣어 주세요."
```

### 7. 사용자 JSON 입력 대기

JSON이 들어오면 단계 B(`prompts/write.md`)로 넘어간다.

## 실패 복구

- 사이트 DOM이 바뀌어 추출 실패 시: `browser_snapshot`으로 현재 구조 파악 후 셀렉터 갱신
- 로그인 세션 만료 시: 사용자에게 재로그인 요청
- `collected.json`이 이미 있으면: 사용자에게 "기존 수집 결과를 쓸까요 새로 수집할까요?" 확인
