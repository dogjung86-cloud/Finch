import DeleteAccountClient from './DeleteAccountClient';

export const metadata = {
  title: '계정 삭제 안내 | Fly Darwin',
  description: 'Fly Darwin 게임의 계정 및 데이터 삭제 절차 안내.',
  alternates: { canonical: '/delete-account' },
};

export default function DeleteAccount() {
  return <DeleteAccountClient />;
}
