# 단계 3: 검증 프로토콜 (Publish 이전)

## 목적

6개 슬롯이 모두 작성된 후, **admin 등록 전에** 각 기사를 독립 검증한다.
메인 세션이 아니라 code-reviewer 에이전트에 위임 (자기 승인 금지).

## 호출 방식

각 슬롯마다 **개별 호출**이되 **병렬 가능** (서로 독립적 검증).
6개 Agent 콜을 한 메시지에 묶어 전송.

## 에이전트 호출 프롬프트

```
Agent({
  subagent_type: "oh-my-claudecode:code-reviewer",
  model: "opus",
  description: "슬롯 N 기사 검증",
  prompt: `
  [역할] finch.co.kr "100년 전 과학" 기사를 admin 등록 전 마지막 검증한다.

  [필수 읽기]
  1. D:/Finch/.claude/skills/finch-article/style-guide.md
  2. D:/Finch/.claude/skills/finch-history-article/templates/block-schema.md

  [검증 대상]
  - 작성본: D:/Finch/.claude/skills/finch-history-article/state/slot-{SLOT}.json
  - 원문: selected.json의 해당 슬롯 article_md_path

  [검증 항목 — 모두 통과해야 PASS]

  1. 스키마 준수 (block-schema.md)
     - title / thumbnail / body_blocks / self_check 필드 존재
     - body_blocks 첫 블록이 paragraph (훅)
     - 마지막 블록이 references
     - references.items 길이 ≥ 2
     - 모든 image 블록에 local_path, alt, caption, source, license, author 존재
     - thumbnail.local_path 존재

  2. 로컬 파일 실재 + 용량 확인
     - thumbnail.local_path 파일 존재 & 0 byte 아님 (Bash: ls -la)
     - 모든 image 블록 local_path 파일 존재 & 0 byte 아님
     - 파일 크기 체크 (Bash: stat -c%s {path}):
       * 40KB 미만 → 파손 의심, FAIL
       * 600KB 초과 → sharp 재압축 권고, medium severity issue
       * 본문 권장 100~200KB, 썸네일 권장 200~300KB
     - 해상도 체크 (선택): 본문 가로 700~1000px, 썸네일 900~1200px 권장

  3. 스타일 체크 (style-guide.md §10)
     - **첫 블록 = 썸네일 캡션 paragraph**인지 확인 (가운데 정렬·이탤릭 권장, 본문 위에 자동 삽입되는 썸네일 설명용)
     - paragraph 블록들을 이어붙였을 때:
       * 훅이 구체적 수치·장면으로 시작
       * 독자 질문 문장 2회 이상
       * 과학자 등장 시 한글+영문+소속 포맷
       * 한 문단 6문장 이하
       * 종결어 2종 이상 섞임
       * "자~ 그런데!" / "과학드림이었습니다" 부재
       * **§5-1 괄호 영어 병기 5개 이내** (본문에서 `\([A-Za-z]` 패턴 grep으로 카운트, 6개 이상이면 high severity FAIL)

  4. 표절 리스크 (핵심)
     - 원문 article.md를 Read 툴로 읽기
     - 원문에서 랜덤 10문장 샘플링
     - 우리 기사 paragraph 블록들과 대조
     - 판정 기준:
       * 같은 순서로 같은 정보를 나열하는가 → FAIL
       * 원문 고유 표현(특정 비유, 문장 구조)을 그대로 옮겼는가 → FAIL
       * 수치·인명·연도가 일치 → 정상 (사실이므로 같아야 함)
       * 문장 구조·어순·어휘 선택이 다르면 → PASS
     - 유사도 점수 기록 (체감 0.0~1.0, 0.3 이하 권장)

  5. 학술 논문 검증
     - references.items 전부가 "실제 DOI 형식"인지 (10.xxxx/xxxxx)
     - 최소 1편에 대해 Playwright로 https://doi.org/{DOI} 접속 → 논문 페이지가 실재하는지 확인
     - 실재하지 않는 DOI가 섞여 있으면 FAIL (환각 논문 방지)

  6. 이미지 라이선스
     - 모든 image 블록의 source가 Wikimedia Commons / NASA / ESA / JWST / Hubble / Unsplash 중 하나
     - original_url 도메인이 nautil.us / newscientist.com / scientificamerican.com / theatlantic.com 이면 즉시 FAIL
     - caption이 " — 출처: {소스} ({라이선스}) / {저자}" 패턴 포함

  [출력 — 반드시 이 파일에 저장]
  D:/Finch/.claude/skills/finch-history-article/state/slot-{SLOT}.review.json

  {
    "slot": N,
    "verdict": "PASS" | "FAIL",
    "issues": [
      {
        "severity": "high|medium|low",
        "category": "schema|files|style|plagiarism|papers|images",
        "description": "...",
        "fix_suggestion": "..."
      }
    ],
    "plagiarism_similarity_score": 0.0,
    "checked_at": "ISO datetime"
  }

  [FAIL 시]
  issues 배열에 상세 기록. 메인 세션이 해당 슬롯만 write 에이전트를 재호출한다.
  `
})
```

## 메인 세션 처리

- 6개 review.json 전부 PASS → `prompts/publish.md` 진행
- 하나라도 FAIL → 해당 슬롯만 write 에이전트 재호출 (최대 2회 재시도)
  - 재시도 시 issues 배열을 에이전트에 전달해 구체적으로 고치도록 지시
- 2회 재시도 후에도 FAIL → 사용자에게 수동 검토 요청

## 재시도 프롬프트 템플릿

```
Agent({
  subagent_type: "oh-my-claudecode:executor",
  model: "opus",
  description: "슬롯 N 재작성 (리뷰 피드백 반영)",
  prompt: `
  [재시도 컨텍스트]
  너는 이전에 슬롯 {SLOT}을 작성했고, reviewer가 아래 이슈를 제기했다.
  이슈 전부를 해결해 slot-{SLOT}.json을 덮어써라.

  [리뷰 결과 — 반드시 모두 해결]
  {review.json의 issues 배열을 그대로 삽입}

  [원본 작성 지시]
  D:/Finch/.claude/skills/finch-history-article/prompts/write.md 의 [작업 순서]를 그대로 따를 것.
  단 이번에는 위 이슈에 해당하는 부분을 최우선으로 고친다.
  `
})
```
