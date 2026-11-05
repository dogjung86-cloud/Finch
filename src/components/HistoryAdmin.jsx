'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { revalidatePaths } from '../lib/revalidate';
import {
  BODY_IMAGE,
  NOTHING_CHANGED,
  THUMB_IMAGE,
  adminErrorMessage,
  prepareBody,
  uploadAdminImage,
} from '../lib/adminEditor';
import { SERIES } from '../lib/series';
import ArticlePreview from './admin/ArticlePreview';
import RichTextEditor from './admin/RichTextEditor';
import useEditorForm from './admin/useEditorForm';
import { BODY_HINT, DraftList, EditorActions, RestoredNotice, SaveNotice } from './admin/EditorParts';

const HISTORY_BUCKET = 'finch-100-years-ago';
const THUMB_UPLOAD = { ...THUMB_IMAGE, bucket: HISTORY_BUCKET, folder: 'history' };
const BODY_UPLOAD = { ...BODY_IMAGE, bucket: HISTORY_BUCKET, folder: 'history' };

const EMPTY_FORM = {
  title: '',
  content: '',
  thumbnail: '',
  thumbnail_position: '50% 50%',
  is_published: false,
  is_membership: false,
};

const formFromItem = (item) => ({
  title: item.title || '',
  content: item.content || '',
  thumbnail: item.thumbnail || '',
  thumbnail_position: item.thumbnail_position || '50% 50%',
  is_published: item.is_published ?? false,
  is_membership: item.is_membership ?? false,
});

const noticeFor = (item) => ({
  title: item.title,
  published: item.is_published,
  href: `/history/${item.id}`,
  row: item,
});

export default function HistoryAdmin({ onBack, active }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bodyUploading, setBodyUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [thumbDragOver, setThumbDragOver] = useState(false);

  const form = useEditorForm({ kind: 'history', emptyForm: EMPTY_FORM, fromRow: formFromItem });
  const { editing, formData, error, setError, setNotice, setField } = form;
  const closePreview = useCallback(() => setPreviewing(false), []);

  // ── 목록 로드 ──
  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('history_science')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError('불러오기 실패: ' + adminErrorMessage(error));
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (active) fetchItems();
  }, [active]);

  // ── 썸네일 업로드 ──
  const handleThumbnailFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadAdminImage(file, THUMB_UPLOAD);
      setField('thumbnail', url);
      // 새 이미지가 올라오면 포커스 포인트는 중앙으로 초기화
      setField('thumbnail_position', '50% 50%');
    } catch (err) {
      setError('이미지 업로드 실패: ' + adminErrorMessage(err));
    }
    setUploading(false);
  };

  // ── 포커스 포인트 조절 (썸네일 미리보기 클릭/드래그) ──
  const [focusDragging, setFocusDragging] = useState(false);
  const updateFocusFromEvent = (e, rectEl) => {
    const rect = rectEl.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setField('thumbnail_position', `${x.toFixed(1)}% ${y.toFixed(1)}%`);
  };
  const handleFocusPointerDown = (e) => {
    if (!formData.thumbnail) return;
    e.stopPropagation();
    e.preventDefault();
    setFocusDragging(true);
    updateFocusFromEvent(e, e.currentTarget);
  };
  const handleFocusPointerMove = (e) => {
    if (!focusDragging) return;
    e.stopPropagation();
    e.preventDefault();
    updateFocusFromEvent(e, e.currentTarget);
  };
  const handleFocusPointerUp = (e) => {
    if (!focusDragging) return;
    e.stopPropagation();
    setFocusDragging(false);
  };
  const resetFocusPoint = (e) => {
    e.stopPropagation();
    setField('thumbnail_position', '50% 50%');
  };
  const triggerThumbReplace = (e) => {
    e.stopPropagation();
    document.getElementById('history-thumb-input')?.click();
  };
  const focusXY = (() => {
    const parts = String(formData.thumbnail_position || '50% 50%').split(' ');
    return { x: parseFloat(parts[0]) || 50, y: parseFloat(parts[1]) || 50 };
  })();

  const handleThumbnailUpload = (e) => {
    handleThumbnailFile(e.target.files?.[0]);
  };

  const handleThumbDrop = (e) => {
    e.preventDefault();
    setThumbDragOver(false);
    handleThumbnailFile(e.dataTransfer.files?.[0]);
  };

  // ── 저장 ──
  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        title: formData.title,
        content: await prepareBody(formData.content, BODY_UPLOAD),
        thumbnail: formData.thumbnail,
        thumbnail_position: formData.thumbnail_position || '50% 50%',
        is_published: formData.is_published,
        is_membership: formData.is_membership,
      };

      const { data, error: saveError } = editing === 'new'
        ? await supabase.from('history_science').insert([payload]).select()
        : await supabase.from('history_science').update(payload).eq('id', editing.id).select();

      const saved = data?.[0];
      if (saveError) {
        setError('저장하지 못했습니다: ' + adminErrorMessage(saveError));
      } else if (!saved) {
        setError(NOTHING_CHANGED);
      } else {
        revalidatePaths(['/', '/history', `/history/${saved.id}`]);
        fetchItems();
        form.finishSave(noticeFor(saved));
      }
    } catch (err) {
      setError('저장하지 못했습니다: ' + adminErrorMessage(err));
    }
    setSaving(false);
  };

  // ── 삭제 ──
  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { data, error } = await supabase.from('history_science').delete().eq('id', id).select('id');
    if (error) {
      setError('삭제 실패: ' + adminErrorMessage(error));
    } else if (!data?.length) {
      setError(NOTHING_CHANGED);
    } else {
      setError('');
      setNotice(null);
      setItems((prev) => prev.filter((i) => i.id !== id));
      form.forgetDraft(id);
      revalidatePaths(['/', '/history', `/history/${id}`]);
    }
  };

  // ── 공개/비공개 토글 ──
  const togglePublish = async (item) => {
    const newStatus = !item.is_published;
    const { data, error } = await supabase
      .from('history_science')
      .update({ is_published: newStatus })
      .eq('id', item.id)
      .select('id');

    if (error) {
      setError('상태 변경 실패: ' + adminErrorMessage(error));
    } else if (!data?.length) {
      setError(NOTHING_CHANGED);
    } else {
      const updated = { ...item, is_published: newStatus };
      setError('');
      setNotice(noticeFor(updated));
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
      revalidatePaths(['/', '/history', `/history/${item.id}`]);
    }
  };

  // ══════════════════════
  // 작성/수정 폼
  // ══════════════════════
  if (editing) {
    return (
      <div className="admin-page" hidden={!active}>
        <div className="admin-page__header">
          <h1 className="admin-page__title">
            {`${SERIES.history.adminLabel} ${editing === 'new' ? '작성' : '수정'}`}
          </h1>
          <button className="admin-btn admin-btn--outline" onClick={form.backToList}>
            ← 목록으로
          </button>
        </div>

        <RestoredNotice restoredAt={form.restoredAt} isNew={editing === 'new'} onDiscard={form.discardRestored} />

        <div className="admin-form">
          <div className="admin-form__field">
            <label className="admin-form__label">제목 *</label>
            <input
              className="admin-form__input"
              type="text"
              value={formData.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="제목을 입력하세요"
            />
          </div>

          {/* 썸네일 - 드래그앤드롭 */}
          <div className="admin-form__field">
            <label className="admin-form__label">썸네일 이미지</label>
            <div
              className={`admin-form__dropzone ${thumbDragOver ? 'admin-form__dropzone--active' : ''} ${formData.thumbnail ? 'admin-form__dropzone--has-image' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setThumbDragOver(true); }}
              onDragLeave={() => setThumbDragOver(false)}
              onDrop={handleThumbDrop}
              onClick={!formData.thumbnail ? () => document.getElementById('history-thumb-input').click() : undefined}
            >
              {formData.thumbnail ? (
                <>
                  <div
                    className={`admin-form__focus-stage ${focusDragging ? 'admin-form__focus-stage--dragging' : ''}`}
                    onPointerDown={handleFocusPointerDown}
                    onPointerMove={handleFocusPointerMove}
                    onPointerUp={handleFocusPointerUp}
                    onPointerCancel={handleFocusPointerUp}
                    title="클릭 또는 드래그로 목록 카드에서 보일 중심점을 지정하세요"
                  >
                    <img
                      src={formData.thumbnail}
                      alt="썸네일 미리보기"
                      style={{ objectPosition: formData.thumbnail_position || '50% 50%' }}
                      draggable={false}
                    />
                    <div
                      className="admin-form__focus-point"
                      style={{ left: `${focusXY.x}%`, top: `${focusXY.y}%` }}
                    />
                  </div>
                  <div className="admin-form__focus-controls">
                    <span className="admin-form__focus-readout">
                      포커스 포인트: <strong>{focusXY.x.toFixed(0)}%, {focusXY.y.toFixed(0)}%</strong>
                      <span className="admin-form__focus-hint">미리보기를 클릭하거나 드래그해 조절</span>
                    </span>
                    <div className="admin-form__focus-buttons">
                      <button
                        type="button"
                        className="admin-btn admin-btn--small admin-btn--outline"
                        onClick={resetFocusPoint}
                      >
                        중앙 리셋
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--small admin-btn--outline"
                        onClick={triggerThumbReplace}
                      >
                        🔄 이미지 변경
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="admin-form__dropzone-empty">
                  <span className="admin-form__dropzone-icon">🖼️</span>
                  <span className="admin-form__dropzone-text">
                    {uploading ? '업로드 중...' : '이미지를 드래그하거나 클릭하여 업로드'}
                  </span>
                  <span className="admin-form__dropzone-hint">JPG, PNG, WebP. 올릴 때 자동으로 줄어듭니다.</span>
                </div>
              )}
              <input
                id="history-thumb-input"
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </div>
            <div className="admin-form__url-input">
              <span className="admin-form__hint">또는 URL 직접 입력:</span>
              <input
                className="admin-form__input"
                type="text"
                value={formData.thumbnail}
                onChange={(e) => setField('thumbnail', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="admin-form__field">
            <label className="admin-form__label">본문</label>
            <p className="admin-form__hint" style={{ marginBottom: '8px' }}>{BODY_HINT}</p>
            <RichTextEditor
              value={formData.content}
              onChange={(val, source) => form.setBody('content', val, source)}
              placeholder="일상 기록을 작성하세요..."
              image={BODY_UPLOAD}
              onError={setError}
              onUploadingChange={setBodyUploading}
            />
          </div>

          <div className="admin-form__field">
            <label className="admin-form__check-label">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setField('is_published', e.target.checked)}
              />
              공개 (체크하면 저장과 동시에 독자에게 보입니다)
            </label>
          </div>
          <div className="admin-form__field">
            <label className="admin-form__check-label admin-form__check-label--membership">
              <input
                type="checkbox"
                checked={formData.is_membership}
                onChange={(e) => setField('is_membership', e.target.checked)}
              />
              🔒 멤버십 전용 (일반 사용자에게 본문 잠금)
            </label>
          </div>

          <EditorActions
            error={error}
            draftState={form.draftState}
            saving={saving}
            busy={uploading || bodyUploading}
            isPublished={formData.is_published}
            saveLabel={editing === 'new' ? '작성' : '수정 완료'}
            onSave={handleSave}
            onPreview={() => setPreviewing(true)}
            onCancel={form.cancel}
          />
        </div>

        {previewing && (
          <ArticlePreview
            kicker={SERIES.history.label}
            title={formData.title}
            author={editing === 'new' ? null : editing.source}
            date={editing === 'new' ? null : editing.date_original}
            thumbnail={formData.thumbnail}
            html={formData.content}
            note={formData.is_membership ? '일상 글은 멤버십 체크와 상관없이 독자에게 전체가 보입니다.' : ''}
            onClose={closePreview}
          />
        )}
      </div>
    );
  }

  // ══════════════════════
  // 목록
  // ══════════════════════
  if (!active) return null;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">{SERIES.history.adminLabel}</h1>
        <div className="admin-page__header-actions">
          <button
            className="admin-btn admin-btn--primary"
            onClick={() => form.open('new')}
          >
            + 새 항목 작성
          </button>
          <button className="admin-btn admin-btn--outline" onClick={onBack}>
            ← 홈으로
          </button>
        </div>
      </div>

      {error && <div className="admin-error" role="alert">{error}</div>}
      <SaveNotice notice={form.notice} onPublish={() => togglePublish(form.notice.row)} />

      {loading ? (
        <div className="admin-loading">불러오는 중...</div>
      ) : (
        <>
        <DraftList
          drafts={form.drafts}
          onResume={(draft) => form.resumeDraft(draft, items)}
          onDiscard={form.discardDraft}
        />
        {items.length === 0 ? (
          <div className="admin-empty">
            <p>등록된 항목이 없습니다.</p>
            <button className="admin-btn admin-btn--primary" onClick={() => form.open('new')}>
              첫 항목을 작성하세요
            </button>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>제목</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className={!item.is_published ? 'admin-table__row--draft' : ''}>
                    <td className="admin-table__title-cell">{item.title}</td>
                    <td>
                      <button
                        className={`admin-status ${item.is_published ? 'admin-status--published' : 'admin-status--draft'}`}
                        onClick={() => togglePublish(item)}
                      >
                        {item.is_published ? '공개' : '비공개'}
                      </button>
                    </td>
                    <td>
                      <div className="admin-table__actions">
                        <button
                          className="admin-btn admin-btn--small admin-btn--outline"
                          onClick={() => form.open(item)}
                        >
                          수정
                        </button>
                        <button
                          className="admin-btn admin-btn--small admin-btn--danger"
                          onClick={() => handleDelete(item.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </>
      )}
    </div>
  );
}
