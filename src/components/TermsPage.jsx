export default function TermsPage({ onBack }) {
  return (
    <div className="legal-page">
      <div className="legal-page__inner">
        <button className="legal-page__back" onClick={onBack}>← 홈으로 돌아가기</button>

        <h1 className="legal-page__title">이용약관</h1>
        <p className="legal-page__updated">최종 수정일: 2026년 3월 23일</p>

        <section className="legal-section">
          <h2>제1조 (목적)</h2>
          <p>이 약관은 과학드림(이하 "회사")이 운영하는 Finch 웹사이트(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
        </section>

        <section className="legal-section">
          <h2>제2조 (정의)</h2>
          <ol>
            <li>"서비스"란 회사가 제공하는 Finch 웹사이트를 통해 이용할 수 있는 모든 서비스를 의미합니다.</li>
            <li>"이용자"란 이 약관에 따라 서비스를 이용하는 모든 사용자를 의미합니다.</li>
            <li>"회원"이란 서비스에 회원가입을 하고 로그인하여 서비스를 이용하는 자를 의미합니다.</li>
            <li>"콘텐츠"란 서비스 내에서 제공되는 게임, 기사, 이미지, 텍스트 등 모든 형태의 정보를 의미합니다.</li>
          </ol>
        </section>

        <section className="legal-section">
          <h2>제3조 (약관의 효력 및 변경)</h2>
          <ol>
            <li>이 약관은 서비스를 이용하는 모든 이용자에게 적용됩니다.</li>
            <li>회사는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 서비스 내 공지합니다.</li>
            <li>이용자가 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단할 수 있습니다.</li>
          </ol>
        </section>

        <section className="legal-section">
          <h2>제4조 (서비스의 제공)</h2>
          <p>회사는 다음과 같은 서비스를 제공합니다:</p>
          <ol>
            <li>과학 교육 관련 웹 게임 서비스 (Fly Darwin 등)</li>
            <li>과학 관련 기획 기사 및 뉴스 콘텐츠</li>
            <li>기타 회사가 정하는 서비스</li>
          </ol>
        </section>

        <section className="legal-section">
          <h2>제5조 (회원가입 및 계정)</h2>
          <ol>
            <li>회원가입은 Google 계정 등 소셜 로그인을 통해 이루어집니다.</li>
            <li>회원은 정확한 정보를 제공해야 하며, 타인의 정보를 도용해서는 안 됩니다.</li>
            <li>회원은 자신의 계정을 관리할 책임이 있으며, 제3자에게 이용을 허락해서는 안 됩니다.</li>
          </ol>
        </section>

        <section className="legal-section">
          <h2>제6조 (이용자의 의무)</h2>
          <p>이용자는 다음 행위를 해서는 안 됩니다:</p>
          <ol>
            <li>타인의 정보를 도용하거나 허위 정보를 등록하는 행위</li>
            <li>서비스의 운영을 방해하거나 비정상적인 방법으로 서비스를 이용하는 행위</li>
            <li>회사 및 타인의 지식재산권을 침해하는 행위</li>
            <li>다른 이용자에 대한 비방, 욕설, 성희롱 등 불건전한 행위</li>
            <li>관련 법령에 위반되는 행위</li>
          </ol>
        </section>

        <section className="legal-section">
          <h2>제7조 (저작권)</h2>
          <ol>
            <li>서비스 내 콘텐츠(게임, 기사, 이미지 등)의 저작권은 회사에 귀속됩니다.</li>
            <li>이용자는 회사의 사전 동의 없이 콘텐츠를 복제, 배포, 수정할 수 없습니다.</li>
            <li>이용자가 작성한 댓글 등의 저작권은 해당 이용자에게 귀속됩니다.</li>
          </ol>
        </section>

        <section className="legal-section">
          <h2>제8조 (면책조항)</h2>
          <ol>
            <li>회사는 천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
            <li>회사는 이용자 간 또는 이용자와 제3자 간의 분쟁에 대해 개입하지 않으며 이에 대한 책임을 지지 않습니다.</li>
            <li>이용자가 서비스를 통해 기대하는 수익이나 결과에 대해 회사는 책임을 지지 않습니다.</li>
          </ol>
        </section>

        <section className="legal-section">
          <h2>제9조 (분쟁 해결)</h2>
          <ol>
            <li>서비스 이용과 관련하여 발생한 분쟁에 대해 회사와 이용자는 성실히 협의합니다.</li>
            <li>협의가 이루어지지 않을 경우, 관할 법원은 민사소송법에 따른 법원으로 합니다.</li>
          </ol>
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
