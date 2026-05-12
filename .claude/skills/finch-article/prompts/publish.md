# 발행 프로토콜 (Playwright admin 자동 등록)

## 전제 조건

- `state/slot-0.json` ~ `state/slot-7.json` 모두 존재
- 각 슬롯마다 **로컬 다운로드된 이미지 파일**이 `state/slot-N/images/` 아래 준비됨:
  - `thumb.{ext}` (썸네일)
  - `body-1.{ext}`, `body-2.{ext}`, `body-3.{ext}` (본문 이미지)
- `slot-N.json` 의 `sources.images[].local_path` / `sources.thumbnail_source.local_path` 가 **절대 경로**로 기록돼 있음
- `state/slot-N.review.json` 전부 verdict="PASS"
- Playwright 브라우저가 열려 있고 finch admin에 로그인된 상태

## 핵심 원칙: URL 직접 입력 금지

**모든 이미지는 admin UI의 파일 업로드 플로우를 거쳐 `article-thumbnails` Supabase 버킷에 업로드되어야 한다.**

- 썸네일: `<input id="thumb-file-input" type="file">` 에 `browser_file_upload` → 드롭존 컴포넌트가 자동으로 Supabase 업로드 후 `formData.thumbnail`에 URL 세팅 → "또는 URL 직접 입력" 필드에 자동 반영
- 본문 이미지: Quill 툴바의 이미지 버튼(`button.ql-image`) 클릭 → 동적으로 생성되는 `<input type=file>`에 `browser_file_upload` → AdminPage의 `imageHandler`가 `uploadImage()`로 Supabase 업로드 후 `editor.insertEmbed(range.index, 'image', supabase_url)` 수행

> ⚠️ 버킷: AdminPage가 `article-thumbnails` 버킷에 하드코딩. HistoryAdmin의 `finch-100-years-ago` 와는 **다른 버킷**. 자동 분리되므로 설정 불필요.

## 절차

### 1. admin 페이지 진입

admin URL은 `config.json`의 `admin_url` 필드에서 읽는다 (기본 `https://www.finch.co.kr/admin`).

```
mcp__playwright__browser_navigate: <config.admin_url>
mcp__playwright__browser_snapshot (화면 확인)
```

로그인 체크: "새 기사 작성" 버튼 존재 여부로 판단. 없으면 사용자에게 재로그인 요청.

**기본 탭이 일반 기사 탭인지 확인**: HistoryAdmin 탭("100년 전 과학")이 아니라 일반 AdminPage("기사 관리")여야 함.

### 2. 각 슬롯 등록 (0 → 7 순차)

각 슬롯마다 아래 반복.

#### 2-1. 새 기사 작성 진입
```
browser_click: "+ 새 기사 작성" 버튼
browser_wait_for: "새 기사 작성" 텍스트 (폼 열렸는지 확인)
```

#### 2-2. 제목 입력

```javascript
// React controlled input 대응 — native setter 사용
browser_evaluate:
  const titleInput = document.querySelector('input[placeholder="기사 제목을 입력하세요"]');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(titleInput, slot.title);
  titleInput.dispatchEvent(new Event('input', { bubbles: true }));
```

#### 2-3. 카테고리 선택

```javascript
browser_evaluate:
  const sel = document.querySelector('select.admin-form__select');
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
  setter.call(sel, slot.category);  // '천문우주' | '생명진화' | '뇌심리' | '지구환경' | '물리화학'
  sel.dispatchEvent(new Event('change', { bubbles: true }));
```

#### 2-4. 표시 순서 입력 (슬롯 번호)

```javascript
browser_evaluate:
  const num = document.querySelector('input.admin-form__input[type="number"]');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(num, String(slot.display_order));  // = N
  num.dispatchEvent(new Event('input', { bubbles: true }));
```

#### 2-5. 썸네일 파일 업로드 (Supabase 업로드 → URL 자동 획득)

```
browser_file_upload:
  paths: [slot.sources.thumbnail_source.local_path]   // 절대 경로
```

AdminPage의 드롭존(`<input id="thumb-file-input" type="file" style="display:none">`)이 이 파일을 받아 `uploadImage(file, 'thumbnails')` 호출 → Supabase `article-thumbnails/thumbnails/{timestamp}_{rand}.{ext}` 에 저장 → `formData.thumbnail` 에 Supabase 공개 URL 세팅.

업로드 완료 대기 (Supabase 왕복 시간):
```
browser_wait_for:
  텍스트 조건: 드롭존에 "클릭하거나 새 이미지를 드래그하여 변경" 텍스트 출현 (업로드 완료 시 나타남)
  최대 대기: 30초
```

또는 URL 입력 필드(`input[placeholder="https://..."]`) 의 value 변화를 polling:
```javascript
browser_evaluate:
  const urlInput = document.querySelector('input[placeholder="https://..."]');
  return urlInput.value;   // https://xxx.supabase.co/storage/v1/object/public/article-thumbnails/... 가 나타나면 성공
```

업로드 실패 시: `file_upload` 못 찾으면 드롭존 div (`.admin-form__dropzone`) 를 `browser_click` 후 재시도.

#### 2-6. 발췌문 입력

```javascript
browser_evaluate:
  const ta = document.querySelector('textarea[placeholder="기사의 간략한 요약을 입력하세요"]');
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
  setter.call(ta, slot.excerpt);
  ta.dispatchEvent(new Event('input', { bubbles: true }));
```

#### 2-7. 본문 이미지 사전 업로드 (Supabase URL 획득) — 핵심

`slot.full_content` HTML 문자열 안에는 `<img src="Wikimedia/Unsplash-URL">` 들이 포함돼 있다. 이를 admin에 그대로 넣으면 외부 CDN 참조가 되므로, **발행 전에 Supabase URL로 치환**해야 한다.

전략: Quill 에디터에 이미지를 **하나씩 업로드-회수-제거** 하며 매핑 테이블을 만든다.

```javascript
// 스텝 1: full_content 에서 img src 순서대로 추출
const htmlSrcs = [...slot.full_content.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1]);
// htmlSrcs 순서 === slot.sources.images[] 순서 (작성 규칙)
```

각 본문 이미지(`body-1`, `body-2`, `body-3` ...)에 대해:

(a) Quill 에디터에 포커스:
```
browser_click: div.ql-editor
```

(b) 툴바 이미지 버튼 클릭:
```
browser_click: button.ql-image
```

(c) `imageHandler` 가 `document.createElement('input')` 로 동적 file input 을 만들고 `click()`. Playwright 는 **대기 중인 file chooser** 를 자동 감지:
```
browser_file_upload:
  paths: [slot.sources.images[i].local_path]
```

(d) 업로드 완료 대기 — `editor.insertEmbed(range.index, 'image', supabase_url)` 수행됨:
```javascript
browser_wait_for:
  조건: .ql-editor 내부에 새 img 태그 출현
  검증: browser_evaluate 로 마지막 img의 src 읽기 → 'supabase' 문자열 포함 확인
  최대 대기: 30초

browser_evaluate:
  const imgs = document.querySelectorAll('.ql-editor img');
  const lastImg = imgs[imgs.length - 1];
  return lastImg.src;  // Supabase URL
```

(e) 방금 받은 Supabase URL 을 **URL 매핑 테이블** 에 기록:
```javascript
urlMap[htmlSrcs[i]] = supabaseUrl;
```

(f) 다음 이미지를 위해 에디터 비우기:
```javascript
browser_evaluate:
  const quill = <fiber 로 찾은 Quill instance>;
  quill.setContents([], 'api');
```

(g) 다음 이미지로 반복.

**모든 본문 이미지 업로드 완료 시 `urlMap` 은 { 원본 Wikimedia URL → Supabase URL } 매핑 보유.**

#### 2-8. full_content HTML 문자열의 img src 치환

```javascript
let finalHtml = slot.full_content;
for (const [oldSrc, newSrc] of Object.entries(urlMap)) {
  finalHtml = finalHtml.split(oldSrc).join(newSrc);  // 단순 문자열 치환 (정규식 특수문자 회피)
}
```

#### 2-9. 치환된 HTML 을 Quill 에 최종 주입

```javascript
browser_evaluate:
  const qlContainer = document.querySelector('.ql-container');
  const qlEditor = document.querySelector('.ql-editor');
  // React fiber 로 Quill instance 찾기
  let quill = null;
  let node = qlEditor;
  while (node && !quill) {
    const fiberKey = Object.keys(node).find(k => k.startsWith('__reactFiber'));
    if (fiberKey) {
      let fiber = node[fiberKey];
      while (fiber && !quill) {
        const sn = fiber.stateNode;
        if (sn && sn.editor && typeof sn.editor.getContents === 'function') quill = sn.editor;
        if (!quill && sn && typeof sn.getEditor === 'function') {
          try { const ed = sn.getEditor(); if (ed) quill = ed; } catch(e){}
        }
        fiber = fiber.return;
      }
    }
    node = node.parentElement;
  }
  if (!quill) throw new Error('Quill instance not found');
  quill.setContents([], 'api');
  quill.clipboard.dangerouslyPasteHTML(0, finalHtml, 'user');
```

#### 2-10. 공개 체크박스 확인
- `is_published: true` 이면 기본 체크 상태 → 확인만
- `is_membership: false` 이면 기본 해제 상태 → 확인만

#### 2-11. 저장

```
browser_click: "기사 작성" 버튼 (정확 텍스트 매치)
browser_wait_for: "기사 관리" 텍스트 출현 (목록 페이지 복귀)
```

#### 2-12. 검증

목록 페이지에서 방금 등록한 제목 존재 확인:
```javascript
browser_evaluate:
  const rows = Array.from(document.querySelectorAll('.admin-table tbody tr'));
  const found = rows.some(tr => tr.innerText.includes(slot.title.slice(0, 30)));
  return found;
```

실패 시 `state/publish-errors.json` 에 기록하고 다음 슬롯 계속.

### 3. 전체 완료 리포트

8개 슬롯 처리 후 사용자에게:
```
완료: 슬롯 0~7 기사 등록
- 슬롯 0: {제목} ✓  (썸네일 + 본문 이미지 N장 → article-thumbnails 버킷)
- 슬롯 1: {제목} ✓
...
실패 슬롯: [있으면 나열]
```

AdminPage.jsx의 `handleSave` 가 자동으로 `revalidatePaths(['/', '/articles', ...])` 호출하므로 홈페이지 즉시 갱신됨.

## 실패 복구

- **file_upload 가 file input 을 못 찾음**: 버튼 클릭 → 파일 chooser 대기 중 → `browser_file_upload` 호출 (순서 중요). 그래도 안 되면 드롭존 div 를 직접 click 후 재시도.
- **Supabase 업로드 타임아웃**: 30초 대기해도 URL 못 얻으면 재시도 1회. 그래도 실패 시 해당 슬롯 스킵 + 기록.
- **Quill 에디터 clear 후 포커스 상실**: `browser_click: .ql-editor` 로 재포커스 후 이미지 버튼 클릭.
- **세션 만료**: 사용자에게 재로그인 요청 후 실패 슬롯부터 재개.

## 정리

6개 전부 성공 시 `state/progress.json`을 `state/completed-{timestamp}.json`으로 이동해 다음 실행과 격리.
