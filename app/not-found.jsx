import Link from 'next/link';
import { IconArrowRight } from '../src/components/site/Icons';

export const metadata = {
  title: '페이지를 찾을 수 없어요',
};

export default function NotFound() {
  return (
    <section className="notfound">
      <p className="notfound__code">404</p>
      <h1 className="notfound__title">페이지를 찾을 수 없어요</h1>
      <p className="notfound__text">주소가 바뀌었거나 사라진 페이지입니다.</p>
      <Link href="/" className="btn">
        홈으로 가기 <IconArrowRight />
      </Link>
    </section>
  );
}
