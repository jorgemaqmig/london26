import { useState, useEffect } from 'react';

export default function Navbar({ days }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      // Detect active section
      const sections = ['hero', ...days.map(d => `day-${d.day}`)];
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200) {
            setActiveSection(sections[i]);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [days]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setMobileOpen(false);
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar">
      <div className="navbar__logo" onClick={() => scrollTo('hero')}>
        🇬🇧 London Memories
      </div>

      <button
        className="navbar__mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <span />
        <span />
        <span />
      </button>

      <ul className={`navbar__links ${mobileOpen ? 'open' : ''}`}>
        {days.map((day) => (
          <li key={day.day}>
            <span
              className={`navbar__link ${activeSection === `day-${day.day}` ? 'active' : ''}`}
              onClick={() => scrollTo(`day-${day.day}`)}
            >
              Día {day.day}
            </span>
          </li>
        ))}
      </ul>
    </nav>
  );
}
