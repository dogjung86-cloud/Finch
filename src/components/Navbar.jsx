import { useState, useEffect } from 'react';

const MENU_ITEMS = [
  { id: 'home', label: '홈' },
  { id: 'games', label: '게임' },
  { id: 'magazine', label: '매거진' },
];

export default function Navbar({ activeSection, onSectionChange, points, level }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__logo" onClick={() => onSectionChange('home')}>
        <span className="navbar__logo-icon">🐦</span>
        <span className="navbar__logo-text">Finch</span>
      </div>

      <ul className="navbar__menu">
        {MENU_ITEMS.map((item) => (
          <li
            key={item.id}
            className={`navbar__menu-item ${activeSection === item.id ? 'navbar__menu-item--active' : ''}`}
            onClick={() => onSectionChange(item.id)}
          >
            {item.label}
          </li>
        ))}
      </ul>

      <div className="navbar__points">
        <div className="navbar__level-badge">
          Lv.{level}
        </div>
        <div className="navbar__points-badge">
          {points.toLocaleString()} P
        </div>
      </div>
    </nav>
  );
}
