import { useCallback, useEffect, useRef, useState } from 'react';
import { listDrafts, readDraft, removeDraft, writeDraft } from '../../lib/adminEditor';

const AUTOSAVE_MS = 800;
const toTop = () => window.scrollTo({ top: 0, behavior: 'instant' });

// 글쓰기 폼의 상태와 임시 저장. 칼럼과 일상 폼이 함께 쓴다.
// kind: 임시 저장본을 구분하는 이름, emptyForm: 새 글의 초기값, fromRow: 표의 행을 폼 값으로 바꾸는 함수
export default function useEditorForm({ kind, emptyForm, fromRow }) {
  const [editing, setEditing] = useState(null); // null: 목록, 'new': 새 글, 표의 행: 수정 중
  const [formData, setFormData] = useState(emptyForm);
  const [dirty, setDirty] = useState(false);
  const [draftState, setDraftState] = useState(null); // 마지막 임시 저장 시각. 실패하면 false
  const [restoredAt, setRestoredAt] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);

  const draftId = editing === 'new' ? 'new' : editing?.id ?? null;

  const latest = useRef(null);
  latest.current = { draftId, formData, dirty };
  const flush = useCallback(() => {
    const now = latest.current;
    if (now.draftId == null || !now.dirty) return;
    setDraftState(writeDraft(kind, now.draftId, now.formData));
  }, [kind]);

  useEffect(() => {
    if (draftId == null || !dirty) return undefined;
    const timer = setTimeout(flush, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [draftId, formData, dirty, flush]);

  // 페이지를 닫거나 로그인이 풀려 폼이 사라질 때도 바로 남긴다
  useEffect(() => {
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [flush]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => {
    setDrafts(listDrafts(kind));
  }, [kind]);

  const open = (target, saved = readDraft(kind, target === 'new' ? 'new' : target.id)) => {
    const base = target === 'new' ? emptyForm : fromRow(target);
    setFormData(saved ? { ...base, ...saved.form } : base);
    setRestoredAt(saved ? saved.savedAt : null);
    setDraftState(saved ? saved.savedAt : null);
    setDirty(Boolean(saved));
    setError('');
    setNotice(null);
    setEditing(target);
    toTop();
  };

  const close = () => {
    setEditing(null);
    setDirty(false);
    setRestoredAt(null);
    setError('');
    setDrafts(listDrafts(kind));
    toTop();
  };

  // 목록으로: 쓰던 글은 임시 저장본으로 남는다
  const backToList = () => {
    flush();
    close();
  };

  // 취소: 쓰던 글을 버린다
  const cancel = () => {
    if (dirty && !window.confirm('저장하지 않은 내용을 버릴까요?')) return;
    removeDraft(kind, draftId);
    close();
  };

  const finishSave = (savedNotice) => {
    removeDraft(kind, draftId);
    close();
    setNotice(savedNotice);
  };

  // 불러온 임시 저장본을 버리고 저장된 상태로 돌아간다
  const discardRestored = () => {
    if (!window.confirm('임시 저장본을 버릴까요? 되돌릴 수 없습니다.')) return;
    removeDraft(kind, draftId);
    setFormData(editing === 'new' ? emptyForm : fromRow(editing));
    setRestoredAt(null);
    setDraftState(null);
    setDirty(false);
  };

  const resumeDraft = (draft, rows) => {
    if (draft.id === 'new') {
      open('new');
      return;
    }
    const row = rows.find((r) => r.id === draft.id);
    if (row) {
      open(row);
      return;
    }
    // 글이 그 사이 지워졌으면 새 글로 이어 쓴다
    removeDraft(kind, draft.id);
    open('new', draft);
  };

  const discardDraft = (draft) => {
    if (!window.confirm('이 임시 저장본을 버릴까요? 되돌릴 수 없습니다.')) return;
    removeDraft(kind, draft.id);
    setDrafts(listDrafts(kind));
  };

  // 글을 지우면 그 글의 임시 저장본도 함께 없앤다
  const forgetDraft = (id) => {
    removeDraft(kind, id);
    setDrafts(listDrafts(kind));
  };

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setDirty(true);
  };

  // 에디터가 내용을 불러올 때 보내는 변경은 사람이 고친 것이 아니다
  const setBody = (name, value, source) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (source === 'user') setDirty(true);
  };

  return {
    editing,
    formData,
    dirty,
    draftState,
    restoredAt,
    drafts,
    error,
    setError,
    notice,
    setNotice,
    open,
    backToList,
    cancel,
    finishSave,
    discardRestored,
    resumeDraft,
    discardDraft,
    forgetDraft,
    setField,
    setBody,
  };
}
