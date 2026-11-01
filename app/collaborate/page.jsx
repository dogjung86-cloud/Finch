import PageHead from '../../src/components/site/PageHead';
import CollabForm from '../../src/components/collab/CollabForm';
import CopyEmail from '../../src/components/collab/CopyEmail';
import { COLLAB_KINDS, COLLAB_REFERENCES } from '../../src/data/collab';
import { SITE } from '../../src/data/site';

export const metadata = {
  title: 'Collaborate',
  description: '과학드림 김정훈에게 강연, 방송 출연, 콘텐츠 협업, 자문, 출판 제안을 보내 주세요.',
  alternates: { canonical: '/collaborate' },
  openGraph: {
    title: 'Collaborate | 과학드림',
    description: '강연, 방송 출연, 콘텐츠 협업, 자문, 출판 제안을 기다립니다.',
    url: `${SITE.url}/collaborate`,
    type: 'website',
  },
};

export default function CollaboratePage() {
  return (
    <>
      <PageHead
        eyebrow="Collaborate"
        title="협업 문의"
        lead="강연, 방송 출연, 콘텐츠 협업, 자문까지. 과학을 더 재밌게 전할 수 있는 제안이라면 반갑게 읽어 보겠습니다."
      />

      <section className="container collab-layout" aria-label="협업 제안">
        <aside className="collab-aside">
          <div data-reveal>
            <h2 className="collab-aside__title">이런 제안을 받아요</h2>
            <ul className="collab-kinds">
              {COLLAB_KINDS.filter((k) => k.id !== 'etc').map((k) => (
                <li key={k.id}>
                  <strong>{k.label}</strong>
                  <span>{k.desc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div data-reveal style={{ '--d': '80ms' }}>
            <h2 className="collab-aside__title">함께한 곳</h2>
            <p className="collab-refs">{COLLAB_REFERENCES.join(', ')}</p>
          </div>

          <div data-reveal style={{ '--d': '160ms' }}>
            <h2 className="collab-aside__title">메일로 바로 보내도 돼요</h2>
            <CopyEmail email={SITE.email} />
          </div>
        </aside>

        <div className="collab-main" data-reveal style={{ '--d': '120ms' }}>
          <CollabForm />
        </div>
      </section>
    </>
  );
}
