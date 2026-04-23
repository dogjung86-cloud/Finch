# 새 컴퓨터에서 finch-history-article 셋업

이 스킬을 다른 Windows PC에서 처음 쓸 때의 절차.

## 1. Finch 저장소 클론

```bash
git clone <Finch repo URL> D:/Finch
cd D:/Finch
npm install
```

위치는 D:/Finch가 아니어도 됨. 어디든 일관되게.

## 2. Google Drive 마운트 확인

`G:/내 드라이브/Nautilus/History(노틸러스)/articles` 폴더가 보여야 합니다.
- Google Drive for desktop을 같은 계정으로 로그인
- 동기화 옵션에서 "내 드라이브" 미러링 또는 스트리밍 켜기
- 드라이브 letter가 다르면 (예: H:) `config.json`에서 수정

## 3. config.json 작성

```bash
cd D:/Finch/.claude/skills/finch-history-article
cp config.json.example config.json
```

`config.json` 열어서 본인 환경에 맞게 수정:

| 키 | 의미 | 예시 |
|---|---|---|
| `project_root` | Finch 저장소 루트 | `D:/Finch` |
| `skill_dir` | 이 스킬의 절대 경로 | `D:/Finch/.claude/skills/finch-history-article` |
| `companion_skill_dir` | finch-article 스킬 경로 (style-guide·ref 의존) | `D:/Finch/.claude/skills/finch-article` |
| `nautilus_archive` | Nautilus 아카이브 폴더 | `G:/내 드라이브/Nautilus/History(노틸러스)/articles` |
| `downloads_dir` | 사용자 Downloads 폴더 | `C:/Users/{본인계정}/Downloads` |

## 4. companion 스킬 확인

`D:/Finch/.claude/skills/finch-article/`도 같이 클론되어 있어야 합니다 (style-guide.md, templates/quill-html.md, ref/012.txt 등 참조).

git clone하면 자동 따라옴. 없으면:
```bash
git pull origin main
```

## 5. Playwright + Node 의존성

이 스킬은 Playwright MCP와 Node를 사용합니다. Claude Code에 Playwright MCP가 등록돼 있어야 admin 자동 등록이 가능.

## 6. finch.co.kr admin 계정

발행 단계에서 admin에 로그인된 Playwright 브라우저 세션이 필요합니다. 첫 실행 시 Claude가 로그인을 안내합니다.

## 7. 실행

```
/finch-history-article
```

또는 자연어:
> 100년 전 과학 6편 자동 등록 시작해줘

## 경로 포함된 prompts/*.md 파일

`prompts/select.md`, `write.md`, `review.md`, `publish.md`는 현재 `D:/Finch/...`와 `G:/내 드라이브/...` 절대 경로를 직접 사용합니다.

새 머신의 경로가 다르면 두 가지 옵션:
- **A. config 기반 자동 치환 (권장)**: 메인 세션이 서브에이전트에 프롬프트 보낼 때 config.json을 읽어 `D:/Finch` → `${project_root}`, `G:/내 드라이브/Nautilus/History(노틸러스)/articles` → `${nautilus_archive}`로 치환
- **B. 수동 sed**: prompts/*.md를 직접 find-replace

지금은 A를 권장하지만, 매번 같은 경로면 그냥 prompts/*.md를 수정해도 됨.

## 디버깅

- `state/items.json` 안 만들어짐 → Google Drive 마운트 안 됨. config의 `nautilus_archive` 경로 확인
- selector.html이 빈 화면 → `state/items-ko.json` 누락 (번역 미실행). 그래도 영문으로는 표시되어야 정상
- Playwright 브라우저가 잠김 → 다른 Claude Code 세션이 점유 중. 모든 mcp-chrome 창 닫기
