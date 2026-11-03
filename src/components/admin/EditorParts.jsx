'use client';

import { formatSavedTime } from '../../lib/adminEditor';

// 칼럼과 일상 폼이 함께 쓰는 작은 조각들

export const BODY_HINT = '이미지는 툴바 버튼, 끌어다 놓기, 붙여넣기로 넣을 수 있고 올릴 때 자동으로 줄어듭니다. 독자에게 어떻게 보이는지는 미리보기로 확인하세요.';

// 화면 아래에 붙어 있는 저장 줄. 긴 글을 쓰다가도 버튼과 오류가 항상 보인다.
export function EditorActions({ error, draftState, saving, busy, isPublished, saveLabel, onSave, onPreview, onCancel }) {
  return (
    <div className="admin-form__actions">
      {error && <div className="admin-error" role="alert">{error}</div>}
      <div className="admin-form__action-row">
        <button className="admin-btn admin-btn--primary" onClick={onSave} disabled={saving || busy}>
          {saving ? '저장 중...' : busy ? '이미지 올리는 중...' : saveLabel}
        </button>
        <button className="admin-btn admin-btn--outline" onClick={onPreview}>
          미리보기
        </button>
        <button className="admin-btn admin-btn--outline" onClick={onCancel}>
          취소
        </button>
        <span className="admin-form__save-state">
          <span className={isPublished ? 'admin-form__state--public' : ''}>
            {isPublished ? '저장하면 바로 공개됩니다' : '비공개로 저장됩니다'}
          </span>
          {draftState === false ? (
            <span className="admin-form__state--failed">임시 저장 실패, 브라우저 저장 공간을 확인해 주세요</span>
          ) : draftState ? (
            <span>임시 저장됨 {formatSavedTime(draftState)}</span>
          ) : null}
        </span>
      </div>
    </div>
  );
}

// 저장 또는 공개 전환 뒤 목록 맨 위에 보이는 확인
export function SaveNotice({ notice, onPublish }) {
  if (!notice) return null;
  return (
    <div className="admin-notice" role="status">
      <span>
        <strong>{notice.title}</strong>
        {notice.published
          ? ': 저장했습니다. 지금 공개되어 있습니다.'
          : ': 비공개로 저장했습니다. 아직 독자에게 보이지 않습니다.'}
      </span>
      {notice.published ? (
        <a className="admin-btn admin-btn--small admin-btn--outline" href={notice.href} target="_blank" rel="noreferrer">
          글 보기
        </a>
      ) : (
        <button className="admin-btn admin-btn--small admin-btn--primary" onClick={onPublish}>
          공개하기
        </button>
      )}
    </div>
  );
}

// 폼에서 임시 저장본을 불러왔을 때. 자동 등록 스킬이 저장 버튼을 글자로 찾으므로 이 버튼에는 '저장'을 쓰지 않는다.
export function RestoredNotice({ restoredAt, isNew, onDiscard }) {
  if (!restoredAt) return null;
  return (
    <div className="admin-notice" role="status">
      <span>{formatSavedTime(restoredAt)}에 임시 저장한 내용을 불러왔습니다.</span>
      <button className="admin-btn admin-btn--small admin-btn--outline" onClick={onDiscard}>
        {isNew ? '버리고 새로 쓰기' : '버리고 원래 글로'}
      </button>
    </div>
  );
}

// 목록 위에 보이는 임시 저장본
export function DraftList({ drafts, onResume, onDiscard }) {
  if (drafts.length === 0) return null;
  return (
    <ul className="admin-drafts" aria-label="임시 저장본">
      {drafts.map((d) => (
        <li key={d.id} className="admin-notice">
          <span>
            저장하지 않은 글: <strong>{d.form.title || '(제목 없음)'}</strong> ({formatSavedTime(d.savedAt)})
          </span>
          <span className="admin-drafts__buttons">
            <button className="admin-btn admin-btn--small admin-btn--primary" onClick={() => onResume(d)}>
              이어 쓰기
            </button>
            <button className="admin-btn admin-btn--small admin-btn--outline" onClick={() => onDiscard(d)}>
              버리기
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}
