import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

/* ── 이미지 업로드 헬퍼 ── */
async function uploadImage(file, folder = 'content') {
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error } = await supabase.storage
    .from('article-thumbnails')
    .upload(fileName, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage
    .from('article-thumbnails')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

/* ── 관리자 기사 관리 페이지 ── */
export default function AdminPage({ onBack }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    full_content: '',
    author: 'The Finch',
    category: '기획',
    thumbnail: '',
    display_order: 0,
    is_published: true,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [thumbDragOver, setThumbDragOver] = useState(false);

  const quillRef = useRef(null);

  // ── 기사 목록 로드 ──
  const fetchArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      setError('기사를 불러올 수 없습니다: ' + error.message);
    } else {
      setArticles(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // ── 폼 초기화 ──
  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      full_content: '',
      author: 'The Finch',
      category: '기획',
      thumbnail: '',
      display_order: 0,
      is_published: true,
    });
    setEditing(null);
    setError('');
  };

  // ── 수정 시작 ──
  const startEdit = (article) => {
    setFormData({
      title: article.title || '',
      excerpt: article.excerpt || '',
      full_content: article.full_content || '',
      author: article.author || 'The Finch',
      category: article.category || '기획',
      thumbnail: article.thumbnail || '',
      display_order: article.display_order || 0,
      is_published: article.is_published ?? true,
    });
    setEditing(article);
    setError('');
  };

  // ── 썸네일 업로드 (파일 또는 드래그앤드롭) ──
  const handleThumbnailFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadImage(file, 'thumbnails');
      setFormData((prev) => ({ ...prev, thumbnail: url }));
    } catch (err) {
      setError('이미지 업로드 실패: ' + err.message);
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

  // ── Quill 에디터 이미지 핸들러 ──
  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const url = await uploadImage(file);
        const editor = quillRef.current?.getEditor();
        if (editor) {
          const range = editor.getSelection(true);
          editor.insertEmbed(range.index, 'image', url);
          editor.setSelection(range.index + 1);
        }
      } catch (err) {
        setError('본문 이미지 업로드 실패: ' + err.message);
      }
    };
  }, []);

  // ── Quill 모듈 설정 ──
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        [{ font: [] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote'],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler,
      },
    },
    clipboard: { matchVisual: false },
  }), [imageHandler]);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'align',
    'list', 'bullet',
    'blockquote',
    'link', 'image',
  ];

  // ── 에디터에 이미지 드래그앤드롭 ──
  const handleEditorDrop = async (e) => {
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    e.preventDefault();
    e.stopPropagation();

    try {
      const url = await uploadImage(file);
      const editor = quillRef.current?.getEditor();
      if (editor) {
        const range = editor.getSelection(true);
        editor.insertEmbed(range.index, 'image', url);
        editor.setSelection(range.index + 1);
      }
    } catch (err) {
      setError('이미지 드래그앤드롭 업로드 실패: ' + err.message);
    }
  };

  // ── 저장 (생성 / 수정) ──
  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      title: formData.title,
      excerpt: formData.excerpt,
      full_content: formData.full_content,
      author: formData.author,
      category: formData.category,
      thumbnail: formData.thumbnail,
      display_order: formData.display_order,
      is_published: formData.is_published,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (editing === 'new') {
      result = await supabase.from('articles').insert([payload]);
    } else {
      result = await supabase
        .from('articles')
        .update(payload)
        .eq('id', editing.id);
    }

    if (result.error) {
      setError('저장 실패: ' + result.error.message);
    } else {
      resetForm();
      fetchArticles();
    }
    setSaving(false);
  };

  // ── 삭제 ──
  const handleDelete = async (id) => {
    if (!confirm('정말 이 기사를 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) {
      setError('삭제 실패: ' + error.message);
    } else {
      fetchArticles();
    }
  };

  // ── 공개/비공개 토글 ──
  const togglePublish = async (article) => {
    const { error } = await supabase
      .from('articles')
      .update({ is_published: !article.is_published })
      .eq('id', article.id);

    if (error) {
      setError('상태 변경 실패: ' + error.message);
    } else {
      fetchArticles();
    }
  };

  // ══════════════════════════════════════
  // 렌더링: 기사 작성/수정 폼
  // ══════════════════════════════════════
  if (editing) {
    return (
      <div className="admin-page">
        <div className="admin-page__header">
          <h1 className="admin-page__title">
            {editing === 'new' ? '새 기사 작성' : '기사 수정'}
          </h1>
          <button className="admin-btn admin-btn--outline" onClick={resetForm}>
            ← 목록으로
          </button>
        </div>

        {error && <div className="admin-error">{error}</div>}

        <div className="admin-form">
          {/* 제목 */}
          <div className="admin-form__field">
            <label className="admin-form__label">제목 *</label>
            <input
              className="admin-form__input"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="기사 제목을 입력하세요"
            />
          </div>

          {/* 카테고리 + 순서 */}
          <div className="admin-form__row">
            <div className="admin-form__field">
              <label className="admin-form__label">카테고리</label>
              <select
                className="admin-form__select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="기획">기획</option>
                <option value="뉴스">뉴스</option>
              </select>
            </div>
            <div className="admin-form__field">
              <label className="admin-form__label">표시 순서</label>
              <input
                className="admin-form__input"
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="admin-form__field">
              <label className="admin-form__label">작성자</label>
              <input
                className="admin-form__input"
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
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
                  <span className="admin-form__dropzone-hint">JPG, PNG, WebP (최대 5MB)</span>
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
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="기사의 간략한 요약을 입력하세요"
              rows={3}
            />
          </div>

          {/* 본문 - 리치 텍스트 에디터 */}
          <div className="admin-form__field">
            <label className="admin-form__label">본문</label>
            <p className="admin-form__hint" style={{ marginBottom: '8px' }}>
              툴바에서 글꼴, 크기, 색상, 정렬을 설정하고, 이미지 버튼이나 드래그앤드롭으로 이미지를 삽입하세요.
            </p>
            <div
              className="admin-editor-wrap"
              onDrop={handleEditorDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={formData.full_content}
                onChange={(val) => setFormData({ ...formData, full_content: val })}
                modules={modules}
                formats={formats}
                placeholder="기사 본문을 작성하세요..."
              />
            </div>
          </div>

          {/* 공개 여부 */}
          <div className="admin-form__field">
            <label className="admin-form__check-label">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) =>
                  setFormData({ ...formData, is_published: e.target.checked })
                }
              />
              공개 (체크 해제 시 비공개)
            </label>
          </div>

          {/* 저장 버튼 */}
          <div className="admin-form__actions">
            <button
              className="admin-btn admin-btn--primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '저장 중...' : editing === 'new' ? '기사 작성' : '수정 완료'}
            </button>
            <button className="admin-btn admin-btn--outline" onClick={resetForm}>
              취소
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════
  // 렌더링: 기사 목록
  // ══════════════════════════════════════
  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">기사 관리</h1>
        <div className="admin-page__header-actions">
          <button
            className="admin-btn admin-btn--primary"
            onClick={() => { setEditing('new'); setError(''); }}
          >
            + 새 기사 작성
          </button>
          <button className="admin-btn admin-btn--outline" onClick={onBack}>
            ← 홈으로
          </button>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">기사를 불러오는 중...</div>
      ) : articles.length === 0 ? (
        <div className="admin-empty">
          <p>등록된 기사가 없습니다.</p>
          <button
            className="admin-btn admin-btn--primary"
            onClick={() => setEditing('new')}
          >
            첫 기사를 작성하세요
          </button>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>순서</th>
                <th>카테고리</th>
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
                  <td>{a.display_order}</td>
                  <td>
                    <span className={`admin-badge admin-badge--${a.category === '기획' ? 'feature' : 'news'}`}>
                      {a.category}
                    </span>
                  </td>
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
                        onClick={() => startEdit(a)}
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
      )}
    </div>
  );
}
