import Link from 'next/link';
import { IconArrowRight } from './Icons';

// 섹션 제목: 작은 영문 라벨 + 제목 + (선택) 설명 + 더 보기 링크
export default function SectionHead({ eyebrow, title, desc, more, id, as: Tag = 'h2' }) {
  return (
    <header className="sec-head" data-reveal>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <Tag className="sec-head__title" id={id}>
          {title}
        </Tag>
        {desc && <p className="sec-head__desc">{desc}</p>}
      </div>
      {more &&
        (more.external ? (
          <a href={more.href} className="text-link" target="_blank" rel="noopener noreferrer">
            {more.label} <IconArrowRight />
          </a>
        ) : (
          <Link href={more.href} className="text-link">
            {more.label} <IconArrowRight />
          </Link>
        ))}
    </header>
  );
}
