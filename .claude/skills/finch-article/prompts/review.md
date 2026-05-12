# 검증 프로토콜 (Publish 이전)

## 목적

8개 슬롯이 모두 작성된 후, **admin에 등록하기 전에** 각 기사를 독립 검증한다.
메인 세션이 아니라 code-reviewer 에이전트에 위임한다 (자기 승인 금지).

## 호출 방식

각 슬롯마다 **개별 호출** (8회):

```
Agent({
  subagent_type: "oh-my-claudecode:code-reviewer",
  model: "opus",
  description: "슬롯 N 기사 검증",
  prompt: `
  [역할] finch.co.kr 기사를 admin 등록 전 마지막 검증한다.

  [필수 읽기]
  - .claude/skills/finch-article/style-guide.md

  [검증 대상]
  .claude/skills/finch-article/state/slot-{SLOT}.json

  [검증 항목 — 모두 통과해야 PASS]

  1. 스타일 체크 (style-guide.md §10 체크리스트 전부)
     - 훅이 구체적 수치·장면으로 시작하는가
     - 종결어 2종 이상 섞였는가 (~합니다만 반복 금지)
     - 과학자 이름이 한글+영문+소속으로 나오는가
     - 한 문단이 6문장을 넘지 않는가
     - 엔딩이 시그니처("과학드림이었습니다" 등)로 끝나지 않는가
     - em-dash('—') / en-dash('–') 미사용 (§4)
     - 작은따옴표 단순 명사에 남용 없음 (§4)
     - **괄호 영어 병기가 기사 본문 전체에서 7개 미만, 같은 용어 반복 병기 없음** (§5-1)

  2. 표절 리스크 체크
     - 원문 URL을 Playwright로 다시 열어 본문 샘플 수집
     - 우리 기사의 핵심 10문장을 원문 문장과 대조
     - 어휘·구조 유사도 판단 (같은 순서의 같은 정보 나열이면 FAIL)
     - 수치·인명·연도는 같아야 정상, 문장 구조는 달라야 함

  3. 사실 확인
     - sources.papers의 DOI가 실재하는지 1개 이상 확인 (Playwright로 doi.org/{DOI} 접속)
     - 수치에 단위가 빠졌거나 오타가 있는지

  4. 이미지 라이선스
     - sources.images 전부가 Wikimedia/NASA/ESA/Unsplash인지
     - 원문 사이트(newscientist.com, scientificamerican.com, theatlantic.com) 도메인이 하나라도 포함되면 즉시 FAIL
     - 캡션에 출처·라이선스·저자 표기 있는지

  5. HTML 포맷
     - ql-align-center 클래스가 이미지+캡션 문단에 붙었는지
     - 참고문헌이 <h3>참고문헌</h3> + 학술 논문만으로 구성됐는지 (언론 원문 링크 금지)

  [출력]
  state/slot-{SLOT}.review.json 생성:
  {
    "slot": N,
    "verdict": "PASS" | "FAIL",
    "issues": [
      {"severity": "high|medium|low", "category": "style|plagiarism|facts|images|html", "description": "...", "fix_suggestion": "..."}
    ],
    "plagiarism_similarity_score": 0.0-1.0,
    "checked_at": "ISO datetime"
  }

  [FAIL이 나왔을 때]
  메인 세션에 수정 요청. 메인 세션은 write.md 에이전트를 재호출하여 해당 슬롯만 재작성.
  `
})
```

## 메인 세션 처리

- 8개 review.json 전부 PASS면 → publish.md 진행
- 하나라도 FAIL이면 → 해당 슬롯만 write 에이전트 재호출 (최대 2회 재시도)
- 2회 재시도 후에도 FAIL이면 사용자에게 수동 검토 요청
