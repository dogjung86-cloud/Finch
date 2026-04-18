'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { revalidatePaths } from '../lib/revalidate';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

/* ── 이미지 업로드 헬퍼 ── */
const HISTORY_BUCKET = 'finch-100-years-ago';

async function uploadImage(file, folder = 'history') {
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error } = await supabase.storage
    .from(HISTORY_BUCKET)
    .upload(fileName, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage
    .from(HISTORY_BUCKET)
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export default function HistoryAdmin({ onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    thumbnail: '',
    is_published: true,
    is_membership: false,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [thumbDragOver, setThumbDragOver] = useState(false);
  const quillRef = useRef(null);

  // ── Quill 이미지 핸들러 ──
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
      setError('이미지 업로드 실패: ' + err.message);
    }
  };

  // ── 목록 로드 ──
  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('history_science')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError('불러오기 실패: ' + error.message);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // ── 폼 초기화 ──
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      thumbnail: '',
      is_published: true,
      is_membership: false,
    });
    setEditing(null);
    setError('');
  };

  // ── 수정 시작 ──
  const startEdit = (item) => {
    setFormData({
      title: item.title || '',
      content: item.content || '',
      thumbnail: item.thumbnail || '',
      is_published: item.is_published ?? true,
      is_membership: item.is_membership ?? false,
    });
    setEditing(item);
    setError('');
  };

  // ── 썸네일 업로드 ──
  const handleThumbnailFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadImage(file);
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

    const payload = {
      title: formData.title,
      content: formData.content,
      thumbnail: formData.thumbnail,
      is_published: formData.is_published,
      is_membership: formData.is_membership,
    };

    let result;
    if (editing === 'new') {
      result = await supabase.from('history_science').insert([payload]).select();
    } else {
      result = await supabase
        .from('history_science')
        .update(payload)
        .eq('id', editing.id)
        .select();
    }

    if (result.error) {
      setError('저장 실패: ' + result.error.message);
    } else {
      const savedId = result.data?.[0]?.id ?? (editing !== 'new' ? editing.id : null);
      const paths = ['/', '/history'];
      if (savedId) paths.push(`/history/${savedId}`);
      revalidatePaths(paths);
      fetchItems();
      resetForm();
    }
    setSaving(false);
  };

  // ── 삭제 ──
  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('history_science').delete().eq('id', id);
    if (error) {
      setError('삭제 실패: ' + error.message);
    } else {
      setItems((prev) => prev.filter((i) => i.id !== id));
      revalidatePaths(['/', '/history', `/history/${id}`]);
    }
  };

  // ══════════════════════
  // 작성/수정 폼
  // ══════════════════════
  if (editing) {
    return (
      <div className="admin-page">
        <div className="admin-page__header">
          <h1 className="admin-page__title">
            {editing === 'new' ? '100년 전 과학 작성' : '100년 전 과학 수정'}
          </h1>
          <button className="admin-btn admin-btn--outline" onClick={resetForm}>
            ← 목록으로
          </button>
        </div>

        {error && <div className="admin-error">{error}</div>}

        <div className="admin-form">
          <div className="admin-form__field">
            <label className="admin-form__label">제목 *</label>
            <input
              className="admin-form__input"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="예: 슈뢰딩거, 파동방정식으로 양자역학의 새 장을 열다"
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
              onClick={() => document.getElementById('history-thumb-input').click()}
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
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="admin-form__field">
            <label className="admin-form__label">본문</label>
            <div onDrop={handleEditorDrop} onDragOver={(e) => e.preventDefault()}>
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={formData.content}
                onChange={(val) => setFormData((prev) => ({ ...prev, content: val }))}
                modules={modules}
                formats={formats}
                placeholder="100년 전 과학 이야기를 작성하세요..."
              />
            </div>
          </div>

          <div className="admin-form__field">
            <label className="admin-form__check-label">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              />
              공개 (체크 해제 시 비공개)
            </label>
          </div>
          <div className="admin-form__field">
            <label className="admin-form__check-label admin-form__check-label--membership">
              <input
                type="checkbox"
                checked={formData.is_membership}
                onChange={(e) => setFormData({ ...formData, is_membership: e.target.checked })}
              />
              🔒 멤버십 전용 (일반 사용자에게 본문 잠금)
            </label>
          </div>

          <div className="admin-form__actions">
            <button
              className="admin-btn admin-btn--primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '저장 중...' : editing === 'new' ? '작성' : '수정 완료'}
            </button>
            <button className="admin-btn admin-btn--outline" onClick={resetForm}>
              취소
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════
  // 목록
  // ══════════════════════
  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">100년 전 과학 관리</h1>
        <div className="admin-page__header-actions">
          <button
            className="admin-btn admin-btn--primary"
            onClick={() => { setEditing('new'); setError(''); }}
          >
            + 새 항목 작성
          </button>
          <button className="admin-btn admin-btn--outline" onClick={onBack}>
            ← 홈으로
          </button>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="admin-empty">
          <p>등록된 항목이 없습니다.</p>
          <button className="admin-btn admin-btn--primary" onClick={() => setEditing('new')}>
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
                    <span className={`admin-status ${item.is_published ? 'admin-status--published' : 'admin-status--draft'}`}>
                      {item.is_published ? '공개' : '비공개'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        className="admin-btn admin-btn--small admin-btn--outline"
                        onClick={() => startEdit(item)}
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
    </div>
  );
}
