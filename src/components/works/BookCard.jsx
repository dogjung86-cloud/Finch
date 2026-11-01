import { IconArrowUpRight } from '../site/Icons';

export default function BookCard({ book }) {
  const cover = (
    <span className="book__cover">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={book.cover} alt={`${book.title} 표지`} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
    </span>
  );

  return (
    <article className="book book--full" id={book.slug}>
      {cover}
      <div className="book__body">
        <p className="book__meta">
          {book.publisher} · {book.year}
          {book.badge && <span className="book__badge">{book.badge}</span>}
        </p>
        <h3 className="book__title">{book.title}</h3>
        {book.subtitle && <p className="book__sub">{book.subtitle}</p>}
        {book.authors && <p className="book__authors">{book.authors}</p>}
        {book.description && <p className="book__desc">{book.description}</p>}
        {book.links?.length > 0 && (
          <div className="book__buy">
            {book.links.map((l) => (
              <a key={l.href} className="btn btn--outline btn--sm" href={l.href} target="_blank" rel="noopener noreferrer">
                {l.label} <IconArrowUpRight />
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
