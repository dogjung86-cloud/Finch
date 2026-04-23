# Quill HTML 포맷 규칙

finch ArticlePage는 `full_content` 필드를 `dangerouslySetInnerHTML`로 렌더링한다.
CSS 클래스와 구조가 정확히 맞아야 서체·캡션·이미지가 제대로 보인다.

## 일반 문단

```html
<p>본문 내용입니다. 평범한 서술형 문단이죠.</p>
```

- 폰트: Noto Serif KR (글로벌 CSS)
- 사이즈: 18/20/22/24px (독자가 토글, 기본 20px)
- 줄간격: 1.7
- 색상: #333 (라이트) / 다크모드 자동 대응

## 이미지 + 캡션 (핵심)

```html
<p class="ql-align-center">
  <img src="https://upload.wikimedia.org/..." alt="이미지 설명">
</p>
<p class="ql-align-center"><em>이미지 캡션 텍스트. 출처: Wikimedia Commons (CC BY-SA 4.0) / 저자명</em></p>
```

**중요한 규칙:**
- 이미지 감싸는 `<p>`는 **반드시 `class="ql-align-center"`**
- 캡션도 **반드시 `class="ql-align-center"`** 이고 내용을 **`<em>`**으로 감싼다
- 이 두 조건이 맞아야 CSS가 캡션을 회색·작은 글씨·이탤릭으로 렌더링 (globals.css 3133~3145 참조)
- 캡션은 이미지 문단 **바로 다음**에 와야 한다 (중간에 다른 요소 금지)

**캡션 내용 규칙:**
- 첫 부분: 이미지가 보여주는 것 1문장. 마침표로 종결.
- 뒤: ` 출처: {소스명} ({라이선스}) / {저자명}` (em-dash 사용 금지)
- 예: `<em>제임스웹 우주망원경이 포착한 용골자리 성운의 일부. 출처: NASA / ESA / CSA (Public Domain) / Webb Science Team</em>`

## 썸네일 규칙 (매우 중요)

- 썸네일 이미지 URL은 **오직 `thumbnail` 필드에만** 입력. `full_content` 본문에는 같은 이미지 `<img>` 태그를 절대 넣지 않는다.
  - 이유: ArticlePage는 본문에 썸네일이 포함돼 있지 않을 때 썸네일을 본문 앞에 자동 삽입한다. 본문에 또 넣으면 두 번 나온다.
- `full_content`의 **맨 첫 블록**은 썸네일 이미지에 대한 캡션이어야 한다.
  - 포맷: `<p class="ql-align-center"><em>썸네일 설명 1문장. 출처: ... (라이선스) / 저자</em></p>`
  - ArticlePage가 자동 삽입한 썸네일 바로 아래 이 캡션이 붙어 "사진 + 캡션" 쌍이 자연스럽게 완성된다.
- 그 다음에 본문 훅 문단(`<p>구체적 수치로 시작하는 훅...</p>`)이 온다.

## 소제목 (필요시)

```html
<h2>소제목 텍스트</h2>
```

- 24px, 굵게
- 자주 쓰지는 말 것 — 이야기 흐름을 끊는다
- 4~5문단마다 1개 정도가 적당

## 참고문헌 섹션 (본문 맨 끝)

```html
<hr>
<h3>참고문헌</h3>
<p class="ql-size-small">
1. Yonezawa, T., et al. (2009). "Title of paper." <em>Journal Name</em>, 396(1), 1-12. DOI: 10.1016/j.xxx<br>
2. Author, A., & Author, B. (2014). "Another paper." <em>Nature</em>, 510, 123-127. DOI: 10.1038/nature12345<br>
3. Author, C. (2023). "Third paper." <em>Science</em>, 380, 456-460. DOI: 10.1126/science.abc1234
</p>
```

- `<h3>참고문헌</h3>` 고정 제목
- `class="ql-size-small"` 로 14px 작게
- 각 줄 사이 `<br>`
- 저널명은 `<em>`로 이탤릭
- 2~4개가 적당
- **언론 원문 링크 절대 금지** — 학술 논문 DOI만

## 이미지 다운로드 URL 규칙 (write 단계에서만 사용)

> ℹ️ **참고**: 실제 기사에 들어가는 `<img src>`는 최종적으로 **Supabase `article-thumbnails` 버킷 URL**로 치환된다 (publish 단계). 아래 규칙은 **로컬 다운로드 소스 URL 선정**을 위한 것.

고해상도 원본 다운로드 금지. 반드시 저용량 URL을 사용.

1. **Wikimedia Commons** — Special:FilePath 엔드포인트
   - 금지: `https://upload.wikimedia.org/wikipedia/commons/...` (원본, 수 MB)
   - 금지: `https://upload.wikimedia.org/wikipedia/commons/thumb/.../1200px-...` (해시 디렉터리 오류 위험)
   - 권장 (다운로드): `https://commons.wikimedia.org/wiki/Special:FilePath/File_name.jpg?width=1200`
   - 파일명의 공백·괄호 등 특수문자는 URL-encode (`%20`, `%28`, `%29`) 유지

2. **Unsplash** — 쿼리 파라미터로 사이즈 지정
   - 권장: `https://images.unsplash.com/photo-xxx?w=1200&q=80&fm=jpg`
   - `fm=jpg` 로 포맷 강제 (브라우저별 WebP 이슈 회피)

3. **ESA Hubble / NASA Hubble** — 미리보기 사이즈 사용
   - ESA Hubble: `https://cdn.esahubble.org/archives/images/screen/heic####.jpg` (~100KB, 1280×800)
   - `/publicationjpg/`, `/large/`, `/wallpaper/` 사용 금지

**용량 기준**: 썸네일 100~300KB, 본문 150~500KB, 상한 800KB. 초과 시 `width` 줄여 재다운로드.

## 전체 기사 구조 예시 (스켈레톤)

```html
<p>훅 문단 — 구체적 수치·장면으로 시작합니다.</p>

<p>의문을 제기하는 문단. 독자가 궁금해할 질문을 명시하죠.</p>

<p class="ql-align-center">
  <img src="https://..." alt="...">
</p>
<p class="ql-align-center"><em>캡션 — 출처: ... / 라이선스 / 저자</em></p>

<p>배경 설명 문단 1.</p>

<p>배경 설명 문단 2.</p>

<p>연구진 등장 문단. 존 스미스(John Smith) 박사 연구팀은 2023년 《네이처》에 발표한 논문에서...</p>

<p class="ql-align-center">
  <img src="https://..." alt="...">
</p>
<p class="ql-align-center"><em>두 번째 이미지 캡션 — 출처: ...</em></p>

<p>증거 제시 문단들.</p>

<p>반전 또는 핵심 문단.</p>

<p>여운 문단 — 독자에게 남는 질문이나 의미.</p>

<hr>
<h3>참고문헌</h3>
<p class="ql-size-small">
1. ...<br>
2. ...<br>
3. ...
</p>
```

## 하지 말 것

- `<br>` 여러 개로 줄바꿈 (문단은 `<p>`로 분리)
- 인라인 스타일 (`style="..."`) — 사용자 폰트사이즈 토글과 충돌
- `<div>` 랩핑 (Quill 기본 포맷 아님)
- 빈 `<p></p>` — 렌더링 시 공백 과잉
- `ql-align-center` 없는 이미지 — 좌측 정렬되어 어색함
- 본문 중간 `<h1>` — `<h1>`은 제목(article.title)에만
