export default function PrivacyPage({ onBack }) {
  return (
    <div className="legal-page">
      <div className="legal-page__inner">
        <button className="legal-page__back" onClick={onBack}>← 홈으로 돌아가기</button>

        <h1 className="legal-page__title">개인정보처리방침</h1>
        <p className="legal-page__updated">최종 수정일: 2026년 3월 23일</p>

        <section className="legal-section">
          <h2>1. 개인정보의 수집 및 이용 목적</h2>
          <p>과학드림(이하 "회사")은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
          <ul>
            <li><strong>회원 가입 및 관리:</strong> 회원제 서비스 이용에 따른 본인 확인, 회원자격 유지·관리</li>
            <li><strong>서비스 제공:</strong> 콘텐츠 제공, 게임 서비스 이용 기록 관리</li>
            <li><strong>고충 처리:</strong> 민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>2. 수집하는 개인정보 항목</h2>
          <p>회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:</p>
          <table className="legal-table">
            <thead>
              <tr>
                <th>수집 방법</th>
                <th>수집 항목</th>
                <th>수집 목적</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Google 소셜 로그인</td>
                <td>이메일 주소, 이름, 프로필 사진</td>
                <td>회원 식별 및 서비스 제공</td>
              </tr>
              <tr>
                <td>서비스 이용 시 자동 수집</td>
                <td>접속 로그, 쿠키, 접속 IP, 브라우저 정보</td>
                <td>서비스 분석 및 개선</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="legal-section">
          <h2>3. 개인정보의 보유 및 이용 기간</h2>
          <p>회사는 법령에 따른 개인정보 보유·이용 기간 또는 이용자로부터 개인정보 수집 시 동의받은 개인정보 보유·이용 기간 내에서 개인정보를 처리·보유합니다.</p>
          <ul>
            <li><strong>회원 정보:</strong> 회원 탈퇴 시까지</li>
            <li><strong>접속 기록:</strong> 3개월 (통신비밀보호법)</li>
            <li><strong>표시/광고에 관한 기록:</strong> 6개월 (전자상거래법)</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. 개인정보의 제3자 제공</h2>
          <p>회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:</p>
          <ul>
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. 개인정보의 파기</h2>
          <p>회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</p>
          <ul>
            <li><strong>전자적 파일:</strong> 복구 및 재생이 불가능하도록 안전하게 삭제</li>
            <li><strong>기록물, 인쇄물:</strong> 분쇄기로 파쇄하거나 소각</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. 개인정보의 안전성 확보 조치</h2>
          <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
          <ul>
            <li>개인정보의 암호화 (Supabase 보안 인증 시스템 사용)</li>
            <li>해킹 등에 대비한 기술적 대책 (SSL/TLS 암호화 통신)</li>
            <li>개인정보에 대한 접근 제한</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>7. 쿠키(Cookie)의 사용</h2>
          <p>회사는 이용자에게 개별적인 맞춤 서비스를 제공하기 위해 이용 정보를 저장하고 수시로 불러오는 쿠키를 사용합니다. 이용자는 웹 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 서비스 이용에 어려움이 있을 수 있습니다.</p>
        </section>

        <section className="legal-section">
          <h2>8. 이용자의 권리·의무 및 행사 방법</h2>
          <p>이용자는 언제든지 자신의 개인정보에 대해 다음의 권리를 행사할 수 있습니다:</p>
          <ul>
            <li>개인정보 열람 요구</li>
            <li>오류 등이 있을 경우 정정 요구</li>
            <li>삭제 요구</li>
            <li>처리 정지 요구</li>
          </ul>
          <p>위 권리 행사는 이메일(sciencegive@gmail.com)을 통하여 하실 수 있습니다.</p>
        </section>

        <section className="legal-section">
          <h2>9. 개인정보 보호책임자</h2>
          <table className="legal-table">
            <tbody>
              <tr>
                <td><strong>이름</strong></td>
                <td>김정훈</td>
              </tr>
              <tr>
                <td><strong>직책</strong></td>
                <td>대표</td>
              </tr>
              <tr>
                <td><strong>이메일</strong></td>
                <td>sciencegive@gmail.com</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="legal-section">
          <h2>10. 개인정보 처리방침 변경</h2>
          <p>이 개인정보처리방침은 2026년 3월 23일부터 적용됩니다. 변경사항이 있을 경우, 서비스 내 공지사항을 통하여 고지할 것입니다.</p>
        </section>

        <div className="legal-section legal-section--info">
          <p><strong>과학드림</strong></p>
          <p>대표: 김정훈</p>
          <p>주소: 경기도 시흥시 능곡번영길 30, 7층 710-4</p>
          <p>사업자등록번호: 105-26-94462</p>
          <p>이메일: sciencegive@gmail.com</p>
        </div>
      </div>
    </div>
  );
}
