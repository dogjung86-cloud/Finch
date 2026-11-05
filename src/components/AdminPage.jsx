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
import { formatDate } from '../lib/format';
import { SERIES } from '../lib/series';
import { SITE } from '../data/site';
import ArticlePreview from './admin/ArticlePreview';
import RichTextEditor from './admin/RichTextEditor';
import useEditorForm from './admin/useEditorForm';
import { BODY_HINT, DraftList, EditorActions, RestoredNotice, SaveNotice } from './admin/EditorParts';

const BUCKET = 'article-thumbnails';
const THUMB_UPLOAD = { ...THUMB_IMAGE, bucket: BUCKET, folder: 'thumbnails' };
const BODY_UPLOAD = { ...BODY_IMAGE, bucket: BUCKET, folder: 'content' };

const EMPTY_FORM = {
  title: '',
  excerpt: '',
  full_content: '',
  author: SITE.name,
  category: '미분류',
  thumbnail: '',
  display_order: 0,
  is_published: false,
  is_membership: false,
};

const formFromArticle = (article) => ({
  title: article.title || '',
  excerpt: article.excerpt || '',
  full_content: article.full_content || '',
  author: article.author || SITE.name,
  category: article.category || '미분류',
  thumbnail: article.thumbnail || '',
  display_order: article.display_order || 0,
  is_published: article.is_published ?? false,
  is_membership: article.is_membership ?? false,
});

const noticeFor = (article) => ({
  title: article.title,
  published: article.is_published,
  href: `/article/${article.id}`,
  row: article,
});

const byDisplayOrder = (a, b) =>
  a.display_order - b.display_order || new Date(b.created_at) - new Date(a.created_at);

/* ── 관리자 과학 기사 탭 ── */
export default function AdminPage({ onBack, active }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [bodyUploading, setBodyUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [thumbDragOver, setThumbDragOver] = useState(false);
  const [selected, setSelected] = useState([]);

  const form = useEditorForm({ kind: 'articles', emptyForm: EMPTY_FORM, fromRow: formFromArticle });
  const { editing, formData, error, setError, setNotice, setField } = form;
  const closePreview = useCallback(() => setPreviewing(false), []);

  // ── 기사 목록 로드 ──
  const fetchArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      setError('기사를 불러올 수 없습니다: ' + adminErrorMessage(error));
    } else {
      setArticles(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (active) fetchArticles();
  }, [active]);

  // ── 썸네일 업로드 (파일 또는 드래그앤드롭) ──
  const handleThumbnailFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    setError('');
    try {
      setField('thumbnail', await uploadAdminImage(file, THUMB_UPLOAD));
    } catch (err) {
      setError('이미지 업로드 실패: ' + adminErrorMessage(err));
    }
    setUploading(false);
  };

  const handleThumbnailUpload = (e) => {
    handleThumbnailFile(e.target.files?.[0]);
  };

  const handleThumbDrop = (e) => {
    e.preventDefault();
    setThumbDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleThumbnailFile(file);
  };

  // ── 저장 (생성 / 수정) ──
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
        excerpt: formData.excerpt,
        full_content: await prepareBody(formData.full_content, BODY_UPLOAD),
        author: formData.author.trim() || SITE.name,
        category: formData.category,
        thumbnail: formData.thumbnail,
        display_order: formData.display_order,
        is_published: formData.is_published,
        is_membership: formData.is_membership,
        updated_at: new Date().toISOString(),
      };

      const { data, error: saveError } = editing === 'new'
        ? await supabase.from('articles').insert([payload]).select()
        : await supabase.from('articles').update(payload).eq('id', editing.id).select();

      const saved = data?.[0];
      if (saveError) {
        setError('저장하지 못했습니다: ' + adminErrorMessage(saveError));
      } else if (!saved) {
        setError(NOTHING_CHANGED);
      } else {
        setArticles((prev) =>
          editing === 'new'
            ? [...prev, saved].sort(byDisplayOrder)
            : prev.map((a) => (a.id === saved.id ? saved : a))
        );
        revalidatePaths(['/', '/articles', `/article/${saved.id}`]);
        form.finishSave(noticeFor(saved));
      }
    } catch (err) {
      setError('저장하지 못했습니다: ' + adminErrorMessage(err));
    }
    setSaving(false);
  };

  // ── 삭제 ──
  const handleDelete = async (id) => {
    if (!confirm('정말 이 기사를 삭제하시겠습니까?')) return;

    const { data, error } = await supabase.from('articles').delete().eq('id', id).select('id');
    if (error) {
      setError('삭제 실패: ' + adminErrorMessage(error));
    } else if (!data?.length) {
      setError(NOTHING_CHANGED);
    } else {
      setError('');
      setNotice(null);
      setArticles(prev => prev.filter(a => a.id !== id));
      form.forgetDraft(id);
      revalidatePaths(['/', '/articles', `/article/${id}`]);
    }
  };

  // ── 일괄 삭제 ──
  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!confirm(`선택한 ${selected.length}개의 기사를 삭제하시겠습니까?`)) return;

    const { data, error } = await supabase.from('articles').delete().in('id', selected).select('id');
    if (error) {
      setError('일괄 삭제 실패: ' + adminErrorMessage(error));
    } else if (!data?.length) {
      setError(NOTHING_CHANGED);
    } else {
      const deleted = data.map((d) => d.id);
      setError('');
      setNotice(null);
      setArticles((prev) => prev.filter((a) => !deleted.includes(a.id)));
      setSelected([]);
      deleted.forEach(form.forgetDraft);
      revalidatePaths(['/', '/articles', ...deleted.map((id) => `/article/${id}`)]);
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === articles.length) {
      setSelected([]);
    } else {
      setSelected(articles.map((a) => a.id));
    }
  };

  // ── 공개/비공개 토글 ──
  const togglePublish = async (article) => {
    const newStatus = !article.is_published;
    const { data, error } = await supabase
      .from('articles')
      .update({ is_published: newStatus })
      .eq('id', article.id)
      .select('id');

    if (error) {
      setError('상태 변경 실패: ' + adminErrorMessage(error));
    } else if (!data?.length) {
      setError(NOTHING_CHANGED);
    } else {
      const updated = { ...article, is_published: newStatus };
      setError('');
      setNotice(noticeFor(updated));
      setArticles(prev => prev.map(a => (a.id === article.id ? updated : a)));
      revalidatePaths(['/', '/articles', `/article/${article.id}`]);
    }
  };

  // ══════════════════════════════════════
  // 렌더링: 기사 작성/수정 폼
  // ══════════════════════════════════════
  if (editing) {
    return (
      <div className="admin-page" hidden={!active}>
        <div className="admin-page__header">
          <h1 className="admin-page__title">
            {editing === 'new' ? '새 기사 작성' : '기사 수정'}
          </h1>
          <button className="admin-btn admin-btn--outline" onClick={form.backToList}>
            ← 목록으로
          </button>
        </div>

        <RestoredNotice restoredAt={form.restoredAt} isNew={editing === 'new'} onDiscard={form.discardRestored} />

        <div className="admin-form">
          {/* 제목 */}
          <div className="admin-form__field">
            <label className="admin-form__label">제목 *</label>
            <input
              className="admin-form__input"
              type="text"
              value={formData.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="기사 제목을 입력하세요"
            />
          </div>

          {/* 카테고리 + 작성자 + 순서 */}
          <div className="admin-form__row">
            <div className="admin-form__field">
              <label className="admin-form__label">카테고리</label>
              <select
                className="admin-form__select"
                value={formData.category}
                onChange={(e) => setField('category', e.target.value)}
              >
                <option value="미분류">미분류</option>
                <option value="천문우주">천문우주</option>
                <option value="생명진화">생명진화</option>
                <option value="뇌심리">뇌심리</option>
                <option value="지구환경">지구환경</option>
                <option value="물리화학">물리화학</option>
              </select>
            </div>
            <div className="admin-form__field">
              <label className="admin-form__label" htmlFor="article-author-input">작성자</label>
              <input
                id="article-author-input"
                className="admin-form__input"
                type="text"
                value={formData.author}
                onChange={(e) => setField('author', e.target.value)}
                placeholder={SITE.name}
              />
            </div>
            <div className="admin-form__field">
              <label className="admin-form__label">표시 순서</label>
              <input
                className="admin-form__input"
                type="number"
                value={formData.display_order}
                onChange={(e) => setField('display_order', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* 썸네일 - 드래그앤드롭 */}
          <div className="admin-form__field">
            <label className="admin-form__label">썸네일 이미지</label>
            <div
              className={`admin-form__dropzone ${thumbDragOver ? 'admin-form__dropzone--active' : ''} ${formData.thumbnail ? 'admin-form__dropzone--has-image' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setThumbDragOver(true); }}
              onDragLeave={() => setThumbDragOver(false)}
              onDrop={handleThumbDrop}
              onClick={() => document.getElementById('thumb-file-input').click()}
            >
              {formData.thumbnail ? (
                <div className="admin-form__dropzone-preview">
                  <img src={formData.thumbnail} alt="썸네일 미리보기" />
                  <div className="admin-form__dropzone-overlay">
                    <span>클릭하거나 새 이미지를 드래그하여 변경</span>
                  </div>
                </div>
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
                id="thumb-file-input"
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

          {/* 발췌문 */}
          <div className="admin-form__field">
            <label className="admin-form__label">발췌문 (요약)</label>
            <textarea
              className="admin-form__textarea admin-form__textarea--short"
              value={formData.excerpt}
              onChange={(e) => setField('excerpt', e.target.value)}
              placeholder="기사의 간략한 요약을 입력하세요"
              rows={3}
            />
          </div>

          {/* 본문 - 리치 텍스트 에디터 */}
          <div className="admin-form__field">
            <label className="admin-form__label">본문</label>
            <p className="admin-form__hint" style={{ marginBottom: '8px' }}>{BODY_HINT}</p>
            <RichTextEditor
              value={formData.full_content}
              onChange={(val, source) => form.setBody('full_content', val, source)}
              placeholder="기사 본문을 작성하세요..."
              image={BODY_UPLOAD}
              onError={setError}
              onUploadingChange={setBodyUploading}
            />
          </div>

          {/* 공개 여부 + 멤버십 */}
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
              🔒 멤버십 전용 기사 (일반 사용자에게 본문 잠금)
            </label>
          </div>

          {/* 저장 버튼 */}
          <EditorActions
            error={error}
            draftState={form.draftState}
            saving={saving}
            busy={uploading || bodyUploading}
            isPublished={formData.is_published}
            saveLabel={editing === 'new' ? '기사 작성' : '수정 완료'}
            onSave={handleSave}
            onPreview={() => setPreviewing(true)}
            onCancel={form.cancel}
          />
        </div>

        {previewing && (
          <ArticlePreview
            kicker={`${SERIES.column.label}${formData.category !== '미분류' ? ` · ${formData.category}` : ''}`}
            title={formData.title}
            author={formData.author.trim() || SITE.name}
            date={formatDate(editing === 'new' ? new Date() : editing.created_at)}
            thumbnail={formData.thumbnail}
            html={formData.full_content}
            note={formData.is_membership ? '멤버십 전용으로 체크되어 있어 독자에게는 앞부분과 잠금 안내만 보입니다. 아래는 전체 글입니다.' : ''}
            onClose={closePreview}
          />
        )}
      </div>
    );
  }

  // ══════════════════════════════════════
  // 렌더링: 기사 목록
  // ══════════════════════════════════════
  if (!active) return null;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">{SERIES.column.adminLabel}</h1>
        <div className="admin-page__header-actions">
          <button
            className="admin-btn admin-btn--primary"
            onClick={() => form.open('new')}
          >
            + 새 기사 작성
          </button>
          <button className="admin-btn admin-btn--outline" onClick={onBack}>
            ← 홈으로
          </button>
        </div>
      </div>

      {error && <div className="admin-error" role="alert">{error}</div>}
      <SaveNotice notice={form.notice} onPublish={() => togglePublish(form.notice.row)} />

      {loading ? (
        <div className="admin-loading">기사를 불러오는 중...</div>
      ) : (
        <>
        <DraftList
          drafts={form.drafts}
          onResume={(draft) => form.resumeDraft(draft, articles)}
          onDiscard={form.discardDraft}
        />
        {articles.length === 0 ? (
          <div className="admin-empty">
            <p>등록된 기사가 없습니다.</p>
            <button
              className="admin-btn admin-btn--primary"
              onClick={() => form.open('new')}
            >
              첫 기사를 작성하세요
            </button>
          </div>
        ) : (
          <>
          {selected.length > 0 && (
            <div className="admin-bulk-bar">
              <span>{selected.length}개 선택됨</span>
              <button className="admin-btn admin-btn--small admin-btn--danger" onClick={handleBulkDelete}>
                선택 삭제
              </button>
            </div>
          )}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{width: '40px'}}>
                    <input
                      type="checkbox"
                      checked={articles.length > 0 && selected.length === articles.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>순서</th>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>상태</th>
                  <th>작성일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => (
                  <tr key={a.id} className={!a.is_published ? 'admin-table__row--draft' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(a.id)}
                        onChange={() => toggleSelect(a.id)}
                      />
                    </td>
                    <td>{a.display_order}</td>
                    <td className="admin-table__title-cell">{a.title}</td>
                    <td>{a.author}</td>
                    <td>
                      <button
                        className={`admin-status ${a.is_published ? 'admin-status--published' : 'admin-status--draft'}`}
                        onClick={() => togglePublish(a)}
                      >
                        {a.is_published ? '공개' : '비공개'}
                      </button>
                    </td>
                    <td>{new Date(a.created_at).toLocaleDateString('ko-KR')}</td>
                    <td>
                      <div className="admin-table__actions">
                        <button
                          className="admin-btn admin-btn--small admin-btn--outline"
                          onClick={() => form.open(a)}
                        >
                          수정
                        </button>
                        <button
                          className="admin-btn admin-btn--small admin-btn--danger"
                          onClick={() => handleDelete(a.id)}
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
          </>
        )}
        </>
      )}
    </div>
  );
}
