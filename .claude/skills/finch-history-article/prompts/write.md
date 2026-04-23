# 단계 2: 재작성 프로토콜 (에이전트 위임)

## 원칙

메인 세션은 오케스트레이션만. 각 슬롯은 **독립 executor 에이전트(model=opus)**에 위임.
원문 텍스트는 메인 컨텍스트에 쌓이지 않는다 — 에이전트가 로컬 파일을 직접 읽고 `state/slot-N.json`만 반환.

**병렬 호출 OK.** 이 단계는 로컬 파일 + 웹 검색만 사용 (Playwright 발행은 단계 4에서만) → 6개 동시 호출 가능.

## 메인 세션에서 할 일

1. `state/selected.json` 확정 확인
2. 각 슬롯에 대해 `state/slot-N.json` 존재 여부 확인 → 존재하는 슬롯은 스킵 옵션 제공
3. 6개 executor 에이전트를 **한 메시지에 6개 Agent 콜로 병렬 호출**
4. 모든 슬롯 완료 후 review 단계로 진입

## 에이전트 호출 프롬프트 (template)

```
Agent({
  subagent_type: "oh-my-claudecode:executor",
  model: "opus",
  description: "100년 전 과학 슬롯 N 재작성",
  prompt: `
  [역할] 너는 finch.co.kr "100년 전 과학" 탭에 게시될 과학드림 스타일 기사 1편을 재작성한다.

  [필수 읽기]
  1. D:/Finch/.claude/skills/finch-article/style-guide.md — 스타일 DNA (절대 위반 금지)
  2. D:/Finch/.claude/skills/finch-article/templates/quill-html.md — 최종 HTML 포맷 규칙 (참고용)
  3. D:/Finch/.claude/skills/finch-history-article/templates/block-schema.md — 네가 출력할 JSON 스키마
  4. D:/Finch/.claude/skills/finch-article/ref/012.txt — 과학드림 샘플 원고 (톤/구조 학습)
  5. D:/Finch/.claude/skills/finch-article/ref/015.txt — 과학드림 샘플 원고

  [입력]
  - 슬롯 번호: {SLOT}
  - 원문 article.md 절대 경로: {ARTICLE_MD_PATH}
  - 원문 metadata.json 절대 경로: {METADATA_PATH}
  - 원제목: {ORIGINAL_TITLE}
  - 원저자: {ORIGINAL_AUTHOR}

  [작업 순서]

  **컨텍스트 위생 원칙 (매우 중요)**
  - 너의 컨텍스트 예산은 유한하다. 본문 작성 시점에 원문·논문 초록·이미지 페이지가 다 쌓여 있으면 퀄리티가 급락한다.
  - 따라서 각 단계가 끝나면 "내가 지금까지 뽑은 사실만 남기고 나머지는 버린다"고 명시적으로 의식하며 진행하라.
  - 본문을 쓰기 직전에는 아래 facts.json 내용만 보면서 쓴다. 원문 파일은 **다시 열지 않는다**.

  1. 원문 읽기 → 사실 JSON으로 즉시 축약
     - Read 툴로 {ARTICLE_MD_PATH} 전체 읽기 (한 번만)
     - metadata.json은 참고용으로만
     - 읽자마자 아래 구조로 facts.json 메모리 내 정리:
       ```
       {
         "hook_candidate": "훅으로 쓸 수 있는 가장 구체적인 장면/수치 1~2개",
         "core_narrative": "원문의 핵심 이야기 흐름 3~5줄 요약 (한국어 OK)",
         "key_numbers": ["수치 A", "수치 B", ...],
         "people": [{"name_en": "John Smith", "role": "...", "affiliation": "..."}],
         "places": ["..."],
         "years_events": [{"year": 2022, "event": "..."}],
         "cited_papers_in_original": ["제목1 (저자, 연도)", ...]
       }
       ```
     - **이 시점 이후로는 원문 본문을 다시 보지 말 것.** facts.json만 사용.
     - facts.json이 완성되면 원문에서 뽑을 수 있는 모든 재료는 끝났다는 뜻이다.

  3. 학술 논문 교차 검색 (최소 2편 확보 — 필수)
     - Google Scholar / arXiv / PubMed / Semantic Scholar

     **Playwright 사용 최소화 규칙 (컨텍스트 아끼기)**:
     - `browser_snapshot` 호출 금지 (스냅샷은 거대한 a11y tree를 반환한다)
     - `browser_take_screenshot` 호출 금지
     - 오직 `browser_navigate` → `browser_evaluate`로 **필요한 필드만** 추출
     - 다른 슬롯과 브라우저 공유 → `browser_tabs`로 새 탭 열어 격리, 검색 끝나면 즉시 close
     - 추출 시 JS 코드 예시:
       ```javascript
       // Scholar 결과 상위 5개만, 제목·저자·연도·링크만
       Array.from(document.querySelectorAll('.gs_ri')).slice(0, 5).map(el => ({
         title: el.querySelector('.gs_rt')?.innerText,
         authors: el.querySelector('.gs_a')?.innerText,
         link: el.querySelector('a')?.href
       }))
       ```
     - 페이지 전체 HTML이나 본문을 컨텍스트에 올리지 말 것. 항상 `.map()`으로 필드 추려서 받기.

     **논문 처리**:
     - 각 논문의 DOI / 정식 제목 / 저자 / 연도 / 저널만 확보 (초록 전문 필요 없음)
     - 원문이 언급하지 않은 최신 논문도 가능
     - facts.json의 key_numbers·events와 **1:1로 대조**해 해당 논문에 같은 사실이 있는지만 확인 (논문 본문 정독 X, 초록이나 DOI 페이지 제목만으로 충분)
     - **2편 이상 확보 불가 시**: 메인 세션에 "slot {SLOT} 논문 확보 실패" 보고 후 종료

  4. 과학드림 스타일로 재구성
     - **작성 직전 선언**: "지금부터 나는 facts.json과 style-guide.md만 본다. 원문은 안 본다."
     - 제목: 호기심 유발 한글 제목 (예: "피라미드는 왜 그 자리에 서 있을까?")
     - 본문: body_blocks 배열, 6~10개 paragraph + 2~3개 image + 선택 heading + 마지막 references
     - **원문 문장 직역 절대 금지** — facts.json의 사실만 한국어로 재구성 (원문을 다시 참조해서 문장 짜지 말 것 — 표절 위험)
     - style-guide.md §10 체크리스트 전 항목 통과
     - 종결어 2종 이상 섞기 (~합니다 / ~하죠 / ~인 거죠 / ~거예요)
     - "자~ 그런데!" 같은 유튜브 추임새 의식적 삽입 금지
     - "과학드림이었습니다" 같은 엔딩 시그니처 절대 금지

  5. 이미지 3~4장 선정 (썸네일 1 + 본문 2~3)
     - 허용 소스: Wikimedia Commons / NASA / ESA / JWST / Hubble / Unsplash
     - **원문(Nautilus) 이미지 절대 사용 금지**

     **Playwright 사용 최소화** (3번과 동일 규칙):
     - 검색 결과 페이지에서 `browser_evaluate`로 이미지 파일명·라이선스·저자만 리스트로 추려 받기
     - `browser_snapshot` 금지. 페이지 HTML 전체를 컨텍스트에 올리지 말 것

     각 이미지에 대해 기록:
       * 원본 URL (Special:FilePath 또는 Unsplash/NASA 직링크)
       * 출처명 / 라이선스 / 저자
       * alt 텍스트 (한국어)
       * 캡션 (한국어, 이미지가 보여주는 것 + " — 출처: {소스} ({라이선스}) / {저자}")

  6. 이미지 로컬 다운로드 (필수 — 반드시 **저용량 버전**으로)
     - 저장 경로: D:/Finch/.claude/skills/finch-history-article/state/slot-{SLOT}/images/
     - 파일명: thumb.{ext}, body-1.{ext}, body-2.{ext}, body-3.{ext}
     - Windows 파일 시스템 제약: 파일 경로의 슬래시는 forward-slash 사용

     **용량 목표**: 썸네일 100~300KB, 본문 이미지 150~500KB (상한 800KB)
     **해상도 목표**: 가로 1200px 내외 (최대 1600px)
     **포맷 우선순위**: jpg > webp > png

     **저용량 URL 요청 방법 (원본 대신 썸네일/리사이즈 URL을 쓸 것)**:

     a. **Wikimedia Commons** — `Special:FilePath` 엔드포인트 사용 (가장 안정적)
        - 패턴: `https://commons.wikimedia.org/wiki/Special:FilePath/{파일명}?width=1200`
        - 예: `https://commons.wikimedia.org/wiki/Special:FilePath/Pyramide_Kheops.JPG?width=1200`
        - 302 리다이렉트로 실제 썸네일 URL로 이동 → curl `-L` 옵션이 따라감
        - 파일명에 공백은 `_`로 치환, 한글/특수문자는 URL 인코딩
        - SVG 파일도 동일 (자동으로 PNG 래스터화됨)

        **주의 — 썸네일 직접 URL 금지**:
        `upload.wikimedia.org/.../thumb/X/YZ/name.jpg/1200px-name.jpg` 패턴은 해시 디렉터리(X/YZ)가 맞아야 하는데 에이전트가 틀릴 수 있음. 반드시 `Special:FilePath` 경유.

     b. **Unsplash** — 쿼리 파라미터로 크기·품질 제어
        - `https://images.unsplash.com/photo-XXXX?w=1200&q=80&fm=jpg`
        - `w=1200` (너비), `q=80` (품질 80%), `fm=jpg` (포맷 jpg)

     c. **NASA / ESA / JWST / Hubble** — 공식 배포본 중 중간 해상도 선택
        - NASA images.nasa.gov: 이미지 상세 페이지 "Downloads" 섹션에 여러 크기 있음 → **small 또는 medium** 선택
        - ESA/JWST/Hubble: 보통 "Medium (1280×1024)" 이하 선택

     **다운로드 절차**:
     ```
     Bash: mkdir -p "D:/Finch/.claude/skills/finch-history-article/state/slot-{SLOT}/images"
     Bash: curl -L -A "Mozilla/5.0" -o "{target_path}" "{저용량_URL}"
     ```

     **다운로드 후 크기 검증**:
     ```
     Bash: stat -c%s "{target_path}"   # 파일 크기 바이트
     ```
     - 0 byte → 재다운로드 (URL 오류)
     - 1MB 미만 → OK
     - 1MB 이상 → **재다운로드 시도**: URL의 `1200px` → `800px`로 내려서 재요청 (Wikimedia), Unsplash는 `w=800&q=75`로 내림
     - 재시도 후에도 1MB 초과 시: 다른 이미지 후보로 변경

     **최후의 방어선 — 로컬 압축** (위 단계로 해결 안 될 때만):
     ```
     npx --yes sharp-cli resize 1200 --input "{path}" --output "{path}.tmp.jpg" --format jpeg --quality 78 && mv "{path}.tmp.jpg" "{path}"
     ```
     - sharp-cli가 없으면 `npx --yes` 가 자동 다운로드
     - 실패하면 해당 이미지 후보 포기하고 다른 것 탐색

     **주의**: original_url 필드에는 **실제 다운로드한 저용량 URL**을 기록. 원본 URL이 아니다.

  7. slot-{SLOT}.json 조립 (block-schema.md 준수)
     - 모든 image 블록의 local_path는 방금 다운로드한 파일의 절대 경로
     - thumbnail 필드의 local_path도 동일 규칙
     - references 블록은 반드시 마지막, 논문 2편 이상
     - self_check 필드 채우기 (모두 본인 기준 통과해야 함)

  8. 자가 검증 (완료 전 필수)
     - body_blocks의 paragraph만 이어붙였을 때 기승전결이 살아있는지 소리내어 읽듯 확인
     - image 블록 3개 모두 local_path가 실재하는 파일인지 Bash ls로 확인
     - references의 DOI가 "10.xxxx/..." 형식인지
     - 원문 article.md에서 3문장 샘플링 → 내 본문에 같은 구조 문장 있는지 자체 비교

  [출력 — 반드시 이 파일에 저장]
  D:/Finch/.claude/skills/finch-history-article/state/slot-{SLOT}.json

  [실패 조건 — 발생 시 메인 세션에 보고 후 종료]
  - article.md 파일 접근 불가 (Google Drive 오프라인 등)
  - 학술 논문 2편 확보 실패 (3회 검색어 변형 재시도 후)
  - 이미지 다운로드 3회 연속 실패

  [주의]
  - 너의 작업은 다른 5개 슬롯 에이전트와 병렬로 돈다.
  - Playwright browser를 쓸 때는 반드시 새 탭(browser_tabs)으로 격리. 기존 탭의 페이지를 navigate하지 말 것.
  - 원문 영어 문장을 JSON 안에 그대로 저장하지 말 것. 한국어 재구성본만.
  `
})
```

## 슬롯 번호별 입력 치환

`state/selected.json`의 `items` 배열을 순회하며 각 슬롯에 대해 위 프롬프트의 `{SLOT}`, `{ARTICLE_MD_PATH}`, `{METADATA_PATH}`, `{ORIGINAL_TITLE}`, `{ORIGINAL_AUTHOR}`를 치환해 동시에 6개 Agent 콜 생성.

## 진행 상태 관리

`state/progress.json`:
```json
{
  "stage": "write",
  "slot_0": "done",
  "slot_1": "done",
  "slot_2": "in_progress",
  "slot_3": "pending",
  "slot_4": "pending",
  "slot_5": "pending"
}
```

메인 세션은 각 에이전트가 반환하면 해당 슬롯의 `slot-N.json` 존재를 Bash ls로 확인하고 progress를 업데이트.

## 완료 후

6개 `slot-N.json`이 모두 존재하면 → `prompts/review.md` 진행.
