'use client';

import { useRef, useState } from 'react';
import { COLLAB_KINDS, PRIVACY_NOTICE } from '../../data/collab';
import { SITE } from '../../data/site';
import { IconArrowRight, IconCheck, IconCopy, IconMail } from '../site/Icons';

const EMPTY = {
  kind: '',
  name: '',
  org: '',
  email: '',
  schedule: '',
  budget: '',
  link: '',
  message: '',
  agree: false,
  website: '', // 스팸 봇 걸러내기용 숨은 칸
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(v) {
  const e = {};
  if (!v.kind) e.kind = '어떤 협업인지 골라 주세요.';
  if (!v.name.trim()) e.name = '이름을 적어 주세요.';
  if (!EMAIL_RE.test(v.email.trim())) e.email = '회신받을 이메일 주소를 확인해 주세요.';
  if (v.message.trim().length < 10) e.message = '내용을 조금만 더 자세히 적어 주세요. (10자 이상)';
  if (!v.agree) e.agree = '개인정보 수집과 이용에 동의해 주세요.';
  return e;
}

function kindLabel(id) {
  return COLLAB_KINDS.find((k) => k.id === id)?.label || '협업';
}

function buildMail(v) {
  const subject = `[협업 제안] ${kindLabel(v.kind)} · ${v.org || v.name}`;
  const lines = [
    `협업 종류: ${kindLabel(v.kind)}`,
    `이름: ${v.name}`,
    v.org ? `소속: ${v.org}` : null,
    `회신 이메일: ${v.email}`,
    v.schedule ? `희망 일정: ${v.schedule}` : null,
    v.budget ? `예산: ${v.budget}` : null,
    v.link ? `참고 링크: ${v.link}` : null,
    '',
    v.message,
  ].filter((x) => x !== null);
  return { subject, body: lines.join('\n') };
}

export default function CollabForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | fallback
  const [copied, setCopied] = useState(false);
  const formRef = useRef(null);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const found = validate(values);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      formRef.current?.querySelector(`[name="${first}"]`)?.focus();
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/collaborate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus('sent');
        return;
      }
      if (data.error === 'invalid' && data.fields) {
        setErrors(data.fields);
        setStatus('idle');
        return;
      }
      setStatus('fallback');
    } catch {
      setStatus('fallback');
    }
  };

  const mail = buildMail(values);
  const mailto = `mailto:${SITE.email}?subject=${encodeURIComponent(mail.subject)}&body=${encodeURIComponent(mail.body)}`;

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* 복사 실패는 조용히 넘어간다 */
    }
  };

  if (status === 'sent') {
    return (
      <div className="collab-form collab-form--done" role="status">
        <p className="collab-form__done-title">고맙습니다!</p>
        <p className="collab-form__done-text">
          보내주신 제안을 잘 받았어요. 확인한 뒤 <strong>{values.email}</strong>로 연락드릴게요.
        </p>
        <button
          type="button"
          className="btn btn--outline"
          onClick={() => {
            setValues(EMPTY);
            setStatus('idle');
          }}
        >
          다른 제안 보내기
        </button>
      </div>
    );
  }

  if (status === 'fallback') {
    return (
      <div className="collab-form collab-form--fallback" role="alert">
        <p className="collab-form__done-title">앗, 바로 보내지 못했어요</p>
        <p className="collab-form__done-text">
          작성하신 내용은 그대로 있어요. 아래 버튼을 누르면 내용이 담긴 메일이 열립니다. 메일 앱이 없다면 내용을 복사해서{' '}
          <strong>{SITE.email}</strong>로 보내 주세요.
        </p>
        <div className="collab-form__fallback-actions">
          <a className="btn" href={mailto}>
            <IconMail /> 메일 앱으로 보내기
          </a>
          <button type="button" className="btn btn--outline" onClick={() => copy(`${mail.subject}\n\n${mail.body}`)}>
            {copied ? <IconCheck /> : <IconCopy />} {copied ? '복사했어요' : '내용 복사'}
          </button>
          <button type="button" className="btn btn--outline" onClick={() => setStatus('idle')}>
            양식으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const err = (key) =>
    errors[key] ? (
      <span className="field__error" id={`err-${key}`}>
        {errors[key]}
      </span>
    ) : null;
  const aria = (key) => ({
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? `err-${key}` : undefined,
  });

  return (
    <form ref={formRef} className="collab-form" onSubmit={onSubmit} noValidate>
      <p className="collab-form__sub">* 표시한 칸만 채워도 충분해요.</p>

      <fieldset className="field field--kinds">
        <legend className="field__label">
          어떤 협업인가요? <b aria-hidden="true">*</b>
        </legend>
        <div className="kind-chips">
          {COLLAB_KINDS.map((k) => (
            <label key={k.id} className={`kind-chip${values.kind === k.id ? ' is-on' : ''}`}>
              <input type="radio" name="kind" value={k.id} checked={values.kind === k.id} onChange={set('kind')} />
              <span className="kind-chip__label">{k.label}</span>
              <span className="kind-chip__desc">{k.desc}</span>
            </label>
          ))}
        </div>
        {err('kind')}
      </fieldset>

      <div className="field-row">
        <label className="field">
          <span className="field__label">
            이름 <b aria-hidden="true">*</b>
          </span>
          <input name="name" value={values.name} onChange={set('name')} autoComplete="name" maxLength={60} {...aria('name')} />
          {err('name')}
        </label>
        <label className="field">
          <span className="field__label">소속</span>
          <input
            name="org"
            value={values.org}
            onChange={set('org')}
            autoComplete="organization"
            placeholder="회사, 기관, 학교 등"
            maxLength={100}
          />
        </label>
      </div>

      <label className="field">
        <span className="field__label">
          회신받을 이메일 <b aria-hidden="true">*</b>
        </span>
        <input
          name="email"
          type="email"
          value={values.email}
          onChange={set('email')}
          autoComplete="email"
          inputMode="email"
          maxLength={120}
          {...aria('email')}
        />
        {err('email')}
      </label>

      <div className="field-row">
        <label className="field">
          <span className="field__label">희망 일정</span>
          <input name="schedule" value={values.schedule} onChange={set('schedule')} placeholder="예: 12월 중순, 평일 오후" maxLength={100} />
        </label>
        <label className="field">
          <span className="field__label">예산</span>
          <input name="budget" value={values.budget} onChange={set('budget')} placeholder="정해진 범위가 있다면" maxLength={100} />
        </label>
      </div>

      <label className="field">
        <span className="field__label">
          제안 내용 <b aria-hidden="true">*</b>
        </span>
        <textarea
          name="message"
          rows={7}
          value={values.message}
          onChange={set('message')}
          placeholder="행사나 프로젝트 소개, 대상과 규모, 바라는 점을 자유롭게 적어 주세요."
          maxLength={5000}
          {...aria('message')}
        />
        {err('message')}
      </label>

      <label className="field">
        <span className="field__label">참고 링크</span>
        <input name="link" type="url" value={values.link} onChange={set('link')} placeholder="https://" maxLength={300} />
      </label>

      {/* 사람은 보지 못하는 칸. 봇이 채우면 조용히 무시한다 */}
      <div className="hp" aria-hidden="true">
        <label>
          웹사이트
          <input name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
        </label>
      </div>

      <div className="consent">
        <label className="consent__check">
          <input name="agree" type="checkbox" checked={values.agree} onChange={set('agree')} {...aria('agree')} />
          <span>
            개인정보 수집과 이용에 동의합니다 <b aria-hidden="true">*</b>
          </span>
        </label>
        <p className="consent__notice">
          수집 항목: {PRIVACY_NOTICE.items} · 목적: {PRIVACY_NOTICE.purpose} · 보유 기간: {PRIVACY_NOTICE.retention}
        </p>
        {err('agree')}
      </div>

      <button type="submit" className="btn btn--lg collab-form__submit" disabled={status === 'sending'}>
        {status === 'sending' ? '보내는 중…' : '제안 보내기'} {status !== 'sending' && <IconArrowRight />}
      </button>
    </form>
  );
}
