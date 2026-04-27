export default function DeleteAccountPage({ onBack }) {
  return (
    <div className="legal-page">
      <div className="legal-page__inner">
        <button className="legal-page__back" onClick={onBack}>← 홈으로 돌아가기</button>

        <h1 className="legal-page__title">Fly Darwin 계정 삭제 안내</h1>
        <p className="legal-page__updated">최종 수정일: 2026년 4월 27일</p>

        <section className="legal-section">
          <h2>1. 수집되는 데이터</h2>
          <p>Fly Darwin은 게임 진행과 관련된 다음 데이터를 수집합니다.</p>
          <ul>
            <li><strong>계정 정보:</strong> Google 소셜 로그인 시 제공된 이메일 주소</li>
            <li><strong>게임 진행 데이터:</strong> 보유 코인, 해금된 비행체, 업그레이드, 출석/미션 기록</li>
            <li><strong>랭킹 데이터:</strong> 닉네임, 최고 거리, 최종 진화 단계, 도달 레벨</li>
            <li><strong>세션 정보:</strong> 인증 토큰(쿠키/로컬 저장)</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>2. 계정 삭제 방법</h2>
          <p>다음 두 가지 방법 중 편한 방법을 선택하실 수 있습니다.</p>

          <h3>방법 A. 앱 내에서 직접 삭제 (즉시 처리, 권장)</h3>
          <ol>
            <li>Fly Darwin 앱을 실행합니다.</li>
            <li>메인 화면에서 <strong>로그인 버튼</strong>을 눌러 본인 계정으로 로그인합니다.</li>
            <li>로그인 후 동일한 계정 메뉴에서 <strong>"회원 탈퇴"</strong> 버튼을 누릅니다.</li>
            <li>확인 안내창에서 동의하면 즉시 삭제 처리됩니다.</li>
          </ol>
          <p>이 방법으로 계정과 모든 게임 데이터가 즉시 영구 삭제되며, 복구할 수 없습니다.</p>

          <h3>방법 B. 이메일로 삭제 요청 (앱에 접근 불가능한 경우)</h3>
          <p>앱을 사용할 수 없는 상황이라면 다음 이메일로 삭제 요청을 보내주세요.</p>
          <ul>
            <li><strong>요청 이메일:</strong> sciencegive@gmail.com</li>
            <li><strong>제목:</strong> [Fly Darwin] 계정 삭제 요청</li>
            <li><strong>본문에 포함:</strong> 게임 내 닉네임, 가입 시 사용한 Google 이메일 주소</li>
          </ul>
          <p>요청 접수 후 영업일 기준 7일 이내에 처리하고, 완료 시 회신 드립니다.</p>
        </section>

        <section className="legal-section">
          <h2>3. 삭제되는 데이터</h2>
          <p>계정 삭제 시 다음 데이터가 모두 영구 삭제됩니다.</p>
          <ul>
            <li>계정 정보 (이메일, 인증 식별자)</li>
            <li>클라우드 저장된 게임 진행 데이터 (코인, 비행체, 업그레이드, 출석/미션)</li>
            <li>랭킹 보드의 본인 기록</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. 일정 기간 보관되는 데이터</h2>
          <p>관련 법령(통신비밀보호법, 전자상거래법 등)에 따라 일부 정보는 다음 기간 동안 보관될 수 있습니다.</p>
          <ul>
            <li><strong>접속 기록:</strong> 3개월 (통신비밀보호법)</li>
            <li><strong>부정 이용 방지를 위한 최소 식별 정보:</strong> 30일</li>
          </ul>
          <p>위 보관 기간이 경과하면 해당 데이터도 자동으로 파기됩니다.</p>
        </section>

        <section className="legal-section">
          <h2>5. 문의</h2>
          <p>계정 삭제 절차에 대한 문의나 처리 진행 상황 확인은 아래 연락처로 가능합니다.</p>
          <ul>
            <li>이메일: sciencegive@gmail.com</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
