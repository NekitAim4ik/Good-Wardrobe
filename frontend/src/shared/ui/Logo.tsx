import { Link } from 'react-router-dom'

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link to="/" className={`logo${inverted ? ' logo--inverted' : ''}`} aria-label="Добрый Шкаф — на главную">
      <span className="logo__mark" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M12 3v18M9 11v2M15 11v2" />
        </svg>
      </span>
      <span>Добрый<br />Шкаф</span>
    </Link>
  )
}