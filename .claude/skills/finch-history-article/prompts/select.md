# 단계 1: 기사 선택 프로토콜 (클릭 UI 방식)

## 목표

Nautilus 로컬 아카이브 172편 중 사용자가 **브라우저에서 클릭으로 6편 선택** → 완료 버튼 → 자동 다운로드된 JSON을 Claude가 읽어 `state/selected.json` 확정.

## 왜 이 방식인가

- 텍스트 기반 랜덤 제안 + 교체 지시는 반복이 많아 느림
- finch-article의 Playwright 브라우저가 점유 중일 수 있으므로 **사용자 기본 브라우저**에서 별도 오픈
- 172편 스캔·필터·검색이 필요하므로 UI가 훨씬 효율적

## 절차

### 1. items 수집

```bash
ls "/g/내 드라이브/Nautilus/History(노틸러스)/articles/"
```

각 디렉터리의 `metadata.json`을 Read로 읽어 다음 구조의 배열 생성:

```json
{
  "archive_dir": "G:/내 드라이브/Nautilus/History(노틸러스)/articles/001_The_Birth_of_Genius",
  "article_md_path": "G:/내 드라이브/Nautilus/History(노틸러스)/articles/001_The_Birth_of_Genius/article.md",
  "metadata_path": "G:/내 드라이브/Nautilus/History(노틸러스)/articles/001_The_Birth_of_Genius/metadata.json",
  "title": "The Birth of Genius",
  "subtitle": "...",
  "author": "Bob Grant",
  "date": "2026-04-15T16:30:00",
  "url": "https://nautil.us/..."
}
```

**최적화**: 172번 Read는 토큰 낭비. 단일 Node/Python 스크립트로 한번에 읽는 것이 효율적. 제안 명령:

```bash
node -e "
const fs=require('fs');
const path=require('path');
const root='/g/내 드라이브/Nautilus/History(노틸러스)/articles';
const out=[];
for (const dir of fs.readdirSync(root)) {
  const full = path.join(root, dir);
  if (!fs.statSync(full).isDirectory()) continue;
  const metaPath = path.join(full, 'metadata.json');
  if (!fs.existsSync(metaPath)) continue;
  const m = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  out.push({
    archive_dir: full.replace(/\\\\/g, '/'),
    article_md_path: path.join(full, 'article.md').replace(/\\\\/g, '/'),
    metadata_path: metaPath.replace(/\\\\/g, '/'),
    title: m.title||'',
    subtitle: m.subtitle||'',
    author: m.author||'',
    date: m.date||'',
    url: m.url||''
  });
}
fs.writeFileSync('D:/Finch/.claude/skills/finch-history-article/state/items.json', JSON.stringify(out));
console.log('done:', out.length);
"
```

(Node가 없으면 Python으로 동등한 스크립트 실행)

### 2. selector.html 생성

`templates/selector.html`을 Read → `__ITEMS_PLACEHOLDER__`를 `items.json` 내용으로 치환 → `state/selector.html`로 Write.

```bash
node -e "
const fs=require('fs');
const tmpl=fs.readFileSync('D:/Finch/.claude/skills/finch-history-article/templates/selector.html','utf8');
const items=fs.readFileSync('D:/Finch/.claude/skills/finch-history-article/state/items.json','utf8');
fs.writeFileSync('D:/Finch/.claude/skills/finch-history-article/state/selector.html', tmpl.replace('__ITEMS_PLACEHOLDER__', items));
console.log('selector.html ready');
"
```

### 3. 사용자 기본 브라우저로 오픈

**Playwright는 쓰지 않는다** (finch-article이 점유 중일 수 있음).

Windows에서 OS 기본 브라우저로 file:// URL 열기:

```bash
start "" "D:/Finch/.claude/skills/finch-history-article/state/selector.html"
```

또는 cross-platform 대안:
```bash
cmd //c start "" "D:\Finch\.claude\skills\finch-history-article\state\selector.html"
```

(Git Bash / MINGW에서는 `//c`로 이스케이프)

### 4. 사용자에게 안내

```
브라우저가 열렸습니다.

- 172편 중 6편을 클릭으로 선택해 주세요 (다시 클릭하면 해제)
- 검색창으로 제목·저자 필터링 가능
- 6개 다 고르면 우상단 "완료" 버튼 활성화
- 완료 누르면 "finch-history-selected.json"이 Downloads 폴더로 자동 다운로드됩니다

다 되시면 채팅에 "완료"라고 알려주세요.
```

### 5. 사용자 "완료" 응답 대기

### 6. Downloads에서 JSON 읽어오기

사용자의 Downloads 폴더 경로 확인:
- Windows 기본: `C:/Users/kjh/Downloads/`

```bash
ls -la "C:/Users/kjh/Downloads/finch-history-selected*.json" 2>&1 | head -5
```

최신 파일(여러 번 눌렀을 수 있음) 읽기. 브라우저는 같은 이름 중복 시 `finch-history-selected (1).json` 등을 만들기도 하므로 가장 최근 mtime 파일 사용.

Read로 내용 로드 → `state/selected.json`로 이동:

```bash
mv "C:/Users/kjh/Downloads/finch-history-selected*.json" "D:/Finch/.claude/skills/finch-history-article/state/selected.json"
```

또는 Read 후 Write로 복사.

### 7. 확정 리포트

```
선택 완료. state/selected.json 저장됨.

슬롯 0: [001] The Birth of Genius
슬롯 1: [015] Bird Poop Powered the Success of This Ancient Kingdom
...

다음 단계(재작성)는 finch-article이 publish 끝낸 뒤 진행합니다.
"finch-article 끝났어" 라고 알려주시면 단계 2를 시작할게요.
```

## 실패 복구

- **Downloads에 파일이 없음**: 사용자에게 브라우저 다운로드 허용 확인 요청. 또는 수동으로 경로 전달 받기.
- **selector.html이 안 열림**: file:// URL을 수동 복사해 브라우저 주소창에 붙여넣도록 안내.
- **items.json 생성 실패**: Google Drive가 오프라인일 수 있음. `ls` 로 드라이브 마운트 상태 확인.
- **이미 `state/selected.json`이 있음**: "기존 선택본을 유지할까요, 새로 선택할까요?" 확인.
