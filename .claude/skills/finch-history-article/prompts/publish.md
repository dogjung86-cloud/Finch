# 단계 4: 발행 프로토콜 (Playwright UI 업로드 플로우)

## 전제 조건

- `state/slot-0.json` ~ `state/slot-5.json` 모두 존재
- `state/slot-N.review.json` 모두 verdict="PASS"
- 모든 이미지 파일이 `state/slot-N/images/` 아래 실재
- Playwright 브라우저가 열려 있고 `finch.co.kr` admin에 로그인되어 있음

## 핵심 설계

**URL 직접 입력을 쓰지 않는다.** 모든 이미지는 admin UI의 파일 업로드 플로우를 거쳐 `finch-100-years-ago` Supabase 버킷에 업로드되어야 한다.

- **썸네일**: `<input id="history-thumb-input" type="file">` 에 `browser_file_upload` — 드롭존 컴포넌트가 자동으로 Supabase 업로드 후 `formData.thumbnail`에 URL 세팅
- **본문 이미지**: Quill 툴바의 이미지 버튼(`.ql-image`) 클릭 → 동적으로 생성되는 `<input type=file accept=image/*>`에 `browser_file_upload` → HistoryAdmin의 `imageHandler`가 업로드 후 커서 위치에 `<img src="supabase-url">` 삽입

**발행은 반드시 단일 브라우저에서 순차**. 병렬 금지.

## 절차

### 1. admin 진입

```
mcp__playwright__browser_navigate: https://finch.co.kr/admin
mcp__playwright__browser_snapshot
```

로그인 체크: 탭 버튼 "100년 전 과학" 텍스트 visible 여부로 판단. 없으면 사용자에게 재로그인 요청.

### 2. "100년 전 과학" 탭 클릭

```
mcp__playwright__browser_click: button.admin-tabs__btn (텍스트 "100년 전 과학")
mcp__playwright__browser_wait_for: 텍스트 "100년 전 과학 관리"
```

### 3. 각 슬롯 등록 (0 → 5 순차)

각 슬롯마다 아래 반복. slot-N.json을 Read로 로드해서 `blocks` 변수로 사용.

#### 3-1. "+ 새 항목 작성" 클릭
```
browser_click: button (텍스트 "+ 새 항목 작성")
browser_wait_for: 텍스트 "100년 전 과학 작성"
```

#### 3-2. 제목 입력
```
browser_snapshot → title input의 ref 확보
browser_type:
  element: 제목 입력란 (placeholder="예: 슈뢰딩거...")
  text: slot-N.title
```

#### 3-3. 썸네일 업로드

드롭존의 숨겨진 file input에 직접 업로드:

```
browser_file_upload:
  paths: [slot-N.thumbnail.local_path]
```

주의: HistoryAdmin의 드롭존은 내부에 `<input id="history-thumb-input" type="file" style="display:none">`을 가짐. Playwright는 display:none이어도 `file_upload`를 수용한다.

업로드 완료 대기 (uploadImage는 async — Supabase 왕복):
```
browser_wait_for: 드롭존에 썸네일 미리보기 이미지(img) 출현 (최대 30초)
```

만약 file_upload가 input을 못 찾으면 대안: 드롭존 div를 `browser_click`해서 file picker를 연 뒤 `browser_file_upload`.

#### 3-4. 본문 입력 (핵심 — 블록 순차 처리)

Quill 에디터 포커스:
```
browser_click: div.ql-editor (기사 본문 입력 영역)
```

각 `body_blocks` 항목을 순서대로 처리:

**(a) paragraph 블록**
```
browser_type:
  element: div.ql-editor
  text: block.text
browser_press_key: Enter
```

**(b) heading 블록 (선택)**
```
# Quill 툴바의 Header 드롭다운 선택
browser_evaluate: `
  const editor = document.querySelector('.ql-editor');
  const quill = Quill.find(editor);
  const range = quill.getSelection(true);
  quill.formatLine(range.index, 1, 'header', ${block.level});
`
browser_type: element=div.ql-editor, text=block.text
browser_press_key: Enter
# 다음 줄은 다시 일반 문단으로
browser_evaluate: `
  const editor = document.querySelector('.ql-editor');
  const quill = Quill.find(editor);
  const range = quill.getSelection(true);
  quill.formatLine(range.index, 1, 'header', false);
`
```

**(c) image 블록 — 파일 업로드 플로우**

a. 에디터에 focus가 있고 커서가 마지막 줄에 있어야 함
b. 툴바 이미지 버튼 클릭
```
browser_click: button.ql-image (Quill 툴바의 이미지 버튼)
```

c. imageHandler가 `document.createElement('input')`로 동적 파일 input을 만들고 `click()`한다.
   Playwright는 `browser_file_upload`로 이 input을 자동 처리 (대기 중인 file chooser 감지).
```
browser_file_upload:
  paths: [block.local_path]
```

d. 업로드 완료 대기 — `imageHandler`는 `uploadImage` 후 `editor.insertEmbed(range.index, 'image', url)` 수행. Supabase 왕복 시간 필요.
```
browser_wait_for: 에디터에 새 img 태그 출현 (방금 추가된 supabase URL)
(browser_evaluate로 last img의 src를 확인해 'finch-100-years-ago'가 포함되면 성공)
```

e. 이미지 다음 줄에 캡션 입력 — 이탤릭 + 가운데 정렬
```
browser_press_key: Enter  # 이미지 아래 새 줄 생성

# 가운데 정렬
browser_evaluate: `
  const editor = document.querySelector('.ql-editor');
  const quill = Quill.find(editor);
  const range = quill.getSelection(true);
  quill.format('align', 'center');
  quill.format('italic', true);
`

# 캡션 타이핑
browser_type: element=div.ql-editor, text=block.caption

# 다음 줄은 포맷 리셋 (다음 paragraph를 위해)
browser_press_key: Enter
browser_evaluate: `
  const editor = document.querySelector('.ql-editor');
  const quill = Quill.find(editor);
  const range = quill.getSelection(true);
  quill.format('align', false);
  quill.format('italic', false);
`
```

f. 이미지를 감싼 `<p>`도 `ql-align-center` 클래스가 붙어야 한다. Quill은 기본적으로 이미지 삽입 시 해당 라인에 align 포맷을 적용하지 않을 수 있음 → 이미지 삽입 직후 이미지 라인에 align center 명시:
```
browser_evaluate: `
  const editor = document.querySelector('.ql-editor');
  const quill = Quill.find(editor);
  # 방금 삽입된 이미지 라인으로 커서 이동
  const imgs = editor.querySelectorAll('img');
  const lastImg = imgs[imgs.length - 1];
  const blot = Quill.find(lastImg);
  const idx = quill.getIndex(blot);
  quill.setSelection(idx, 1);
  quill.format('align', 'center');
`
```

**(d) references 블록 — 마지막 블록, 고정 포맷**

```
# 본문 끝에 구분선(hr) — Quill 기본 toolbar엔 hr 없음, 생략하고 바로 H3 시작
browser_press_key: Enter

# H3 "참고문헌"
browser_evaluate: `
  const editor = document.querySelector('.ql-editor');
  const quill = Quill.find(editor);
  const range = quill.getSelection(true);
  quill.formatLine(range.index, 1, 'header', 3);
`
browser_type: element=div.ql-editor, text="참고문헌"
browser_press_key: Enter

# 다음 줄은 header 해제 + small size
browser_evaluate: `
  const editor = document.querySelector('.ql-editor');
  const quill = Quill.find(editor);
  const range = quill.getSelection(true);
  quill.formatLine(range.index, 1, 'header', false);
  quill.format('size', 'small');
`

# items를 개행으로 이어 붙여 타이핑
# 예: "1. Ghoneim, E., et al. (2022). \"The Nile's lost Ahramat Branch...\" Communications Earth & Environment. DOI: 10.1038/..."
for i, paper in enumerate(references.items):
  line = `${i+1}. ${paper.authors} (${paper.year}). "${paper.title}" ${paper.journal}. DOI: ${paper.doi}`
  browser_type: element=div.ql-editor, text=line
  browser_press_key: Shift+Enter   # 한 문단 안에서 줄바꿈 (<br>)

# 마지막에 size 해제
browser_press_key: Enter
browser_evaluate: `
  const editor = document.querySelector('.ql-editor');
  const quill = Quill.find(editor);
  const range = quill.getSelection(true);
  quill.format('size', false);
`
```

#### 3-5. 공개/멤버십 체크

기본값 유지:
- `is_published: true` → 이미 checked (건드리지 않음)
- `is_membership: false` → 이미 unchecked

값이 다르면 해당 체크박스를 browser_click.

#### 3-6. 저장

```
browser_click: button (텍스트 "작성")
browser_wait_for: 텍스트 "100년 전 과학 관리" (목록 페이지로 복귀)
```

저장 실패(admin-error 출현) 시:
- 에러 메시지 캡처 (`.admin-error` 텍스트)
- `state/publish-errors.json`에 slot 번호 + 에러 기록
- 다음 슬롯으로 계속 (중단하지 않음)

#### 3-7. 검증

목록에서 방금 입력한 제목이 보이는지 확인:
```
browser_evaluate: `
  Array.from(document.querySelectorAll('.admin-table__title-cell'))
    .some(td => td.textContent.includes(${JSON.stringify(slot.title)}))
`
```

### 4. 진행 상태 기록

매 슬롯마다 `state/progress.json` 업데이트:
```json
{
  "stage": "publish",
  "slot_0": "published",
  "slot_1": "publishing",
  ...
}
```

### 5. 완료 리포트

```
완료: "100년 전 과학" 탭에 6편 등록 성공

슬롯 0: {제목} ✓
슬롯 1: {제목} ✓
...
실패 슬롯: [있으면 나열]

홈페이지 revalidate는 HistoryAdmin.handleSave가 자동 트리거 (/, /history, /history/{id}).
```

## 실패 복구

- **파일 업로드 대기 타임아웃**: 네트워크 이슈. 30초 추가 대기 후 재시도. 3회 실패 시 해당 슬롯 skip.
- **Quill 이미지 버튼이 안 눌림**: `browser_snapshot`으로 툴바 DOM 확인 후 셀렉터 갱신 (`.ql-image` → `button[aria-label="Insert image"]` 등 대안).
- **H3/Header 포맷이 안 먹음**: React 상태와 Quill 내부 상태가 어긋남. `quill.setContents`로 재주입하는 대신, 에디터 전체를 clear 후 `clipboard.dangerouslyPasteHTML`로 fallback — 단 이 경우 이미지는 이미 Supabase URL로 들어간 상태여야 함.
- **세션 만료**: 사용자에게 재로그인 요청 후 실패 슬롯부터 재개.
- **이미지 삽입 순서 꼬임**: body_blocks를 한 방에 조립해서 `clipboard.dangerouslyPasteHTML`로 통째 주입하는 모드로 전환. 단 이미지는 먼저 전부 업로드한 Supabase URL로 치환해둬야 함. 이 fallback은 단계 4-fallback 모드로 별도 토글.

## 4-fallback 모드 (타이핑 플로우 실패 시)

1. 슬롯 N의 모든 이미지(썸네일 + 본문)를 먼저 업로드만 수행
   - 썸네일: 드롭존 file_upload → URL 확보 (formData.thumbnail에 세팅됨)
   - 본문 이미지: Quill 이미지 버튼 → file_upload를 각각 수행 → 에디터에 삽입된 img의 src를 evaluate로 회수 → 에디터는 즉시 다시 clear
2. body_blocks를 Quill HTML로 직렬화 (이미지 URL은 방금 받은 Supabase URL 사용)
3. `clipboard.dangerouslyPasteHTML`로 본문 전체 주입
4. React onChange 이벤트 강제 트리거 (`quill.emitter.emit('text-change')`)
5. 저장 클릭

이 모드는 캡션 이탤릭·가운데 정렬까지 HTML에 포함시킬 수 있어 안정적이다. 단 "UI 플로우를 거친다"는 원칙에서는 한 단계 우회하는 것.

## 정리

6개 전부 성공 시:
```
Bash: mv state/progress.json state/completed-$(date +%Y%m%d-%H%M%S).json
```

다음 실행과 아티팩트가 섞이지 않도록 격리.

## 발행 성공 이력 기록 (중요 — 중복 선택 방지)

**각 슬롯이 발행 성공할 때마다** `state/history.json`에 archive_dir을 append한다.
이 기록은 **다음 번 selector.html 생성 시** 해당 카드를 "이미 발행됨" 스탬프 + 클릭 불가 상태로 만든다.

### 파일 구조 (`state/history.json`)

```json
{
  "used_archive_dirs": [
    "G:/내 드라이브/Nautilus/History(노틸러스)/articles/001_The_Birth_of_Genius",
    "G:/내 드라이브/Nautilus/History(노틸러스)/articles/015_Bird_Poop_Powered_..."
  ],
  "used_at": {
    "G:/내 드라이브/Nautilus/History(노틸러스)/articles/001_The_Birth_of_Genius": "2026-04-23T14:35:22Z",
    "G:/내 드라이브/Nautilus/History(노틸러스)/articles/015_...": "2026-04-23T14:37:10Z"
  }
}
```

### 로직 (슬롯 N 발행 성공 직후 실행)

```javascript
// 각 슬롯 발행 성공 시
const HISTORY_PATH = 'D:/Finch/.claude/skills/finch-history-article/state/history.json';
const selectedPath = 'D:/Finch/.claude/skills/finch-history-article/state/selected.json';
const selected = JSON.parse(fs.readFileSync(selectedPath, 'utf8'));
const archiveDir = selected.items.find(it => it.slot === N).archive_dir;

let hist = { used_archive_dirs: [], used_at: {} };
if (fs.existsSync(HISTORY_PATH)) hist = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
if (!hist.used_archive_dirs.includes(archiveDir)) hist.used_archive_dirs.push(archiveDir);
hist.used_at[archiveDir] = new Date().toISOString();
fs.writeFileSync(HISTORY_PATH, JSON.stringify(hist, null, 2));
```

### 주의사항

- **발행이 완전히 성공했을 때만** 기록 (목록 페이지에서 제목 검증 통과 시)
- 저장 실패·Quill 주입 실패로 중단된 슬롯은 기록하지 않음 — 다음 실행에서 재사용 가능
- history.json을 수동으로 편집하거나 삭제하면 해당 기사를 다시 쓸 수 있음 (롤백 가능)
- 파일을 git에 커밋할지는 선택 (기본은 `.claude/`가 gitignore되어 있어 로컬 전용)
