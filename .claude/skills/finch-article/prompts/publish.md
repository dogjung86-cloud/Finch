# 발행 프로토콜 (Playwright admin 자동 등록)

## 전제 조건

- `state/slot-0.json` ~ `state/slot-5.json` 모두 존재
- `state/slot-N.review.json` 전부 verdict="PASS"
- Playwright 브라우저가 열려 있고 finch admin에 로그인된 상태

## 절차

### 1. admin 페이지 진입

admin URL은 `config.json`의 `admin_url` 필드에서 읽는다 (기본 `https://www.finch.co.kr/admin`).

```
mcp__playwright__browser_navigate: <config.admin_url>
mcp__playwright__browser_snapshot (화면 확인)
```

로그인 체크: "새 기사 작성" 버튼 존재 여부로 판단.
없으면 사용자에게 재로그인 요청.

### 2. 각 슬롯 등록 (0 → 5 순차)

각 슬롯마다 아래 반복:

#### 2-1. 새 기사 작성 진입
```
mcp__playwright__browser_click: "새 기사 작성" 또는 "+ 새 기사 작성" 버튼
```

#### 2-2. 제목 입력
```
browser_fill_form:
  - input[placeholder="기사 제목을 입력하세요"] ← slot-N.json.title
```

#### 2-3. 카테고리 선택
```
browser_select_option:
  - select (카테고리 드롭다운) ← slot-N.json.category
```

값은 다음 중 하나여야 함: 천문우주, 생명진화, 뇌심리, 지구환경, 물리화학

#### 2-4. 표시 순서 입력 (슬롯 번호)
```
browser_fill_form:
  - input[type="number"] (표시 순서) ← slot-N.json.display_order (=N)
```

#### 2-5. 썸네일 URL 입력
```
browser_fill_form:
  - input[placeholder="https://..."] (URL 직접 입력) ← slot-N.json.thumbnail
```

업로드 대신 URL 직접 입력 방식 사용.

#### 2-6. 발췌문 입력
```
browser_fill_form:
  - textarea[placeholder="기사의 간략한 요약을 입력하세요"] ← slot-N.json.excerpt
```

#### 2-7. 본문 입력 (Quill 에디터)

Quill은 일반 textarea가 아니므로 `browser_evaluate`로 직접 HTML 주입:

```javascript
mcp__playwright__browser_evaluate:
  `
  const quillEditor = document.querySelector('.ql-editor');
  if (!quillEditor) throw new Error('Quill editor not found');
  quillEditor.innerHTML = ${JSON.stringify(slot_N_full_content)};
  // React state 동기화를 위해 input 이벤트 발생
  quillEditor.dispatchEvent(new Event('input', { bubbles: true }));
  // Quill 내부 state 갱신
  if (window.Quill) {
    const instance = Quill.find(quillEditor.parentElement);
    if (instance) instance.clipboard.dangerouslyPasteHTML(${JSON.stringify(slot_N_full_content)});
  }
  `
```

**주의:** ReactQuill은 controlled component이므로 DOM 직접 주입만으로는 state가 갱신 안 될 수 있다.
실패 시 대안: Quill 에디터에 focus → `browser_press_key(Ctrl+A)` → `browser_type(HTML)` — 단 이 경우 태그가 텍스트로 들어가므로 부적절.

**권장 우회책:** Quill instance에 접근해 `setContents` 또는 `clipboard.dangerouslyPasteHTML` 호출.

#### 2-8. 공개 체크박스 확인
`is_published: true` 이면 이미 기본 체크 상태. 아니라면 해제.
`is_membership: false` 이면 기본 해제 상태.

#### 2-9. 저장
```
browser_click: "기사 작성" 버튼
```

저장 완료 대기:
```
browser_wait_for: 텍스트 "기사 관리" 또는 목록 페이지로 복귀
```

#### 2-10. 검증
목록 페이지에서 방금 입력한 제목이 보이는지 확인:
```
browser_evaluate: Array.from(document.querySelectorAll('td')).some(td => td.textContent.includes(title))
```

실패 시 `state/publish-errors.json`에 기록하고 다음 슬롯 계속.

### 3. 전체 완료 리포트

모든 슬롯 처리 후 사용자에게:
```
완료: 슬롯 0~5 기사 등록 성공
- 슬롯 0: {제목} ✓
- 슬롯 1: {제목} ✓
...
실패 슬롯: [있으면 나열]
admin 페이지에서 최종 확인 부탁드립니다.
```

마지막으로 홈페이지 revalidate 트리거 확인:
- AdminPage.jsx의 handleSave가 `revalidatePaths(['/', '/articles', ...])`를 호출하므로 별도 작업 불필요.

## 실패 시 복구

- Quill HTML 주입 실패: `state/publish-errors.json`에 slot 번호와 HTML 저장, 사용자에게 수동 붙여넣기 안내
- 저장 버튼 클릭 후 에러 토스트: 에러 메시지 캡처해서 보고
- 세션 만료 시: 사용자에게 재로그인 요청 후 실패 슬롯부터 재개

## 정리

6개 전부 성공 시 `state/progress.json`을 `state/completed-{timestamp}.json`으로 이동해 다음 실행과 격리.
