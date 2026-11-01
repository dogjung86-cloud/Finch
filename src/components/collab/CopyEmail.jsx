'use client';

import { useState } from 'react';
import { IconCheck, IconCopy, IconMail } from '../site/Icons';

export default function CopyEmail({ email }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* 복사 불가 환경은 무시 */
    }
  };
  return (
    <div className="copy-email">
      <a className="copy-email__addr" href={`mailto:${email}`}>
        <IconMail /> {email}
      </a>
      <button type="button" className="btn btn--sm" onClick={copy} aria-live="polite">
        {copied ? <IconCheck /> : <IconCopy />} {copied ? '복사했어요' : '주소 복사'}
      </button>
    </div>
  );
}
