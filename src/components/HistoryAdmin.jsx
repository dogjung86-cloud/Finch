'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function HistoryAdmin({ onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    date_original: '',
    month_day: '',
    source: '',
    thumbnail: '',
    is_published: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── 목록 로드 ──
  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('history_science')
      .select('*')
      .order('date_original', { ascending: true });

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

  // ── date_original에서 month_day 자동 추출 ──
  const updateDateOriginal = (val) => {
    const md = val ? val.slice(5) : '';
    setFormData((prev) => ({ ...prev, date_original: val, month_day: md }));
  };

  // ── 폼 초기화 ──
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      date_original: '',
      month_day: '',
      source: '',
      thumbnail: '',
      is_published: true,
    });
    setEditing(null);
    setError('');
  };

  // ── 수정 시작 ──
  const startEdit = (item) => {
    setFormData({
      title: item.title || '',
      content: item.content || '',
      date_original: item.date_original || '',
      month_day: item.month_day || '',
      source: item.source || '',
      thumbnail: item.thumbnail || '',
      is_published: item.is_published ?? true,
    });
    setEditing(item);
    setError('');
  };

  // ── 저장 ──
  const handleSave = async () => {
    if (!formData.title.trim() || !formData.date_original) {
      setError('제목과 날짜를 입력해주세요.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      title: formData.title,
      content: formData.content,
      date_original: formData.date_original,
      month_day: formData.month_day,
      source: formData.source,
      thumbnail: formData.thumbnail,
      is_published: formData.is_published,
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

          <div className="admin-form__row">
            <div className="admin-form__field">
              <label className="admin-form__label">원래 날짜 *</label>
              <input
                className="admin-form__input"
                type="date"
                value={formData.date_original}
                onChange={(e) => updateDateOriginal(e.target.value)}
              />
            </div>
            <div className="admin-form__field">
              <label className="admin-form__label">매칭 (월-일)</label>
              <input
                className="admin-form__input"
                type="text"
                value={formData.month_day}
                readOnly
                placeholder="자동 생성"
              />
            </div>
            <div className="admin-form__field">
              <label className="admin-form__label">출처</label>
              <input
                className="admin-form__input"
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="예: Nature, Science 등"
              />
            </div>
          </div>

          <div className="admin-form__field">
            <label className="admin-form__label">썸네일 URL</label>
            <input
              className="admin-form__input"
              type="text"
              value={formData.thumbnail}
              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="admin-form__field">
            <label className="admin-form__label">본문</label>
            <textarea
              className="admin-form__textarea"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="100년 전 과학 이야기를 작성하세요..."
              rows={10}
            />
          </div>

          <div className="admin-form__field">
            <label className="admin-form__check-label">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              />
              공개
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
                <th>날짜</th>
                <th>매칭</th>
                <th>제목</th>
                <th>출처</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={!item.is_published ? 'admin-table__row--draft' : ''}>
                  <td>{item.date_original}</td>
                  <td>{item.month_day}</td>
                  <td className="admin-table__title-cell">{item.title}</td>
                  <td>{item.source || '-'}</td>
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
